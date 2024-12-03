package main

import (
	"bytes"
	"compress/gzip"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"fmt"
	"log"
	"syscall/js"
	"time"

	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
)

func main() {
	done := make(chan struct{}, 0)
	fmt.Println("HEHEHEH")
	js.Global().Set("testt", js.FuncOf(testt))
	<-done
}

func testt(this js.Value, args []js.Value) interface{} {
	fmt.Printf("testt: +%v\n", args[0].Get("size"))
	input := make([]byte, args[0].Get("size"))
	js.CopyBytesToGo(input, args[0])

	fmt.Println("fer")

	gzipReader, streamErr := gzip.NewReader(bytes.NewReader(input))
	if streamErr != nil {
		log.Printf("Failed to create gzip reader from demo. %+v", streamErr)
	}

	startTime := time.Now().Local()
	err := parser.Parse(gzipReader, func(msg *message.Message, state demoinfocs.GameState) {
		fmt.Printf("message: %+v \n", msg.MsgType)
	})
	fmt.Printf("parsing took: %s\n", time.Since(startTime))

	if err != nil {
		fmt.Printf("Failed to parse a demo: %+v \n", err)
	}
	fmt.Println("demo parsed?")

	return js.ValueOf("2")
}
