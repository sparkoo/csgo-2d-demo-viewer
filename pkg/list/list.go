package list

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"csgo-2d-demo-player/pkg/utils"
	"encoding/json"
	"fmt"
	"net/http"

	"go.uber.org/zap"
)

type ListService struct {
	Conf         *conf.Conf
	FaceitClient *faceit.FaceitClient
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	log.L().Debug("listing matches")
	utils.CorsDev(w, r, s.Conf)

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

	if errWriteJsonResponse := writeJsonResponse(w, matches); errWriteJsonResponse != nil {
		log.L().Error("failed to write json response with list of matches", zap.Error(errWriteJsonResponse))
	}
}

func (s *ListService) MatchDetails(w http.ResponseWriter, r *http.Request) {
	log.L().Debug("getting match details")
	utils.CorsDev(w, r, s.Conf)

	queryVals := r.URL.Query()

	platform := queryVals.Get("platform")

	if platform != "faceit" {
		log.L().Error("unexpected platform name. Expected 'faceit'.")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	match, errMatchDetail := s.FaceitClient.MatchDetails(r.Body)
	if errMatchDetail != nil {
		log.L().Error("failed to get faceit match detail", zap.Error(errMatchDetail))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	if errWriteJsonResponse := writeJsonResponse(w, match); errWriteJsonResponse != nil {
		log.L().Error("failed to write json response with match detail", zap.Error(errWriteJsonResponse))
	}
}

func writeJsonResponse(w http.ResponseWriter, obj any) error {
	matchesJson, errJson := json.Marshal(obj)
	if errJson != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return fmt.Errorf("failed to marshall matches json: %w", errJson)
	}

	if _, errWrite := w.Write(matchesJson); errWrite != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return fmt.Errorf("failed to write matches response:%w", errWrite)
	}
	return nil
}
