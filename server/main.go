package main

import (
	"flag"
	"fmt"
	"net/http"

	"go.uber.org/zap"
)

var (
	isDev  bool
	logger *zap.Logger
)

// initLogger initializes the zap logger based on the mode (dev or prod)
func initLogger(dev bool) (*zap.Logger, error) {
	var l *zap.Logger
	var err error

	if dev {
		l, err = zap.NewDevelopment()
		if err != nil {
			return nil, err
		}
		l.Info("initialized development logger")
	} else {
		l, err = zap.NewProduction()
		if err != nil {
			return nil, err
		}
		l.Info("initialized production logger")
	}

	return l, nil
}

func main() {
	dev := flag.Bool("dev", false, "enable dev mode")
	flag.Parse()
	isDev = *dev

	// Initialize logger
	var err error
	logger, err = initLogger(isDev)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize logger: %v", err))
	}
	defer logger.Sync()

	http.HandleFunc("/download", downloadHandler)
	http.Handle("/", spaHandler("../web/dist"))

	if *dev {
		http.Handle("/testdemos/", http.StripPrefix("/testdemos/", http.FileServer(http.Dir("./testdemos"))))
	}

	logger.Info("starting server", zap.String("mode", map[bool]string{true: "dev", false: "prod"}[isDev]), zap.Int("port", 8080))
	if err := http.ListenAndServe(":8080", nil); err != nil {
		logger.Fatal("server failed to start", zap.Error(err))
	}
}
