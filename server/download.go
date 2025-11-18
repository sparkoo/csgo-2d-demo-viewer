package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"go.uber.org/zap"
)

// downloadHandler handles demo file download requests with proxy functionality
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

	// Validate URL for security, with development-specific allowances
	demoUrl, errDemoUrl := secureDemoUrl(urlParam, isDev)
	if errDemoUrl != nil {
		logger.Error("Failed to construct the url", zap.Error(errDemoUrl))
		http.Error(w, "Failed to construct the url", http.StatusBadRequest)
		return
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

// secureDemoUrl validates and constructs a secure demo URL from user input
func secureDemoUrl(urlParam string, isDev bool) (string, error) {
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

	// Optional: Enforce URL length limit
	if len(urlParam) > 2048 {
		return "", fmt.Errorf("too long URL")
	}

	// In development mode, only allow http://localhost:8080
	if isDev {
		if parsedURL.Scheme != "http" {
			logger.Warn("Development mode: forbidden scheme", zap.String("scheme", parsedURL.Scheme))
			return "", fmt.Errorf("development mode: only http scheme allowed, got: %s", parsedURL.Scheme)
		}
		if parsedURL.Host != "localhost:8080" {
			logger.Warn("Development mode: forbidden host", zap.String("host", parsedURL.Host))
			return "", fmt.Errorf("development mode: only localhost:8080 is allowed, got: %s", parsedURL.Host)
		}
		// In dev mode, return the URL as-is (already validated above)
		return urlParam, nil
	}

	// Production mode: only allow https and strict whitelist of allowed hosts
	if parsedURL.Scheme != "https" {
		logger.Warn("Production mode: forbidden scheme", zap.String("scheme", parsedURL.Scheme))
		return "", fmt.Errorf("production mode: only https scheme allowed, got: %s", parsedURL.Scheme)
	}
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

// extractMatchId extracts the match ID from a demo URL path
func extractMatchId(in string) string {
	re := regexp.MustCompile(`\/(\d-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-\d-\d)\.`)
	matches := re.FindStringSubmatch(in)
	if len(matches) < 2 {
		return ""
	}
	return matches[1]
}
