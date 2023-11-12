package demoupload

import (
	"csgo-2d-demo-player/conf"
	"csgo-2d-demo-player/pkg/log"
	"csgo-2d-demo-player/pkg/utils"
	"io"
	"net/http"

	"go.uber.org/zap"
)

type DemoUploadSvc struct {
	Conf  *conf.Conf
	UpQue map[string]chan io.ReadCloser
}

func (s *DemoUploadSvc) HandleUpload(w http.ResponseWriter, r *http.Request) {
	utils.CorsDev(w, r, s.Conf)

	if r.Method != "POST" {
		w.Write([]byte("1234"))
		return
	}

	matchId := r.URL.Query().Get("matchId")
	if matchId == "" {
		log.L().Error("missing 'matchId' when uploading demo file")
		w.WriteHeader(http.StatusInternalServerError)
	}
	log.L().Debug("uploading demo file ...", zap.String("matchId", matchId), zap.Int("keys", len(s.UpQue)))

	s.UpQue[matchId] = make(chan io.ReadCloser)
	s.UpQue[matchId] <- r.Body
	delete(s.UpQue, matchId)
}
