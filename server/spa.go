package main

import (
	"net/http"
	"path/filepath"
	"slices"
	"strings"
)

var validPaths = []string{"/", "/player"}

// spaHandler creates an HTTP handler for serving a Single Page Application.
// In production, Firebase Hosting serves all static assets and this handler
// is only reached for /download requests.  It is kept here for local
// development (make server) so the full app can be tested without Firebase.
// Analytics and WASM base URL are injected at build time by Vite plugins, so
// no runtime substitution is needed here.
func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// SPA routes serve index.html
		if slices.Contains(validPaths, r.URL.Path) {
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}

		// Sanitize path to prevent directory traversal
		path := filepath.Clean(filepath.Join(dir, r.URL.Path))
		rel, err := filepath.Rel(dir, path)
		if err != nil || strings.Contains(rel, "..") {
			http.NotFound(w, r)
			return
		}

		fs.ServeHTTP(w, r)
	})
}
