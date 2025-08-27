package main

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"fmt"
	"net/http"

	"github.com/alexflint/go-arg"
	"go.uber.org/zap"
)

var config *conf.Conf

func main() {
	config = &conf.Conf{}
	arg.MustParse(config)

	log.Init(config.Mode)
	defer log.Close()

	log.L().Debug("using config", zap.Any("config", config))
	// log.Printf("using config %+v", config)
	server()
}

func server() {
	mux := http.NewServeMux()

	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("./web/dist/assets"))))
	mux.Handle("/wasm/", http.StripPrefix("/wasm", http.FileServer(http.Dir("./web/dist/wasm"))))
	fs := http.FileServer(http.Dir("web/dist"))
	mux.Handle("/", fs)
	mux.Handle("/player", http.StripPrefix("/player", fs))

	log.L().Info("HTTP server listening on ...", zap.String("listen", config.Listen), zap.Int("port", config.Port))
	// log.Println("Listening on ", config.Port, " ...")
	listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), mux)
	log.L().Fatal("failed to listen", zap.Error(listenErr))
}
