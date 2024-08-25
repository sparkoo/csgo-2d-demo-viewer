package utils

import (
	"crypto/tls"
	"csgo-2d-demo-player/conf"
	"fmt"
	"log"
	"net/http"
	"time"
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

func CreateHttpClient() *http.Client {
	return &http.Client{
		Timeout: time.Second * 120,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}}
}

func CreateRequest(url string, token string) (*http.Request, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	return req, nil
}

func DoRequest(httpClient *http.Client, req *http.Request, expectCode int, retries int) (*http.Response, error) {
	var resp *http.Response
	for i := 0; i < retries; i++ {
		var err error
		resp, err = httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == expectCode {
			return resp, nil
		}
		log.Printf("response code '%d' but expected '%d', trying again '%d/%d'", resp.StatusCode, expectCode, i, retries)
	}

	return resp, fmt.Errorf("failed request with code '%d'", resp.StatusCode)
}
