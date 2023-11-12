package main

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"csgo-2d-demo-player/pkg/provider/steam"
	"fmt"
	"net/http"

	"github.com/alexflint/go-arg"
	"go.uber.org/zap"
)

var config *conf.Conf
var faceitClient *faceit.FaceitClient
var steamClient *steam.SteamClient

func main() {
	config = &conf.Conf{}
	arg.MustParse(config)

	log.Init(config)
	defer log.Close()

	log.L().Debug("using config", zap.Any("config", config))
	server()
}

func server() {
	mux := http.NewServeMux()

	mux.Handle("/assets/", http.StripPrefix("/assets", http.FileServer(http.Dir("./assets"))))
	mux.Handle("/", http.FileServer(http.Dir("web/index/build")))
	log.L().Info("HTTP server listening on ...", zap.String("listen", config.Listen), zap.Int("port", config.Port))
	// log.Println("Listening on ", config.Port, " ...")
	listenErr := http.ListenAndServe(fmt.Sprintf("%s:%d", config.Listen, config.Port), mux)
	log.L().Fatal("failed to listen", zap.Error(listenErr))
}
