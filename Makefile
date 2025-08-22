# WebAssembly build
.PHONY: wasm

WASM_DIR := web/public/wasm
WASM_OUT := $(WASM_DIR)/csdemoparser.wasm
WASM_EXEC := $(WASM_DIR)/wasm_exec.js
GOROOT := $(shell go env GOROOT)
GOROOT_WASM := $(GOROOT)/lib/wasm/wasm_exec.js

wasm:
	mkdir -p $(WASM_DIR)
	GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o $(WASM_OUT) ./cmd/wasm
	@echo "Copying wasm_exec.js from $(GOROOT_WASM)"
	cp "$(GOROOT_WASM)" "$(WASM_EXEC)"
	@echo "Built $(WASM_OUT) and ensured $(WASM_EXEC)"
