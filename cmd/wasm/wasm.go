package main

import (
	"fmt"
	"syscall/js"
)

func main() {
	done := make(chan struct{}, 0)
	fmt.Println("HEHEHEH")
	js.Global().Set("testt", js.FuncOf(testt))
	<-done
}

func testt(this js.Value, p []js.Value) interface{} {
	fmt.Println("HGello")
	fmt.Printf("this: %+v\n", this)
	fmt.Printf("p: %+v\n", p)

	return js.ValueOf("2")
}
