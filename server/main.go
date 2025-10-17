package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Methods", "GET")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	urlParam := r.URL.Query().Get("url")
	if urlParam == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	parsedURL, err := url.Parse(urlParam)
	if err != nil {
		log.Printf("Invalid URL: %s, error: %v", urlParam, err)
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	// Allow only http and https schemes
	if parsedURL.Scheme != "https" {
		log.Printf("Forbidden scheme: %s", parsedURL.Scheme)
		http.Error(w, "Forbidden scheme", http.StatusBadRequest)
		return
	}

	// Optional: Enforce URL length limit
	if len(urlParam) > 2048 {
		http.Error(w, "URL too long", http.StatusBadRequest)
		return
	}

	// Whitelist of allowed hosts
	allowedHosts := []string{
		"demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com",
	}

	// Check that the host is in the allowed list
	allowed := false
	for _, host := range allowedHosts {
		if host == parsedURL.Host {
			allowed = true
			break
		}
	}
	if !allowed {
		log.Printf("Forbidden host: %s", parsedURL.Host)
		http.Error(w, "Forbidden host", http.StatusBadRequest)
		return
	}

	log.Printf("Incoming request to /download: %s %s from %s, User-Agent: %s, Query: %s", r.Method, r.URL.Path, r.RemoteAddr, r.Header.Get("User-Agent"), r.URL.RawQuery)

	resp, err := http.Get(parsedURL.String())
	if err != nil {
		log.Printf("Error fetching URL %s: %v", parsedURL.String(), err)
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Non-OK status from URL %s: %d", parsedURL.String(), resp.StatusCode)
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.Header().Set("Content-Disposition", resp.Header.Get("Content-Disposition"))

	_, err = io.Copy(w, resp.Body)
	if err != nil {
		log.Printf("Error copying response: %v", err)
	}
}

func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Sanitize the path to prevent directory traversal
		path := filepath.Clean(filepath.Join(dir, r.URL.Path))
		rel, err := filepath.Rel(dir, path)
		if err != nil || strings.Contains(rel, "..") {
			http.NotFound(w, r)
			return
		}

		if _, err := os.Stat(path); os.IsNotExist(err) {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
		} else {
			fs.ServeHTTP(w, r)
		}
	})
}

func main() {
	http.HandleFunc("/download", downloadHandler)
	http.Handle("/", spaHandler("../web/dist"))
	http.ListenAndServe(":8080", nil)
}
