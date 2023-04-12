package log

import (
	"csgo-2d-demo-player/conf"
	"fmt"

	"go.uber.org/zap"
)

var logger *zap.Logger

func Init(config *conf.Conf) {
	switch config.Mode {
	case conf.MODE_DEV:
		logger = zap.Must(zap.NewDevelopment())
		logger.Info("initialized development logger")
	case conf.MODE_PROD:
		logger = zap.Must(zap.NewProduction())
		logger.Info("initialized production logger")
	default:
		panic("unknown mode")
	}
}

func Close() {
	errClose := logger.Sync()
	if errClose != nil {
		panic(errClose)
	}
}

func L() *zap.Logger {
	if logger == nil {
		Init(&conf.Conf{Mode: conf.MODE_DEV})
	}
	return logger
}

func Print(msg string, err error) {
	logger.Info(msg, zap.Error(err))
}

func Printf(msg string, args ...any) {
	logger.Info(fmt.Sprintf(msg, args...))
}

func Println(msg string, err error) {
	logger.Info(msg, zap.Error(err))
}
