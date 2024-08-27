package upload

import (
	"csgo-2d-demo-player/pkg/utils"
	"io"
	"net/http"
)

type UploadProvider struct {
	httpClient *http.Client
}

func NewUploadClient() *UploadProvider {
	return &UploadProvider{
		httpClient: utils.CreateHttpClient(),
	}
}

func (p *UploadProvider) DemoStream(matchId string) (io.ReadCloser, error) {
	demoUrl := matchId
	// TODO: verify URL ?

	// log.Printf("Reading file '%s'", demoUrl)
	req, reqErr := utils.CreateRequest(demoUrl, "")
	if reqErr != nil {
		return nil, reqErr
	}
	resp, doReqErr := utils.DoRequest(p.httpClient, req, 200, 3)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return resp.Body, nil
}
