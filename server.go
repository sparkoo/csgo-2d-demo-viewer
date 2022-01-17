package main

import (
	"csgo/faceit"
	"csgo/message"
	"csgo/parser"
	"encoding/json"
	"github.com/gorilla/websocket"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"html/template"
	"log"
	"net/http"
)

const port string = ":8080"

func main() {
	out := make(chan []byte)
	in := make(chan []byte)
	go handleMessages(in, out)

	server(out, in)
}

func handleMessages(in chan []byte, out chan []byte) {
	for msg := range in {
		var messageObj message.Message
		err := json.Unmarshal(msg, &messageObj)
		if err != nil {
			log.Print("failed unmarshal websocket message", err)
		}
		switch messageObj.MsgType {
		case message.ParseRequestType:
			go parse(out)
		}
	}
}

func server(out chan []byte, in chan []byte) {
	mux := http.NewServeMux()

	mux.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/list.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}

		faceit.LoadPlayerMatches("d0a85a88-0f69-4671-8f5e-d6dd10b98168")
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

func parse(out chan []byte) {
	err := parser.Parse("bla", func(msg *message.Message, tick demoinfocs.GameState) {
		payload, err := json.Marshal(msg)
		if err != nil {
			log.Fatalln(err)
		}
		out <- payload
	})
	if err != nil {
		log.Fatalln(err)
	}
}
