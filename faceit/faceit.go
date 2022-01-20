package faceit

import (
	"encoding/json"
	"fmt"
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

func DownloadDemo(matchId string, targetFilename string) error {
	url := fmt.Sprintf("%s/matches/%s", faceitApiUrlBase, matchId)
	log.Printf("requesting url '%s'", url)
	req, reqErr := createRequest(url, true)
	if reqErr != nil {
		return reqErr
	}
	q := req.URL.Query()
	req.URL.RawQuery = q.Encode()
	content, doReqErr := doRequest(req)
	if doReqErr != nil {
		return doReqErr
	}

	demo := &MatchDemo{}
	jsonErr := json.Unmarshal(content, demo)
	if jsonErr != nil {
		return jsonErr
	}

	if len(demo.DemoUrl) == 0 {
		return fmt.Errorf("no demos found for match '%s'", matchId)
	}

	if err := downloadFile(demo.DemoUrl[0], targetFilename); err != nil {
		return err
	}

	return nil
}

func downloadFile(sourceUrl string, target string) error {
	log.Printf("Downloading file '%s' to '%s'", sourceUrl, target)
	req, reqErr := createRequest(sourceUrl, false)
	if reqErr != nil {
		return reqErr
	}
	content, doReqErr := doRequest(req)
	if doReqErr != nil {
		return doReqErr
	}
	writeErr := ioutil.WriteFile(target, content, 0644)
	if writeErr != nil {
		return writeErr
	}
	log.Println("saved")
	return nil
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
	client := &http.Client{Timeout: time.Second * 10}

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
