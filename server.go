package main

import (
	"csgo/parser"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"html/template"
	"log"
	"net/http"
)

const port string = ":8080"

func main() {
	out := make(chan wsutil.Message)
	in := make(chan wsutil.Message)
	go handleMessages(in, out)

	server(out, in)
}

func handleMessages(in chan wsutil.Message, out chan wsutil.Message) {
	for msg := range in {
		log.Printf("received '%v'", string(msg.Payload))
		switch string(msg.Payload) {
		case "parse":
			go parse(out)
		}
	}
}

func server(out chan wsutil.Message, in chan wsutil.Message) {
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/index.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	http.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
		conn, _, _, err := ws.UpgradeHTTP(request, writer)
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		// out routine
		go func() {
			defer conn.Close()

			for msg := range out {
				log.Printf("Sending: '%v'\n", msg)
				err = wsutil.WriteServerMessage(conn, msg.OpCode, msg.Payload)
				if err != nil {
					log.Println(err)
				}
			}
		}()

		// in routine
		go func() {
			defer conn.Close()

			for {
				msg, op, err := wsutil.ReadClientData(conn)
				if err != nil {
					log.Println(err)
				}
				log.Println(msg)
				in <- wsutil.Message{
					OpCode:  op,
					Payload: msg,
				}
			}
		}()
	})
	log.Println("Listening on ", port, " ...")
	log.Fatal(http.ListenAndServe(port, nil))
}

func parse(out chan wsutil.Message) {
	match, err := parser.Parse("/Users/mvala/Downloads/1-2bf4bbda-1138-42c6-80f1-d5152290a1f1-1-1.dem")
	if err != nil {
		log.Fatalln(err)
	}
	log.Println(match)
}
