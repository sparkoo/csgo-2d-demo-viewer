package parser

import (
	"os"
	"testing"
)

// var zstDemofileName = "1-cde451fd-6cd4-4c87-a432-d97d2235021a-1-1.dem.zst"
var zstDemofileName = "1-5264a308-d0ce-4f3b-ac1b-b3e3c7bd6c3a-1-1.dem.zst"
var gzDemofileName = "1-cde451fd-6cd4-4c87-a432-d97d2235021a-1-1.dem.gz"
var testDemosFolderPath = "../../testdemos"

func TestParseZstDemoArchive(t *testing.T) {
	demoFile, err := os.Open(testDemosFolderPath + "/" + zstDemofileName)
	if err != nil {
		t.Skip("failed to open the demo testfile. skipping for now as I have testdemos just locally")
	}
	parseErr := WasmParseDemo(zstDemofileName, demoFile, func(payload []byte) {})
	if parseErr != nil {
		t.Fatalf("failed to parse the demo: %v", parseErr)
	}
}

func TestParseGzDemoArchive(t *testing.T) {
	demoFile, err := os.Open(testDemosFolderPath + "/" + gzDemofileName)
	if err != nil {
		t.Skip("failed to open the demo testfile. skipping for now as I have testdemos just locally")
	}
	parseErr := WasmParseDemo(gzDemofileName, demoFile, func(payload []byte) {})
	if parseErr != nil {
		t.Fatalf("failed to parse the demo: %v", parseErr)
	}
}

func TestParseUnsupportedDemoArchive(t *testing.T) {
	parseErr := WasmParseDemo("not_supported.demo", nil, func(payload []byte) {})
	if parseErr == nil {
		t.Fatalf("parse should fail: %v", parseErr)
	}
}
