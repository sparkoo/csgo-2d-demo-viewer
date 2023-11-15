package main

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/steamsvc"
	"fmt"
	"net/http"

	"github.com/alexflint/go-arg"
	"go.uber.org/zap"
)

var config *conf.ConfSteamSvc

func main() {
	config = &conf.ConfSteamSvc{}
	arg.MustParse(config)

	log.Init(config.Mode)
	defer log.Close()
	log.L().Debug("using config", zap.Any("config", config))

	client, err := steamsvc.NewSteamClient(config)

	log.L().Debug("hmm, steam", zap.Any("client", client), zap.Error(err))

	server()
}

func server() {
	mux := http.NewServeMux()

	log.L().Info("HTTP server listening on ...", zap.String("listen", config.Listen), zap.Int("port", config.Port))
	// log.Println("Listening on ", config.Port, " ...")
	listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), mux)
	log.L().Fatal("failed to listen", zap.Error(listenErr))
}
