package parser

import (
	"os"
	"testing"
)

// var zstDemofileName = "1-cde451fd-6cd4-4c87-a432-d97d2235021a-1-1.dem.zst"
var zstDemofileName = "1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem.zst"
var gzDemofileName = "1-cde451fd-6cd4-4c87-a432-d97d2235021a-1-1.dem.gz"
var bz2DemofileName = "1-cde451fd-6cd4-4c87-a432-d97d2235021a-1-1.dem.bz2"
var testDemosFolderPath = "../../../testdemos"

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

func TestParseBz2DemoArchive(t *testing.T) {
	demoFile, err := os.Open(testDemosFolderPath + "/" + bz2DemofileName)
	if err != nil {
		t.Skip("failed to open the demo testfile. skipping for now as I have testdemos just locally")
	}
	parseErr := WasmParseDemo(bz2DemofileName, demoFile, func(payload []byte) {})
	if parseErr != nil {
		t.Fatalf("failed to parse the demo: %v", parseErr)
	}
}

func TestEverythingInTestDir(t *testing.T) {
	info, err := os.Stat(testDemosFolderPath)
	if os.IsNotExist(err) {
		t.Skip("testdemos directory does not exist")
	}
	if err != nil {
		t.Fatalf("error checking directory: %v", err)
	}
	if !info.IsDir() {
		t.Skip("testdemos is not a directory")
	}
	entries, err := os.ReadDir(testDemosFolderPath)
	if err != nil {
		t.Fatalf("failed to read directory: %v", err)
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		filename := entry.Name()
		demoFile, err := os.Open(testDemosFolderPath + "/" + filename)
		if err != nil {
			t.Errorf("failed to open %s: %v", filename, err)
			continue
		}
		parseErr := WasmParseDemo(filename, demoFile, func(payload []byte) {})
		demoFile.Close()
		if parseErr != nil {
			t.Errorf("failed to parse %s: %v", filename, parseErr)
		}
	}
}

func TestParseUnarchivedDemFile(t *testing.T) {
	demoFile, err := os.Open(testDemosFolderPath + "/" + "1-e9789885-ebda-4f07-90de-8e38d73e174b-1-1.dem")
	if err != nil {
		t.Skip("failed to open the demo testfile. skipping for now as I have testdemos just locally")
	}
	parseErr := WasmParseDemo("test.dem", demoFile, func(payload []byte) {})
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

func BenchmarkParseDemo(b *testing.B) {
	demoFile, err := os.Open(testDemosFolderPath + "/" + zstDemofileName)
	if err != nil {
		b.Skip("failed to open the demo testfile. skipping for now as I have testdemos just locally")
	}
	defer func() { _ = demoFile.Close() }()

	for i := 0; i < b.N; i++ {
		_, err := demoFile.Seek(0, 0)
		if err != nil {
			b.Fatalf("failed to seek: %v", err)
		}
		parseErr := WasmParseDemo(zstDemofileName, demoFile, func(payload []byte) {})
		if parseErr != nil {
			b.Fatalf("failed to parse the demo: %v", parseErr)
		}
	}
}
