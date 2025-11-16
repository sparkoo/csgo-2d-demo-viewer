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
