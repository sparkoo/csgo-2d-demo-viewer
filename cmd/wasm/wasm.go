package main

import (
	"bytes"
	"compress/gzip"
	"csgo-2d-demo-player/pkg/message"
	"csgo-2d-demo-player/pkg/parser"
	"fmt"
	"io"
	"log"
	"syscall/js"
	"time"

	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"google.golang.org/protobuf/proto"
)

func main() {
	done := make(chan struct{}, 0)
	fmt.Println("HEHEHEH")
	js.Global().Set("testt", js.FuncOf(testt))
	<-done
}

func testt(this js.Value, args []js.Value) interface{} {
	fmt.Printf("testt: +%v\n", args[0].Get("length"))
	input := make([]byte, args[0].Get("length").Int())
	js.CopyBytesToGo(input, args[0])

	fmt.Println("fer")

	parse(bytes.NewReader(input), args[1])

	return js.ValueOf("2")
}

func parse(input io.Reader, callback js.Value) {
	fmt.Printf("callback? %+v\n", callback)

	gzipReader, streamErr := gzip.NewReader(input)
	if streamErr != nil {
		log.Printf("Failed to create gzip reader from demo. %+v", streamErr)
	}

	startTime := time.Now().Local()
	err := parser.Parse(gzipReader, func(msg *message.Message, state demoinfocs.GameState) {
		fmt.Printf("message: %+v \n", msg.MsgType)

		payload, protoErr := proto.Marshal(msg)
		if protoErr != nil {
			fmt.Printf("failed to marshall the message: %+v %+v\n", msg, protoErr)
		}
		arrayConstructor := js.Global().Get("Uint8Array")
		dataJS := arrayConstructor.New(len(payload))
		js.CopyBytesToJS(dataJS, payload)
		callback.Invoke(dataJS)
	})
	fmt.Printf("parsing took: %s\n", time.Since(startTime))

	if err != nil {
		fmt.Printf("Failed to parse a demo: %+v \n", err)
	}
	fmt.Println("demo parsed?")
}
