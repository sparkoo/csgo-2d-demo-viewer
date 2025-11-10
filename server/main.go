package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"
)

var isDev bool

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	if isDev {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	}
	w.Header().Set("Access-Control-Expose-Headers", "X-Demo-Length")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	urlParam := r.URL.Query().Get("url")
	if urlParam == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	var demoUrl string
	var errDemoUrl error
	if isDev {
		demoUrl = urlParam
	} else {
		demoUrl, errDemoUrl = secureDemoUrl(urlParam)
		if errDemoUrl != nil {
			log.Printf("Failed to construct the url: %v", errDemoUrl)
			http.Error(w, "Failed to construct the url", http.StatusInternalServerError)
			return
		}
	}

	log.Printf("Incoming request to /download: %s %s from %s, User-Agent: %s, Query: %s", r.Method, r.URL.Path, r.RemoteAddr, r.Header.Get("User-Agent"), r.URL.RawQuery)

	// Create a custom HTTP client with timeout and no redirects
	client := &http.Client{
		Timeout: 60 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return errors.New("redirects not allowed")
		},
	}

	resp, err := client.Get(demoUrl)
	if err != nil {
		log.Printf("Error fetching URL %s: %v", demoUrl, err)
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Non-OK status from URL %s: %d", demoUrl, resp.StatusCode)
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	matchId := extractMatchId(demoUrl)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.dem.zst"`, matchId))
	if contentLength := resp.Header.Get("Content-Length"); contentLength != "" {
		w.Header().Set("X-Demo-Length", contentLength)
	}

	// Stream the response in chunks
	buf := make([]byte, 32*1024) // 32KB buffer
	for {
		n, err := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := w.Write(buf[:n]); writeErr != nil {
				log.Printf("Error writing response: %v", writeErr)
				return
			}
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush() // Flush immediately for streaming
			}
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			log.Printf("Error reading response: %v", err)
			return
		}
	}
}

var validPaths = []string{"/", "/player"}

func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Sanitize the path to prevent directory traversal
		path := filepath.Clean(filepath.Join(dir, r.URL.Path))
		rel, pathFormatErr := filepath.Rel(dir, path)

		if pathFormatErr != nil || strings.Contains(rel, "..") {
			http.NotFound(w, r)
			return
		}

		// check if the file from path exists
		if _, filePathErr := os.Stat(path); filePathErr != nil {
			if os.IsNotExist(filePathErr) && slices.Contains(validPaths, r.URL.Path) {
				// serve index on listed paths
				http.ServeFile(w, r, filepath.Join(dir, "index.html"))
				return
			}

			http.NotFound(w, r)
			return
		}

		// serve real existing file
		fs.ServeHTTP(w, r)
	})
}

func secureDemoUrl(urlParam string) (string, error) {

	parsedURL, err := url.Parse(urlParam)
	if err != nil {
		log.Printf("Invalid URL: %s, error: %v", urlParam, err)
		return "", err
	}

	// Forbid URLs with '#' to prevent fragment-based attacks
	if strings.Contains(urlParam, "#") {
		log.Printf("Forbidden URL with fragment: %s", urlParam)
		return "", fmt.Errorf("forbidden URL with fragment: %s", urlParam)
	}

	// Allow only http and https schemes
	if parsedURL.Scheme != "https" {
		log.Printf("Forbidden scheme: %s", parsedURL.Scheme)
		return "", fmt.Errorf("forbidden scheme: %s", parsedURL.Scheme)
	}

	// Optional: Enforce URL length limit
	if len(urlParam) > 2048 {
		return "", fmt.Errorf("too long URL")
	}

	// Whitelist of allowed hosts
	allowedHosts := []string{
		"demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com",
	}

	// Check that the host is in the allowed list
	allowed := false
	hostId := -1
	for i, host := range allowedHosts {
		if host == parsedURL.Host {
			allowed = true
			hostId = i
			break
		}
	}
	if !allowed {
		log.Printf("Forbidden host: %s", parsedURL.Host)
		return "", fmt.Errorf("forbidden host %v", parsedURL.Host)
	}

	matchId := extractMatchId(parsedURL.Path)
	if matchId == "" {
		return "", fmt.Errorf("no match id found in path %s", parsedURL.Path)
	}

	return fmt.Sprintf("https://%s/cs2/%s.dem.zst?%s", allowedHosts[hostId], matchId, parsedURL.RawQuery), nil
}

func extractMatchId(in string) string {
	re := regexp.MustCompile(`\/(\d-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-\d-\d)\.`)
	matches := re.FindStringSubmatch(in)
	if len(matches) < 2 {
		return ""
	}
	return matches[1]
}

func main() {
	dev := flag.Bool("dev", false, "enable dev mode")
	flag.Parse()
	isDev = *dev

	http.HandleFunc("/download", downloadHandler)
	http.Handle("/", spaHandler("../web/dist"))

	if *dev {
		http.Handle("/testdemos/", http.StripPrefix("/testdemos/", http.FileServer(http.Dir("./testdemos"))))
	}

	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
