package list

import (
	"context"
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/list/match"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/utils"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"cloud.google.com/go/storage"
	"go.uber.org/zap"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

type ListService struct {
	conf      *conf.Conf
	gcpClient *storage.Client
	gcpBucket *storage.BucketHandle
}

func NewListService(ctx context.Context, conf *conf.Conf) (*ListService, error) {
	client, err := storage.NewClient(ctx, option.WithCredentialsFile(conf.GcpStorageSAKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create GCP storage client: %w", err)
	}

	return &ListService{
		conf:      conf,
		gcpClient: client,
		gcpBucket: client.Bucket("2d-sparko-demostorage"),
	}, nil
}

func (s *ListService) ListMatches(w http.ResponseWriter, r *http.Request) {
	log.L().Debug("listing matches")
	utils.CorsDev(w, r, s.conf)

	matches := []match.MatchInfo{}

	gcpStorageMatches, gcpErr := s.gcpStorage(r.Context())
	if gcpErr != nil {
		log.L().Error("failed to obtain matches from gcp storage", zap.Error(gcpErr))
	}
	matches = append(matches, gcpStorageMatches...)

	if errWriteJsonResponse := writeJsonResponse(w, matches); errWriteJsonResponse != nil {
		log.L().Error("failed to write json response with list of matches", zap.Error(errWriteJsonResponse))
	}
}

func (s *ListService) UploadMatch(w http.ResponseWriter, r *http.Request) {
	if s.conf.Mode == conf.MODE_DEV {
		w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		w.Header().Set("Access-Control-Allow-Credentials", "true")
	}

	n := r.Form.Get("name")
	// Retrieve the file from form data
	f, h, err := r.FormFile("fileupload")
	if err != nil {
		log.L().Error("something wrong", zap.Error(err))
	}
	defer f.Close()
	path := filepath.Join(".", "files")
	_ = os.MkdirAll(path, os.ModePerm)
	fullPath := path + "/" + n
	file, err := os.OpenFile(fullPath, os.O_WRONLY|os.O_CREATE, os.ModePerm)
	if err != nil {
		log.L().Error("something else wrong", zap.Error(err))
	}
	defer file.Close()
	// Copy the file to the destination path
	_, err = io.Copy(file, f)
	if err != nil {
		log.L().Error("something else even more wrongwrong", zap.Error(err))
	}
	log.L().Info("finally uploadd", zap.String("file", n+filepath.Ext(h.Filename)))

	// obj := s.gcpBucket.Object("test")
	// writer := obj.NewWriter(r.Context())
	// if _, writeErr := fmt.Fprintf(writer, "This is test upload file 2"); writeErr != nil {
	// 	http.Error(w, writeErr.Error(), http.StatusInternalServerError)
	// 	log.L().Error("failed to write to gcp file", zap.Error(writeErr))
	// }
	// if err := writer.Close(); err != nil {
	// 	http.Error(w, err.Error(), http.StatusInternalServerError)
	// 	log.L().Error("failed to close gcp filewriter", zap.Error(err))
	// }
}

func (s *ListService) gcpStorage(ctx context.Context) ([]match.MatchInfo, error) {
	matches := []match.MatchInfo{}

	query := &storage.Query{}
	it := s.gcpBucket.Objects(ctx, query)
	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Println("err when listing files in GCP storage bucket", err)
		}
		log.Printf("got file: %+v", attrs)
		matches = append(matches, match.MatchInfo{DemoLink: attrs.Name})
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
