package main

import (
	"testing"
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

func TestInjectWasmBaseURL(t *testing.T) {
	workerTemplate := `const WASM_BASE_URL = "__WASM_BASE_URL__";
importScripts(WASM_BASE_URL + "wasm/wasm_exec.js");
fetch(WASM_BASE_URL + "wasm/csdemoparser.wasm")`

	t.Run("empty base URL leaves placeholder replaced with empty string", func(t *testing.T) {
		result := injectWasmBaseURL(workerTemplate, "")
		expected := `const WASM_BASE_URL = "";
importScripts(WASM_BASE_URL + "wasm/wasm_exec.js");
fetch(WASM_BASE_URL + "wasm/csdemoparser.wasm")`
		if result != expected {
			t.Errorf("expected:\n%s\ngot:\n%s", expected, result)
		}
	})

	t.Run("GCS base URL is injected", func(t *testing.T) {
		gcsURL := "https://storage.googleapis.com/my-bucket/"
		result := injectWasmBaseURL(workerTemplate, gcsURL)
		expected := `const WASM_BASE_URL = "https://storage.googleapis.com/my-bucket/";
importScripts(WASM_BASE_URL + "wasm/wasm_exec.js");
fetch(WASM_BASE_URL + "wasm/csdemoparser.wasm")`
		if result != expected {
			t.Errorf("expected:\n%s\ngot:\n%s", expected, result)
		}
	})
}
