package parser

import (
	"compress/gzip"
	"csgo-2d-demo-player/pkg/message"
	"fmt"
	"io"
	"strings"

	"github.com/klauspost/compress/zstd"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"google.golang.org/protobuf/proto"
)

func WasmParseDemo(demoFilename string, demoFile io.Reader, callback func(payload []byte)) error {
	decompressedDemo, decompressErr := decompress(demoFilename, demoFile)
	if decompressErr != nil {
		return decompressErr
	}

	return Parse(decompressedDemo, func(msg *message.Message, state demoinfocs.GameState) {
		fmt.Printf("message: %+v \n", msg.MsgType)

		payload, protoErr := proto.Marshal(msg)
		if protoErr != nil {
			fmt.Printf("failed to marshall the message: %+v %+v\n", msg, protoErr)
		}
		callback(payload)
	})
}

func decompress(filename string, demoFile io.Reader) (io.Reader, error) {
	if strings.HasSuffix(filename, ".gz") {
		return gzip.NewReader(demoFile)
	}

	if strings.HasSuffix(filename, ".zst") {
		return zstd.NewReader(demoFile)
	}

	return nil, fmt.Errorf("unsupported file format %s", filename)
}
