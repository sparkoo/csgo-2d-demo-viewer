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
