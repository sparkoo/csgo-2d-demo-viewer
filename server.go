package main

import (
	"fmt"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	dem "github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs"
	"github.com/markus-wa/demoinfocs-golang/v2/pkg/demoinfocs/events"
	"html/template"
	"log"
	"net/http"
	"os"
)

const port string = ":8080"

type message struct {
	opcode  ws.OpCode
	payload []byte
}

func main() {
	http.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		temp, err := template.ParseFiles("templates/index.html")
		if err != nil {
			http.Error(writer, err.Error(), 500)
		}

		if temp.Execute(writer, nil) != nil {
			http.Error(writer, err.Error(), 500)
		}
	})

	out := make(chan message)
	in := make(chan message)
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
				err = wsutil.WriteServerMessage(conn, msg.opcode, msg.payload)
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
				log.Printf("received '%v'", msg)
				in <- message{
					opcode:  op,
					payload: msg,
				}
			}
		}()
	})
	log.Println("Listening on ", port, " ...")
	log.Fatal(http.ListenAndServe(port, nil))
}

func parse(out chan []byte) {
	f, err := os.Open("d:\\cs\\demos\\1-2358b701-c4b8-4294-86e4-48dfb66eefa2-1-1.dem")
	if err != nil {
		panic(err)
	}
	defer f.Close()

	p := dem.NewParser(f)
	defer p.Close()

	// Register handler on kill events
	p.RegisterEventHandler(func(e events.Kill) {
		var hs string
		if e.IsHeadshot {
			hs = " (HS)"
		}
		var wallBang string
		if e.PenetratedObjects > 0 {
			wallBang = " (WB)"
		}
		fmt.Printf("%s <%v%s%s> %s\n", e.Killer, e.Weapon, hs, wallBang, e.Victim)
		out <- []byte(fmt.Sprintf("%s <%v%s%s> %s\n", e.Killer, e.Weapon, hs, wallBang, e.Victim))
	})

	// Parse to end
	err = p.ParseToEnd()
	if err != nil {
		panic(err)
	}
}
