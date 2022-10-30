package faceit

import (
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

const faceitApiUrlBase = "https://open.faceit.com/data/v4"

type FaceitClient struct {
	httpClient *http.Client
	apiKey     string
}

func NewFaceitClient(apiKey string) *FaceitClient {
	return &FaceitClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: time.Second * 60,
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					InsecureSkipVerify: true,
				},
			}},
	}
}

type matchDemo struct {
	DemoUrl []string `json:"demo_url"`
}

var ErrorNoDemo = errors.New("no demo found for this match")

func (f *FaceitClient) DemoStream(matchId string) (io.ReadCloser, error) {
	demoUrl, urlErr := f.getDemoUrl(matchId)
	if urlErr != nil {
		return nil, urlErr
	}

	log.Printf("Reading file '%s'", demoUrl)
	req, reqErr := f.createRequest(demoUrl, false)
	if reqErr != nil {
		return nil, reqErr
	}
	reader, doReqErr := f.doRequestStream(req)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return reader, nil
}

func (f *FaceitClient) getDemoUrl(matchId string) (string, error) {
	url := fmt.Sprintf("%s/matches/%s", faceitApiUrlBase, matchId)
	log.Printf("requesting url '%s'", url)
	req, reqErr := f.createRequest(url, true)
	if reqErr != nil {
		return "", reqErr
	}
	q := req.URL.Query()
	req.URL.RawQuery = q.Encode()
	content, doReqErr := f.doRequest(req)
	if doReqErr != nil {
		return "", doReqErr
	}

	demo := &matchDemo{}
	jsonErr := json.Unmarshal(content, demo)
	if jsonErr != nil {
		return "", jsonErr
	}

	if len(demo.DemoUrl) == 0 {
		return "", ErrorNoDemo
	}

	return demo.DemoUrl[0], nil
}

func (f *FaceitClient) createRequest(url string, auth bool) (*http.Request, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	if auth && f.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+f.apiKey)
	}

	return req, nil
}

func (f *FaceitClient) doRequest(req *http.Request) ([]byte, error) {
	client := &http.Client{
		Timeout: time.Second * 10,
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}}

	var resp *http.Response
	for i := 0; i < 3; i++ {
		var err error
		resp, err = client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		if resp.StatusCode == 200 {
			break
		}
		log.Printf("response code '%d'", resp.StatusCode)
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return body, nil
}

func (f *FaceitClient) doRequestStream(req *http.Request) (io.ReadCloser, error) {
	var resp *http.Response
	for i := 0; i < 3; i++ {
		var err error
		resp, err = f.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		if resp.StatusCode == 200 {
			return resp.Body, nil
		}
		log.Printf("failed request '%+v', resp '%+v'", req, resp)
		resp.Body.Close()
	}

	return nil, fmt.Errorf("failed 3 times to do a request")
}
