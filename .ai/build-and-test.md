# Build & Test

## Build

```sh
make wasm        # Compile Go parser to WebAssembly (output: web/public/wasm/)
make dev         # Run frontend dev server (Vite)
make server      # Run Go server in dev mode on :8080
```

The `make wasm` step is required before `make dev` whenever the parser changes. It compiles `parser/wasm.go` targeting `GOOS=js GOARCH=wasm` and copies `wasm_exec.js` from GOROOT.

## Tests

```sh
# Go tests (parser + server)
cd parser && go test ./...
cd server && go test ./...

# Single Go test
cd server && go test -run TestMatchId
```

## Linting

```sh
# Go linter (golangci-lint, runs in CI)
cd parser && golangci-lint run
```

## Browser plugin

```sh
cd browserplugin/faceit && npm install && npm run build
```
