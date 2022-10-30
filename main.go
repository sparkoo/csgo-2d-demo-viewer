package main

import (
	"compress/gzip"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"

	"github.com/alexflint/go-arg"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"google.golang.org/protobuf/proto"
)

var config *conf.Conf
var faceitClient *faceit.FaceitClient

func main() {
	config = &conf.Conf{}
	arg.MustParse(config)
	faceitClient = faceit.NewFaceitClient(config.FaceitApiKey)
	// log.Printf("using config %+v", config)
	server()
}

func handleMessages(in chan []byte, out chan []byte) {
	for msg := range in {
		var messageObj message.Message
		err := json.Unmarshal(msg, &messageObj)
		if err != nil {
			log.Print("failed unmarshal websocket message", err)
		}
		switch messageObj.MsgType {
		case message.Message_PlayRequestType:
			go playDemo(out, messageObj.Demo.MatchId)
		}
	}
}

func server() {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/list.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	mux.HandleFunc("/faceitClientKey", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(config.FaceitClientApiKey))
	})

	playerFileServer := http.FileServer(http.Dir("web/player/build"))
	mux.Handle("/player/", http.StripPrefix("/player", playerFileServer))

	assetsFileServer := http.FileServer(http.Dir("./assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets", assetsFileServer))

	mux.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		// Upgrade our raw HTTP connection to a websocket based one
		upgrader := websocket.Upgrader{}
		if request.Host == "localhost:8080" {
			upgrader.CheckOrigin = func(r *http.Request) bool {
				return true
			}
		}
		conn, err := upgrader.Upgrade(writer, request, nil)
		if err != nil {
			log.Print("Error during connection upgradation:", err)
			return
		}

		out := make(chan []byte)
		in := make(chan []byte)
		go handleMessages(in, out)

		// out routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [out] '%s'", closeErr.Error())
				}
			}()

			for msg := range out {
				err = conn.WriteMessage(websocket.BinaryMessage, msg)
				if err != nil {
					log.Println("Error during message writing:", err)
					break
				}
			}
		}()

		// in routine
		go func() {
			defer func() {
				if closeErr := conn.Close(); closeErr != nil {
					log.Printf("failed to close connection [in] '%s'", closeErr.Error())
				}
			}()

			for {
				_, msg, err := conn.ReadMessage()
				if err != nil {
					log.Println("Error during message reading:", err)
					break
				}
				in <- msg
			}
		}()
	})
	log.Println("Listening on ", config.Port, " ...")
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", config.Port), mux))
}

func playDemo(out chan []byte, matchId string) {
	if matchId == "" {
		sendError("no matchId", out)
		return
	}
	demoFile, closers, err := obtainDemoFile(matchId)
	if err != nil {
		sendError(err.Error(), out)
		return
	}
	defer func() {
		for _, c := range closers {
			if closeErr := c.Close(); closeErr != nil {
				log.Printf("[%s] failed to close resource. %s", matchId, closeErr)
			}
		}
	}()
	err = parser.Parse(demoFile, func(msg *message.Message, tick demoinfocs.GameState) {
		sendMessage(msg, out)
	})
	if err != nil {
		sendError(err.Error(), out)
	}
}

func sendMessage(msg *message.Message, out chan []byte) {
	payload, protoErr := proto.Marshal(msg)
	if protoErr != nil {
		sendError(protoErr.Error(), out)
	}
	out <- payload
}

func sendError(errorMessage string, out chan []byte) {
	log.Printf("sending error to client: '%s'", errorMessage)
	out <- []byte(fmt.Sprintf("{\"msgType\": %d, \"error\": {\"message\": \"%s\"}}", message.Message_ErrorType, errorMessage))
}

func obtainDemoFile(matchId string) (io.Reader, []io.Closer, error) {
	closers := make([]io.Closer, 0)

	demoFileReader, streamErr := faceitClient.DemoStream(matchId)
	if streamErr != nil {
		return nil, closers, streamErr
	}
	closers = append(closers, demoFileReader)

	gzipReader, gzipErr := gzip.NewReader(demoFileReader)
	if gzipErr != nil {
		log.Printf("[%s] Failed to create gzip reader from demo. %s", matchId, gzipErr)
		return nil, closers, gzipErr
	}
	closers = append(closers, gzipReader)
	return gzipReader, closers, gzipErr
}
