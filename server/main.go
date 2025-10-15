package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "https://faceit.com" || origin == "https://www.faceit.com" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	}
	w.Header().Set("Access-Control-Allow-Methods", "GET")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	url := r.URL.Query().Get("url")
	if url == "" {
		http.Error(w, "Missing url parameter", http.StatusBadRequest)
		return
	}

	log.Printf("Incoming request to /download: %s %s from %s, User-Agent: %s, Query: %s", r.Method, r.URL.Path, r.RemoteAddr, r.Header.Get("User-Agent"), r.URL.RawQuery)

	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching URL %s: %v", url, err)
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("Non-OK status from URL %s: %d", url, resp.StatusCode)
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
		path := filepath.Join(dir, r.URL.Path)
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
