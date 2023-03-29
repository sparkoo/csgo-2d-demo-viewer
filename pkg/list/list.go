package list

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"encoding/json"
	"net/http"

	"go.uber.org/zap"
)

type ListService struct {
	Conf         *conf.Conf
	FaceitClient *faceit.FaceitClient
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	if s.Conf.Mode == conf.MODE_DEV {
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}

	authInfo, errAuth := auth.GetAuthCookie(auth.AuthCookieName, r, &auth.AuthInfo{})
	if errAuth != nil {
		log.L().Error("failed to get auth cookie when listing matches", zap.Error(errAuth))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if authInfo == nil {
		log.L().Error("authInfo is nil when listing matches")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	matches := s.FaceitClient.ListMatches(authInfo.Faceit)

	matchesJson, errJson := json.Marshal(matches)
	if errJson != nil {
		log.L().Error("failed to marshall matches json", zap.Error(errJson))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if _, errWrite := w.Write(matchesJson); errWrite != nil {
		log.L().Error("failed to write matches response", zap.Error(errWrite))
		w.WriteHeader(http.StatusInternalServerError)
	}
}
