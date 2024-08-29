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
	"regexp"

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

	if r.Method != "POST" {
		log.L().Info("unexpected upload request method", zap.Any("request", *r))
		return
	}

	// r.ParseMultipartForm(100 << 20)
	file, handler, err := r.FormFile("demoFile")
	if err != nil {
		http.Error(w, fmt.Sprintf("Error Retrieving the File [%s]", err.Error()), http.StatusBadRequest)
		log.L().Error("failed upload file request", zap.Error(err))
		return
	}
	defer file.Close()
	log.L().Info("uploading file", zap.String("filename", handler.Filename), zap.Int64("filesize", handler.Size), zap.Any("mime", handler.Header))
	sampleRegex := regexp.MustCompile(`.dem.gz_[0-9]$`)
	if !sampleRegex.Match([]byte(handler.Filename)) {
		http.Error(w, fmt.Sprintf("unexpected file type [%s]", handler.Filename), http.StatusBadRequest)
		return
	}
	objHandle := s.gcpBucket.Object(handler.Filename)
	log.L().Info("1")
	objWriter := objHandle.NewWriter(r.Context())
	log.L().Info("2")
	// Copy the uploaded file to the created file on the filesystem
	if _, err := io.Copy(objWriter, file); err != nil {

		log.L().Info("3")
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := objWriter.Close(); err != nil {
		log.L().Error("fail to close gcp object writer", zap.Error(err))
	}

	log.L().Info("4")

	fmt.Fprintf(w, "Successfully Uploaded File\n")
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
