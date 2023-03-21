package list

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"encoding/json"
	"net/http"
	"time"

	"go.uber.org/zap"
)

type ListService struct {
	conf *conf.Conf
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	if s.conf.Mode == conf.MODE_DEV {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}

	matches := []MatchInfo{
		{
			Id:       "ahahaha",
			DateTime: time.Now().String(),
			Map:      "de_inferno",
			TeamA:    "Lofu",
			TeamB:    "Bofu",
			ScoreA:   16,
			ScoreB:   6,
		},
		{
			Id:       "ehehe",
			DateTime: time.Now().Add(-2 * time.Hour).String(),
			Map:      "de_nuke",
			TeamA:    "Lofu",
			TeamB:    "Bofu 2",
			ScoreA:   4,
			ScoreB:   16,
		},
	}

	matchesJson, errJson := json.Marshal(matches)
	if errJson != nil {
		log.L().Error("failed to marshall matches json", zap.Error(errJson))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(matchesJson)
}
