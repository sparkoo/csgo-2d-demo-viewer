package main

import (
	"compress/gzip"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/faceit"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"html/template"
	"io"
	"log"
	"net/http"
)

var config *conf.Conf

func main() {
	config = conf.ParseArgs()
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
		case message.PlayRequestType:
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

	mux.HandleFunc("/test", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/test.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	mux.HandleFunc("/player", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/player.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	fileserver := http.FileServer(http.Dir("./assets"))
	mux.Handle("/assets/", http.StripPrefix("/assets", fileserver))

	mux.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		// Upgrade our raw HTTP connection to a websocket based one
		upgrader := websocket.Upgrader{}
		upgrader.CheckOrigin = func(r *http.Request) bool {
			if r.Host == "localhost:8080" {
				log.Println("Local development, allowing cross origin ...")
				return true
			}
			return false
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
			defer conn.Close()

			for msg := range out {
				err = conn.WriteMessage(websocket.TextMessage, msg)
				if err != nil {
					log.Println("Error during message writing:", err)
					break
				}
			}
		}()

		// in routine
		go func() {
			defer conn.Close()

			for {
				_, message, err := conn.ReadMessage()
				if err != nil {
					log.Println("Error during message reading:", err)
					break
				}
				in <- message
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
	payload, jsonErr := json.Marshal(msg)
	if jsonErr != nil {
		sendError(jsonErr.Error(), out)
	}
	out <- payload
}

func sendError(errorMessage string, out chan []byte) {
	log.Printf("sending error to client: '%s'", errorMessage)
	out <- []byte(fmt.Sprintf("{\"msgType\": %d, \"error\": {\"message\": \"%s\"}}", message.ErrorType, errorMessage))
}

func obtainDemoFile(matchId string) (io.Reader, []io.Closer, error) {
	closers := make([]io.Closer, 0)

	demoFileReader, streamErr := faceit.DemoStream(matchId)
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
