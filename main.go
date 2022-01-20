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
	demoFile, closer, err := obtainDemoFile(matchId, out)
	if err != nil {
		sendError(err.Error(), out)
		return
	}
	defer closer.Close()
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
	out <- []byte(fmt.Sprintf("{'msgType': 13, 'error': {'message': %s}}", errorMessage))
}

func obtainDemoFile(matchId string, messageChannel chan []byte) (io.Reader, io.Closer, error) {
	demoFileName := fmt.Sprintf("%s/%s.dem.gz", config.Demodir, matchId)

	var demoFile *os.File
	for i := 0; i < 3; i++ {
		var err error
		demoFile, err = os.Open(demoFileName)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				log.Printf("Demo '%s' not found, downloading ...", demoFileName)
				sendMessage(&message.Message{
					MsgType: message.ProgressType,
					Progress: &message.Progress{
						Progress: 0,
						Message:  "Downloading demo ...",
					},
				}, messageChannel)
				dlErr := faceit.DownloadDemo(matchId, demoFileName)
				if dlErr != nil {
					log.Printf("Download demo '%s' failed, trying again ...", demoFileName)
				}
			} else {
				log.Printf("Failed to open demo file '%s'.", demoFileName)
				return nil, nil, err
			}
		} else {
			log.Printf("Demo '%s' found.", demoFileName)
			break
		}
	}
	if demoFile == nil {
		return nil, nil, fmt.Errorf("failed to download the demo '%s'. giving up", matchId)
	}

	r, err := gzip.NewReader(demoFile)
	if err != nil {
		return nil, nil, err
	}
	return r, r, err
}
