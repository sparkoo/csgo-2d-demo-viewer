package faceit

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

//TODO: remove apikey and set it with argument or env
const apikey = "cf0eea4f-fff3-4615-a6f7-d6117591870a"
const faceitApiUrlBase = "https://open.faceit.com/data/v4"

type Match struct {
	date   string
	teamA  string
	teamB  string
	scoreA string
	scoreB string
}

func LoadPlayerMatches(playerId string) []Match {
	req := createRequest(fmt.Sprintf("%s/players/%s/history", faceitApiUrlBase, playerId))
	q := req.URL.Query()
	q.Add("game", "csgo")
	req.URL.RawQuery = q.Encode()
	content := doRequest(req)

	log.Printf("%s", content)

	return make([]Match, 0)
}

func createRequest(url string) *http.Request {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Fatal("Error reading request. ", err)
	}
	req.Header.Set("Authorization", "Bearer "+apikey)

	return req
}

func doRequest(req *http.Request) string {
	client := &http.Client{Timeout: time.Second * 10}

	resp, err := client.Do(req)
	if err != nil {
		log.Fatal("Error reading response. ", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatal("Error reading body. ", err)
	}

	return string(body)
}
