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

//TODO: remove apikey and set it with argument or env
const apikey = "cf0eea4f-fff3-4615-a6f7-d6117591870a"
const faceitApiUrlBase = "https://open.faceit.com/data/v4"

type MatchDemo struct {
	DemoUrl []string `json:"demo_url"`
}

var NoDemoError = errors.New("no demo found for this match")

func DemoStream(matchId string) (io.ReadCloser, error) {
	demoUrl, urlErr := getDemoUrl(matchId)
	if urlErr != nil {
		return nil, urlErr
	}

	log.Printf("Reading file '%s'", demoUrl)
	req, reqErr := createRequest(demoUrl, false)
	if reqErr != nil {
		return nil, reqErr
	}
	reader, doReqErr := doRequestStream(req)
	if doReqErr != nil {
		return nil, doReqErr
	}
	return reader, nil
}

func getDemoUrl(matchId string) (string, error) {
	url := fmt.Sprintf("%s/matches/%s", faceitApiUrlBase, matchId)
	log.Printf("requesting url '%s'", url)
	req, reqErr := createRequest(url, true)
	if reqErr != nil {
		return "", reqErr
	}
	q := req.URL.Query()
	req.URL.RawQuery = q.Encode()
	content, doReqErr := doRequest(req)
	if doReqErr != nil {
		return "", doReqErr
	}

	demo := &MatchDemo{}
	jsonErr := json.Unmarshal(content, demo)
	if jsonErr != nil {
		return "", jsonErr
	}

	if len(demo.DemoUrl) == 0 {
		return "", NoDemoError
	}

	return demo.DemoUrl[0], nil
}

func createRequest(url string, auth bool) (*http.Request, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	if auth {
		req.Header.Set("Authorization", "Bearer "+apikey)
	}

	return req, nil
}

func doRequest(req *http.Request) ([]byte, error) {
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

func doRequestStream(req *http.Request) (io.ReadCloser, error) {
	client := &http.Client{
		Timeout: time.Second * 30,
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
		if resp.StatusCode == 200 {
			return resp.Body, nil
		}
		log.Printf("failed request, response code '%d'", resp.StatusCode)
		resp.Body.Close()
	}

	return nil, fmt.Errorf("failed 3 times to do a request")
}
