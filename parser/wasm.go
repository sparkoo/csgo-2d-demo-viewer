package main

import (
	"bytes"
	"csgo-2d-demo-player/pkg/parser"
	"fmt"
	"syscall/js"
)

func main() {
	done := make(chan struct{}, 0)
	fmt.Println("HEHEHEH")
	js.Global().Set("wasmParseDemo", js.FuncOf(wasmParseDemo))
	<-done
}

func wasmParseDemo(this js.Value, args []js.Value) interface{} {
	filename := args[0].String()
	fmt.Printf("parsing demo %s\n", filename)

	callback := args[2]
	demoData := make([]byte, args[1].Get("length").Int())

	js.CopyBytesToGo(demoData, args[1])

	err := parser.WasmParseDemo(filename, bytes.NewReader(demoData), func(payload []byte) {
		arrayConstructor := js.Global().Get("Uint8Array")
		dataJS := arrayConstructor.New(len(payload))
		js.CopyBytesToJS(dataJS, payload)
		callback.Invoke(dataJS)
	})

	if err != nil {
		fmt.Printf("Failed to parse a demo: %+v \n", err)
	}

	return js.ValueOf("2")
}
