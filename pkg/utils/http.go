package utils

import (
	"csgo-2d-demo-player/conf"
	"net/http"
)

func CorsDev(w http.ResponseWriter, r *http.Request, c *conf.Conf) {
	if c.Mode == conf.MODE_DEV {
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}
}
