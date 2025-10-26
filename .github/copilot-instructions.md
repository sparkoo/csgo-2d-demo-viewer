# CS2 2D Demo Viewer - Copilot Instructions

This repository contains a CS2 2D demo viewer with multiple components. Please follow these guidelines when making changes.

## Project Overview

This is a full-stack application for visualizing CS2 demo files in 2D:
- **Parser**: Go-based WebAssembly parser for CS2 demo files
- **Server**: Go HTTP server for demo file downloads and proxying
- **Web**: Preact-based frontend application
- **Browser Plugin**: Browser extension for integration with Faceit

## Technologies

- **Backend**: Go 1.25.1
- **Frontend**: JavaScript, Preact (React-compatible), Vite
- **Build**: WebAssembly, Make, npm
- **Linting**: golangci-lint
- **Package Managers**: Go modules, npm

## Project Structure

```
.
├── parser/          # Go WebAssembly parser for demo files
│   ├── pkg/         # Parser packages (parser, message, tools, log)
│   ├── wasm.go      # WASM entry point
│   └── go.mod
├── server/          # Go HTTP server
│   ├── main.go      # Server entry point
│   └── go.mod
├── web/             # Preact frontend
│   ├── src/         # React/Preact components
│   ├── public/      # Static assets and WASM files
│   └── package.json
├── browserplugin/   # Browser extensions
│   └── faceit/      # FACEIT integration
├── protos/          # Protocol buffer definitions
└── Makefile         # Build automation
```

## Building and Testing

### Go Components

**Parser (WebAssembly)**:
```bash
# Build WASM from root directory
make wasm

# Test parser
cd parser && go test -v ./...
```

**Server**:
```bash
# Run server in dev mode
make server
# Or directly:
go run server/main.go -dev

# Test server
cd server && go test -v ./...
```

**Linting**:
```bash
# Lint parser
cd parser && golangci-lint run

# Lint server
cd server && golangci-lint run
```

### Web Frontend

```bash
# Install dependencies
cd web && npm ci

# Run development server
npm start
# Or from root: make dev

# Build for production
npm run build
```

### Full Build Process

```bash
# 1. Build WebAssembly parser
make wasm

# 2. Build web frontend
cd web && npm ci && npm run build

# 3. Run server
make server
```

## Code Conventions

### Go Code

- **Go version**: 1.25.1
- **Style**: Follow standard Go conventions (gofmt, golint)
- **Linting**: Use golangci-lint (config in `.golangci.yml`)
- **Imports**: Use standard library where possible
- **Testing**: Write tests in `*_test.go` files
- **WebAssembly**: Tag WASM code with `//go:build js && wasm`

### JavaScript/Preact Code

- **Framework**: Preact (with React compatibility via @preact/compat)
- **Build tool**: Vite
- **Components**: Use `.jsx` extension for components
- **Style**: Follow existing code patterns in the `web/src/` directory

### General Guidelines

- **Minimal changes**: Make the smallest possible changes to achieve the goal
- **Don't break existing functionality**: Test thoroughly before committing
- **Follow existing patterns**: Match the style and structure of existing code
- **No unnecessary dependencies**: Only add libraries if absolutely necessary
- **Documentation**: Update comments only if they add value or are required

## Testing

- **Go tests**: Run `go test -v ./...` in `parser/` and `server/` directories
- **No JavaScript tests**: The web component currently has no test suite
- **Manual testing**: Run the application locally and verify changes work as expected

## CI/CD

GitHub Actions workflows are configured for:
- Go builds and tests (`.github/workflows/go.yml`)
- golangci-lint checks (`.github/workflows/golangci-lint.yml`)
- Node.js web builds (`.github/workflows/nodejs_web.yml`)
- Node.js browser plugin builds (`.github/workflows/nodejs_browserplugin.yml`)
- Docker builds (`.github/workflows/docker-publish.yml`)
- Dependency reviews (`.github/workflows/dependency-review.yml`)

All workflows run on push to `master` and `dev` branches, and on pull requests.

## Important Notes

### WebAssembly Specifics

- The parser is compiled to WASM and loaded by the web frontend
- WASM output goes to `web/public/wasm/`
- Always rebuild WASM (`make wasm`) after Go parser changes
- The `wasm_exec.js` file is copied from the Go installation

### Server Specifics

- The server proxies demo file downloads from external sources
- Dev mode (`-dev` flag) enables CORS for local development
- Production mode restricts URLs to allowed domains for security

### Web Frontend Specifics

- Uses Preact with React compatibility layer
- Vite is used for building and dev server
- Map overviews are in `web/public/overviews/`
- Weapon icons are SVG files in `web/src/Player/assets/icons/csgo/`

## Common Tasks

### Adding a new map

1. Add map overview image to `web/public/overviews/`
2. Update map configuration in parser if needed

### Modifying parser logic

1. Edit Go files in `parser/pkg/parser/`
2. Run tests: `cd parser && go test -v ./...`
3. Rebuild WASM: `make wasm`
4. Test in web frontend

### Updating frontend

1. Edit files in `web/src/`
2. Test with dev server: `cd web && npm start`
3. Build for production: `npm run build`

### Updating dependencies

**Go**: Update `go.mod` files in `parser/` or `server/` and run `go mod tidy`
**npm**: Update `package.json` in `web/` or `browserplugin/faceit/` and run `npm install`

## Security Considerations

- Never commit secrets or API keys
- Be cautious with URL parsing and validation in the server
- Validate user inputs thoroughly
- Keep dependencies up to date to avoid vulnerabilities
