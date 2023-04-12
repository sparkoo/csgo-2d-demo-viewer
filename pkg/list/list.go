package list

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/auth"
	"csgo-2d-demo-player/pkg/list/match"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/provider/faceit"
	"csgo-2d-demo-player/pkg/utils"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"go.uber.org/zap"
)

type ListService struct {
	Conf         *conf.Conf
	FaceitClient *faceit.FaceitClient
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	log.L().Debug("listing matches")
	utils.CorsDev(w, r, s.Conf)

	matches := []match.MatchInfo{}

	limitQuery := r.URL.Query().Get("limit")
	if limitQuery == "" {
		limitQuery = "15"
	}

	limit, errConvLimit := strconv.Atoi(limitQuery)
	if errConvLimit != nil {
		log.L().Error("failed to convert limit query", zap.Error(errConvLimit))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	faceitAuthInfo, errAuth := auth.GetAuthCookie(faceit.FaceitAuthCookieName, r, &auth.FaceitAuthInfo{})
	if errAuth != nil {
		log.L().Error("failed to get auth cookie when listing matches", zap.Error(errAuth))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if faceitAuthInfo != nil {
		matches = append(matches, s.FaceitClient.ListMatches(faceitAuthInfo, limit)...)
	} else {
		log.L().Error("authInfo is nil when listing matches")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

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
