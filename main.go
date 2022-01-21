package main

import (
	"compress/gzip"
	"csgo/conf"
	"csgo/faceit"
	"csgo/message"
	"csgo/parser"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
)

const port string = ":8080"

var config *conf.Conf

func main() {
	config = conf.ParseArgs()

	server(handleMessages)
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

func server(messageHandler func(out chan []byte, in chan []byte)) {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/list.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}

		//faceit.LoadPlayerMatches("d0a85a88-0f69-4671-8f5e-d6dd10b98168")
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
	log.Println("Listening on ", port, " ...")
	log.Fatal(http.ListenAndServe(port, mux))
}

func playDemo(out chan []byte, matchId string) {
	demoFile, closers, err := obtainDemoFile(matchId, out)
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
	out <- []byte(fmt.Sprintf("{\"msgType\": %d, \"error\": {\"message\": \"%s\"}}", message.ErrorType, errorMessage))
}

func obtainDemoFile(matchId string, messageChannel chan []byte) (io.Reader, []io.Closer, error) {
	closers := make([]io.Closer, 0)
	demoFileName := fmt.Sprintf("%s/%s.dem.gz", config.Demodir, matchId)

	// try 3 times to download the file
	var demoFile *os.File
	for i := 0; i < 3; i++ {
		var demoOpenErr error
		demoFile, demoOpenErr = os.Open(demoFileName)
		if demoOpenErr != nil {
			if errors.Is(demoOpenErr, os.ErrNotExist) {
				log.Printf("[%s] Demo '%s' not found, downloading ...", matchId, demoFileName)
				sendMessage(&message.Message{
					MsgType: message.ProgressType,
					Progress: &message.Progress{
						Progress: 0,
						Message:  "Downloading demo ...",
					},
				}, messageChannel)
				dlErr := faceit.DownloadDemo(matchId, demoFileName)
				if dlErr != nil {
					if errors.Is(dlErr, faceit.NoDemoError) {
						log.Printf("[%s] no demos found", matchId)
						return nil, closers, dlErr
					}
					log.Printf("[%s] Download demo '%s' failed, trying again ... '%s'", matchId, demoFileName, dlErr)
				}
			} else {
				log.Printf("[%s] Failed to open demo file '%s'. '%s'", matchId, demoFileName, demoOpenErr)
				return nil, closers, demoOpenErr
			}
		} else {
			log.Printf("[%s] Demo '%s' found.", matchId, demoFileName)
			closers = append(closers, demoFile)
			break
		}
	}
	if demoFile == nil {
		return nil, closers, fmt.Errorf("failed to download the demo '%s'. giving up", matchId)
	}

	gzipReader, gzipErr := gzip.NewReader(demoFile)
	if gzipErr != nil {
		log.Printf("[%s] Failed to create gzip reader from demo '%s'. %s", matchId, demoFileName, gzipErr)
		return nil, closers, gzipErr
	}
	closers = append(closers, gzipReader)
	return gzipReader, closers, gzipErr
}
