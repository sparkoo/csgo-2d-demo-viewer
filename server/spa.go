package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"go.uber.org/zap"
)

var validPaths = []string{"/", "/player"}

// spaHandler creates an HTTP handler for serving a Single Page Application
func spaHandler(dir string) http.Handler {
	fs := http.FileServer(http.Dir(dir))
	// Get analytics configuration
	scriptURL, websiteID := getAnalyticsConfig()
	// Get WASM base URL configuration
	wasmBaseURL := getWasmBaseURL()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// For SPA routes, serve index.html with analytics injection
		if slices.Contains(validPaths, r.URL.Path) {
			indexPath := filepath.Join(dir, "index.html")
			htmlContent, err := os.ReadFile(indexPath)
			if err != nil {
				logger.Error("Error reading index.html", zap.Error(err))
				http.NotFound(w, r)
				return
			}

			// Inject analytics script if HTML contains placeholder
			modifiedHTML := injectAnalyticsScript(string(htmlContent), scriptURL, websiteID)

			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write([]byte(modifiedHTML))
			return
		}

		// Serve worker.js with injected WASM base URL
		if r.URL.Path == "/worker.js" {
			workerPath := filepath.Join(dir, "worker.js")
			workerContent, err := os.ReadFile(workerPath)
			if err != nil {
				logger.Error("Error reading worker.js", zap.Error(err))
				http.NotFound(w, r)
				return
			}

			modifiedWorker := injectWasmBaseURL(string(workerContent), wasmBaseURL)

			w.Header().Set("Content-Type", "application/javascript")
			w.Write([]byte(modifiedWorker))
			return
		}

		// For other requests, serve files normally
		// Sanitize the path to prevent directory traversal
		path := filepath.Clean(filepath.Join(dir, r.URL.Path))
		rel, pathFormatErr := filepath.Rel(dir, path)

		if pathFormatErr != nil || strings.Contains(rel, "..") {
			http.NotFound(w, r)
			return
		}

		// serve real existing file
		fs.ServeHTTP(w, r)
	})
}

// getAnalyticsConfig returns Umami analytics configuration from environment variables
func getAnalyticsConfig() (scriptURL, websiteID string) {
	scriptURL = os.Getenv("VITE_UMAMI_SCRIPT_URL")
	websiteID = os.Getenv("VITE_UMAMI_WEBSITE_ID")
	return
}

// getWasmBaseURL returns the base URL for WASM assets from the WASM_BASE_URL environment variable.
// When set, WASM files are loaded from this external URL instead of being served by Cloud Run.
// The URL must end with a trailing slash (e.g. "https://storage.googleapis.com/my-bucket/").
// When empty, WASM files are served from the default relative path.
func getWasmBaseURL() string {
	return os.Getenv("WASM_BASE_URL")
}

// injectWasmBaseURL replaces the __WASM_BASE_URL__ placeholder in worker.js with the actual base URL
func injectWasmBaseURL(workerContent, wasmBaseURL string) string {
	return strings.ReplaceAll(workerContent, "__WASM_BASE_URL__", wasmBaseURL)
}

// injectAnalyticsScript injects Umami analytics script into HTML content
func injectAnalyticsScript(htmlContent, scriptURL, websiteID string) string {
	if scriptURL == "" || websiteID == "" {
		// Remove placeholder if analytics is not configured
		return strings.Replace(htmlContent, "<!-- UMAMI_ANALYTICS_PLACEHOLDER -->", "", 1)
	}

	// Create the analytics script
	analyticsScript := fmt.Sprintf(`<!-- Umami Analytics -->
	<script defer src="%s" data-website-id="%s"></script>`, scriptURL, websiteID)

	// Replace placeholder with actual script
	return strings.Replace(htmlContent, "<!-- UMAMI_ANALYTICS_PLACEHOLDER -->", analyticsScript, 1)
}
