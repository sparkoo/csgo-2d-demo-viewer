package main

import (
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"

	"go.uber.org/zap"
)

var (
	isDev  bool
	logger *zap.Logger
)

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
			logger.Error("Failed to construct the url", zap.Error(errDemoUrl))
			http.Error(w, "Failed to construct the url", http.StatusInternalServerError)
			return
		}
	}

	logger.Info("Incoming request to /download",
		zap.String("method", r.Method),
		zap.String("path", r.URL.Path),
		zap.String("remote_addr", r.RemoteAddr),
		zap.String("user_agent", r.Header.Get("User-Agent")),
		zap.String("query", r.URL.RawQuery))

	// Create a custom HTTP client with timeout and no redirects
	client := &http.Client{
		Timeout: 60 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return errors.New("redirects not allowed")
		},
	}

	resp, err := client.Get(demoUrl)
	if err != nil {
		logger.Error("Error fetching URL", zap.String("url", demoUrl), zap.Error(err))
		http.Error(w, "Failed to fetch URL", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		logger.Error("Non-OK status from URL", zap.String("url", demoUrl), zap.Int("status", resp.StatusCode))
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
				logger.Error("Error writing response", zap.Error(writeErr))
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
			logger.Error("Error reading response", zap.Error(err))
			return
		}
	}
}

var validPaths = []string{"/", "/player"}

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

func secureDemoUrl(urlParam string) (string, error) {

	parsedURL, err := url.Parse(urlParam)
	if err != nil {
		logger.Error("Invalid URL", zap.String("url", urlParam), zap.Error(err))
		return "", err
	}

	// Forbid URLs with '#' to prevent fragment-based attacks
	if strings.Contains(urlParam, "#") {
		logger.Warn("Forbidden URL with fragment", zap.String("url", urlParam))
		return "", fmt.Errorf("forbidden URL with fragment: %s", urlParam)
	}

	// Allow only http and https schemes
	if parsedURL.Scheme != "https" {
		logger.Warn("Forbidden scheme", zap.String("scheme", parsedURL.Scheme))
		return "", fmt.Errorf("forbidden scheme: %s", parsedURL.Scheme)
	}

	// Optional: Enforce URL length limit
	if len(urlParam) > 2048 {
		return "", fmt.Errorf("too long URL")
	}

	// Whitelist of allowed hosts
	allowedHosts := []string{
		"demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com",
		"demos-us-east-faceit-cdn.s3.us-east-005.backblazeb2.com",
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
		logger.Warn("Forbidden host", zap.String("host", parsedURL.Host))
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

	// Initialize logger
	var err error
	if isDev {
		logger, err = zap.NewDevelopment()
		if err != nil {
			panic(fmt.Sprintf("failed to initialize development logger: %v", err))
		}
		logger.Info("initialized development logger")
	} else {
		logger, err = zap.NewProduction()
		if err != nil {
			panic(fmt.Sprintf("failed to initialize production logger: %v", err))
		}
		logger.Info("initialized production logger")
	}
	defer logger.Sync()

	http.HandleFunc("/download", downloadHandler)
	http.Handle("/", spaHandler("../web/dist"))

	if *dev {
		http.Handle("/testdemos/", http.StripPrefix("/testdemos/", http.FileServer(http.Dir("./testdemos"))))
	}

	logger.Info("starting server", zap.String("mode", map[bool]string{true: "dev", false: "prod"}[isDev]), zap.Int("port", 8080))
	if err := http.ListenAndServe(":8080", nil); err != nil {
		logger.Fatal("server failed to start", zap.Error(err))
	}
}
