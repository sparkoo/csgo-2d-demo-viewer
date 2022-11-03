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
	logger.Sync()
}

func Get() *zap.Logger {
	if logger == nil {
		panic("logger is not initialized, first call 'log.Init(*conf.Conf)'")
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
