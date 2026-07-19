package main

import (
	"testing"

	"go.uber.org/zap"
)

func TestMatchId(t *testing.T) {
	testMatch := func(input string, expected string) {
		matched := extractMatchId(input)
		if matched != expected {
			t.Logf("%s didn't match expected %s", matched, expected)
			t.Fail()
		}
	}

	expected := "1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1"

	testMatch("/cs2/1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem.zst?fshquiojfqos", expected)
	testMatch("/cs2/1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem.zst", expected)
	testMatch("/cs2/12-e9789885-ebda-4f07-90de-8e38d73e174b-1-12.dem.zst", "")
}

func TestSecureDemoURLAllowsValveReplayHosts(t *testing.T) {
	urls := []string{
		"http://replay392.valve.net/730/003831973762123694143_1839286853.dem.bz2",
		"http://replay406.valve.net/730/003831784903821755073_2010893155.dem.bz2",
	}

	for _, isDev := range []bool{false, true} {
		for _, demoURL := range urls {
			t.Run(demoURL, func(t *testing.T) {
				actual, err := secureDemoUrl(demoURL, isDev)
				if err != nil {
					t.Fatalf("secureDemoUrl() returned an error: %v", err)
				}
				if actual != demoURL {
					t.Fatalf("secureDemoUrl() = %q, want %q", actual, demoURL)
				}
			})
		}
	}
}

func TestSecureDemoURLRejectsNonValveReplayURLs(t *testing.T) {
	logger = zap.NewNop()

	urls := []string{
		"http://replay392.valve.net.evil.example/730/003831973762123694143_1839286853.dem.bz2",
		"http://replay392.valve.net/730/not-a-demo.dem.bz2",
		"http://replay392.valve.net:8080/730/003831973762123694143_1839286853.dem.bz2",
		"http://replay392.valve.net/730/003831973762123694143_1839286853.dem.bz2?unexpected=query",
	}

	for _, demoURL := range urls {
		t.Run(demoURL, func(t *testing.T) {
			if _, err := secureDemoUrl(demoURL, false); err == nil {
				t.Fatal("secureDemoUrl() accepted an unsafe Valve replay URL")
			}
		})
	}
}

func TestDemoFilename(t *testing.T) {
	filename := demoFilename("http://replay392.valve.net/730/003831973762123694143_1839286853.dem.bz2")
	if filename != "003831973762123694143_1839286853.dem.bz2" {
		t.Fatalf("demoFilename() = %q", filename)
	}
}
