package main

import (
	"io"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"go.uber.org/zap"
)

func TestDemoFilenameSanitization(t *testing.T) {
	for _, tc := range []struct{ rawURL, want string }{
		{"http://localhost:8080/testdemos/demo.dem.bz2", "demo.dem.bz2"},
		{"http://localhost:8080/testdemos/a%22%0D%0A%5Cb.dem.bz2", "a____b.dem.bz2"},
		{"http://localhost:8080/testdemos/caf%C3%A9.dem.bz2", "caf_.dem.bz2"},
		{"http://localhost:8080", "demo.dem"},
		{"http://localhost:8080/", "demo.dem"},
		{"http://localhost:8080/%zz", "demo.dem"},
	} {
		t.Run(tc.rawURL, func(t *testing.T) {
			if got := demoFilename(tc.rawURL); got != tc.want {
				t.Fatalf("demoFilename() = %q, want %q", got, tc.want)
			}
		})
	}
}

type replayTransport func(*http.Request) (*http.Response, error)

func (f replayTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestDownloadHandlerReplayFormats(t *testing.T) {
	oldTransport, oldLogger, oldDev := http.DefaultTransport, logger, isDev
	t.Cleanup(func() { http.DefaultTransport, logger, isDev = oldTransport, oldLogger, oldDev })
	logger = zap.NewNop()
	isDev = false
	for _, demoURL := range []string{
		"http://replay392.valve.net/730/123_456.dem.bz2",
		"https://demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com/cs2/1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem.zst?token=test",
		"https://demos-us-east-faceit-cdn.s3.us-east-005.backblazeb2.com/cs2/1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem.zst?token=test",
	} {
		t.Run(demoURL, func(t *testing.T) {
			http.DefaultTransport = replayTransport(func(r *http.Request) (*http.Response, error) {
				if r.URL.String() != demoURL {
					t.Fatalf("upstream URL = %q, want %q", r.URL, demoURL)
				}
				return &http.Response{StatusCode: http.StatusOK, Header: http.Header{
					"Content-Type": {"application/octet-stream"}, "Content-Length": {"4"},
				}, Body: io.NopCloser(strings.NewReader("demo"))}, nil
			})
			w := httptest.NewRecorder()
			downloadHandler(w, httptest.NewRequest("GET", "/download?url="+url.QueryEscape(demoURL), nil))
			if w.Code != http.StatusOK || w.Body.String() != "demo" {
				t.Fatalf("response = %d %q", w.Code, w.Body.String())
			}
			mediaType, params, err := mime.ParseMediaType(w.Header().Get("Content-Disposition"))
			if err != nil || mediaType != "attachment" || params["filename"] != demoFilename(demoURL) {
				t.Fatalf("unexpected Content-Disposition: %q (%v)", w.Header().Get("Content-Disposition"), err)
			}
			if w.Header().Get("X-Demo-Length") != "4" ||
				!strings.Contains(w.Header().Get("Access-Control-Expose-Headers"), "Content-Disposition") {
				t.Fatal("download metadata is missing or not exposed to the browser")
			}
		})
	}
}
