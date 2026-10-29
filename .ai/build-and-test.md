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

## v6 parser experiment

The parser uses demoinfocs v6.0.0-rc.1 and requires Go 1.27.0 or newer.
Go can download the required toolchain automatically with `GOTOOLCHAIN=auto`.
Always build `wasm_exec.js` using the parser module's toolchain (`make wasm` does this).

Demo integration tests look in `server/testdemos` by default. To reuse demos from
another checkout, set `TEST_DEMOS_DIR` to that checkout's absolute demo directory
before running `go test -v ./...` in `parser/`. Missing local fixtures are skipped.