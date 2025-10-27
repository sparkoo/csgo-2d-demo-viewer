package parser

import (
	"compress/bzip2"
	"compress/gzip"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/message"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/klauspost/compress/zstd"
	"github.com/markus-wa/demoinfocs-golang/v5/pkg/demoinfocs"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func WasmParseDemo(demoFilename string, demoFile io.Reader, callback func(payload []byte)) error {
	stopwatch := time.Now()
	log.L().Debug("starting decompressing the demo", zap.String("demo file", demoFilename))
	decompressedDemo, decompressErr := decompress(demoFilename, demoFile)
	if decompressErr != nil {
		return decompressErr
	}
	log.L().Debug("demo decompressed", zap.String("demo file", demoFilename), zap.Duration("took", time.Since(stopwatch)))

	parseStopwatch := time.Now()
	msgStopwatch := time.Now()
	log.L().Debug("starting parsing the demo", zap.String("demo file", demoFilename))
	parseErr := Parse(decompressedDemo, func(msg *message.Message, state demoinfocs.GameState) {
		log.L().Debug("parsed some part", zap.String("message", msg.MsgType.String()), zap.Duration("took", time.Since(msgStopwatch)))

		payload, protoErr := proto.Marshal(msg)
		if protoErr != nil {
			fmt.Printf("failed to marshall the message: %+v %+v\n", msg, protoErr)
		}
		callback(payload)
		msgStopwatch = time.Now()
	})

	log.L().Debug("parsing done", zap.String("demo file", demoFilename), zap.Duration("took", time.Since(parseStopwatch)))
	return parseErr
}

func decompress(filename string, demoFile io.Reader) (io.Reader, error) {
	if strings.HasSuffix(filename, ".gz") {
		return gzip.NewReader(demoFile)
	}

	if strings.HasSuffix(filename, ".zst") {
		return zstd.NewReader(demoFile)
	}

	if strings.HasSuffix(filename, ".bz2") {
		return bzip2.NewReader(demoFile), nil
	}

	return nil, fmt.Errorf("unsupported file format %s", filename)
}
