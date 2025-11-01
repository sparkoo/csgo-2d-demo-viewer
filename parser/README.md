# CS2 Demo Parser

A WebAssembly-based parser for Counter-Strike 2 demo files, built with Go.

## Overview

This component parses CS2 demo files using the [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) library and exposes the parsing functionality to the web frontend via WebAssembly. The parser extracts game events, player positions, and other data from demo files and sends it to the Player component using Protocol Buffers.

## Technology Stack

- **Language**: Go 1.25.1
- **Target**: WebAssembly (WASM)
- **Parser Library**: [demoinfocs-golang v5](https://github.com/markus-wa/demoinfocs-golang)
- **Message Format**: Protocol Buffers (see `protos/` directory)

## Project Structure

```
parser/
├── conf/           # Configuration (production/dev modes)
├── pkg/            # Package modules
│   ├── parser/     # Core parsing logic
│   ├── message/    # Protocol buffer message handling
│   ├── tools/      # Utility functions
│   └── log/        # Logging utilities
├── wasm.go         # WebAssembly entry point
├── go.mod          # Go module dependencies
└── go.sum          # Go module checksums
```

## Development

### Prerequisites

- Go 1.25.1 or higher
- Make (optional, for using Makefile commands)

### Building

#### Build WebAssembly (from project root)

```bash
make wasm
```

This will:
1. Compile the parser to WebAssembly (`web/public/wasm/csdemoparser.wasm`)
2. Copy the `wasm_exec.js` runtime from your Go installation

#### Build manually

```bash
mkdir -p ../web/public/wasm
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../web/public/wasm/csdemoparser.wasm ./wasm.go
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../web/public/wasm/
```

### Testing

Run tests from the parser directory:

```bash
cd parser
go test -v ./...
```

### Linting

Lint the code using golangci-lint:

```bash
cd parser
golangci-lint run
```

Configuration is in `.golangci.yml` at the project root.

## How It Works

1. The web frontend loads the compiled WASM module
2. JavaScript calls the `wasmParseDemo` function exposed by the parser
3. The parser reads the binary demo file and extracts game data
4. Data is serialized using Protocol Buffers and sent back to the frontend via callbacks
5. The Player component receives and displays the parsed data

## API

The parser exposes one main function to JavaScript:

### `wasmParseDemo(filename, demoData, callback)`

- **filename**: Name of the demo file (string)
- **demoData**: Binary demo file data (Uint8Array)
- **callback**: Function to receive parsed data chunks (function)

## Dependencies

Key dependencies (see `go.mod` for full list):

- `github.com/markus-wa/demoinfocs-golang/v5` - CS2/CS:GO demo parser
- `google.golang.org/protobuf` - Protocol Buffers support
- `github.com/klauspost/compress` - Compression utilities
- `go.uber.org/zap` - Structured logging

## Notes

- The WASM build uses `-ldflags="-s -w"` to reduce file size by stripping debug information
- All code is tagged with `//go:build js && wasm` build constraint
- The parser runs entirely in the browser, no server-side processing required
