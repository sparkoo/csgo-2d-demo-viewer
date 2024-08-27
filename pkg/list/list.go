package list

import (
	"context"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/list/match"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/utils"
	"encoding/json"
	"fmt"
	"net/http"

	"cloud.google.com/go/storage"
	"go.uber.org/zap"
	"google.golang.org/api/iterator"
)

type ListService struct {
	Conf *conf.Conf
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	log.L().Debug("listing matches")
	utils.CorsDev(w, r, s.Conf)

	matches := []match.MatchInfo{}

	gcpStorageMatches, gcpErr := s.gcpStorage()
	if gcpErr != nil {
		log.L().Error("failed to obtain matches from gcp storage", zap.Error(gcpErr))
	}
	matches = append(matches, gcpStorageMatches...)

	if errWriteJsonResponse := writeJsonResponse(w, matches); errWriteJsonResponse != nil {
		log.L().Error("failed to write json response with list of matches", zap.Error(errWriteJsonResponse))
	}
}

func (s *ListService) gcpStorage() ([]match.MatchInfo, error) {
	matches := []match.MatchInfo{}

	ctx := context.Background()
	client, err := storage.NewClient(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCP storage client: %w", err)
	}
	bucket := client.Bucket("2d-sparko-demostorage")

	query := &storage.Query{}
	it := bucket.Objects(ctx, query)
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Println("err when listing files in GCP storage bucket", err)
		}
		matches = append(matches, match.MatchInfo{DemoLink: attrs.Name, TeamA: attrs.Metadata["teamA"]})
	}

	return matches, nil
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
