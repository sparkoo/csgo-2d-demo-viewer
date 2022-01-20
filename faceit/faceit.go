package faceit

import (
	"compress/gzip"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"
)

//TODO: remove apikey and set it with argument or env
const apikey = "cf0eea4f-fff3-4615-a6f7-d6117591870a"
const faceitApiUrlBase = "https://open.faceit.com/data/v4"

type MatchDemo struct {
	DemoUrl []string `json:"demo_url"`
}

func LoadMatch(matchId string) MatchDemo {
	url := fmt.Sprintf("%s/matches/%s", faceitApiUrlBase, matchId)
	log.Printf("requesting url '%s'", url)
	req := createRequest(url)
	q := req.URL.Query()
	req.URL.RawQuery = q.Encode()
	content := doRequest(req)

	demo := &MatchDemo{}
	err := json.Unmarshal(content, demo)
	if err != nil {
		log.Fatalln(err)
	}

	downloadFile(demo.DemoUrl[0], matchId)

	return MatchDemo{}
}

func downloadFile(fileUrl string, matchId string) {
	log.Printf("Downloading file '%s'", fileUrl)
	content := doRequest(createRequest(fileUrl))
	log.Printf("Downloaded '%d' bytes", len(content))
	saveFilePath := fmt.Sprintf("/Users/mvala/tmp/%s.dem.gz", matchId)
	log.Printf("Saving to file '%s'", saveFilePath)
	err := ioutil.WriteFile(saveFilePath, content, 0644)
	if err != nil {
		log.Fatalln(err)
	}
	log.Println("saved")

	log.Println("extracting")
	demoFile, err := os.Open(saveFilePath)
	defer demoFile.Close()
	if err != nil {
		log.Fatalln(err)
	}
	r, err := gzip.NewReader(demoFile)
	if err != nil {
		log.Fatalln(err)
	}

	log.Printf("extracting and writing to file")
	// Empty byte slice.
	result := make([]byte, 1024*1024)
	// Read in data.
	targetFile, err := os.OpenFile(fmt.Sprintf("/Users/mvala/tmp/%s.dem", matchId), os.O_CREATE|os.O_WRONLY, 0644)
	defer targetFile.Close()
	if err != nil {
		log.Fatalln(err)
	}
	for {
		count, err := r.Read(result)
		written, writeErr := targetFile.Write(result)
		if writeErr != nil {
			log.Fatalln(writeErr)
		}
		log.Printf("written '%d'", written)
		if err != nil {
			if err == io.EOF {
				log.Println("end of file")
				break
			}
			log.Fatalln(err)
		}
		// Print our decompressed data.
		log.Printf("extracted '%d'", count)
	}
	log.Printf("done")
	os.Exit(1)
}

func createRequest(url string) *http.Request {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Fatal("Error reading request. ", err)
	}
	req.Header.Set("Authorization", "Bearer "+apikey)

	return req
}

func doRequest(req *http.Request) []byte {
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

	return body
}
