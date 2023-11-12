package utils

import (
	"csgo-2d-demo-player/conf"
	"net/http"
)

func CorsDev(w http.ResponseWriter, r *http.Request, c *conf.Conf) {
	if c.Mode == conf.MODE_DEV {
		w.Header().Add("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Headers", "upload-length")
		w.Header().Add("Access-Control-Allow-Headers", "upload-offset")
		w.Header().Add("Access-Control-Allow-Headers", "content-type")
		w.Header().Add("Access-Control-Allow-Headers", "upload-name")
		w.Header().Add("Access-Control-Allow-Methods", "PATCH")
	}
}
