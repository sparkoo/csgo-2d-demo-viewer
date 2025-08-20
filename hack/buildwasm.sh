#!/usr/bin/env sh

GOOS=js GOARCH=wasm go build -trimpath -ldflags="-s -w" -o web/public/wasm/csdemoparser.wasm ./cmd/wasm
