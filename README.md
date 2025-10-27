# CS2 2D Demo Viewer

A web-based application for visualizing Counter-Strike 2 (CS2) demo files in 2D. Watch replays from a top-down perspective with player positions, movements, and actions displayed on interactive map overviews.

🔗 **Live Demo**: [2d.sparko.cz](https://2d.sparko.cz)

## What is this?

CS2 2D Demo Viewer allows you to:
- **View CS2 demos** in an interactive 2D top-down view
- **Track player movements** and positions throughout rounds
- **Analyze gameplay** with detailed round-by-round playback
- **Integrate with FACEIT** using the browser extension to watch match replays directly

## Project Components

This project consists of four main components:

### 1. Parser (Go + WebAssembly)
Located in `parser/`

The parser component is a Go application compiled to WebAssembly that:
- Parses CS2 demo files (`.dem` format)
- Extracts player positions, events, and game state
- Runs in the browser for client-side demo processing
- Uses the [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) library

### 2. Server (Go)
Located in `server/`

A lightweight HTTP server that:
- Proxies demo file downloads from external sources
- Serves the static web application in production
- Provides CORS support for development mode
- Validates and sanitizes demo URLs for security

### 3. Web Frontend (Preact + Vite)
Located in `web/`

The frontend application built with:
- **Preact** (React-compatible) for UI components
- **Vite** for fast development and optimized builds
- **PrimeReact** for UI components
- Interactive 2D canvas for demo visualization
- Map overviews for all CS2 competitive maps

See [web/README.md](web/README.md) for more details.

### 4. Browser Plugin (Chrome/Firefox Extension)
Located in `browserplugin/faceit/`

Browser extensions that:
- Add "2D Replay" buttons to FACEIT match pages
- Automatically download and open demos in the viewer
- Support both Chrome and Firefox
- Allow customizable viewer URL configuration

See [browserplugin/faceit/README.md](browserplugin/faceit/README.md) for more details.

## Development

### Prerequisites

- **Go** 1.25.1 or higher
- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **Make** (optional, for using Makefile commands)

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sparkoo/csgo-2d-demo-viewer.git
   cd csgo-2d-demo-viewer
   ```

2. **Install Go dependencies**:
   ```bash
   cd parser && go mod download && cd ..
   cd server && go mod download && cd ..
   ```

3. **Install Node.js dependencies**:
   ```bash
   cd web && npm ci && cd ..
   ```

### Development Workflow

#### Option 1: Using Make (Recommended)

The project includes a Makefile for common tasks:

```bash
# Build WebAssembly parser
make wasm

# Run web development server (with hot reload)
make dev

# Run backend server in development mode
make server
```

#### Option 2: Manual Commands

**Build the WebAssembly parser**:
```bash
cd parser
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../web/public/wasm/csdemoparser.wasm ./wasm.go
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" ../web/public/wasm/
cd ..
```

**Run the web development server**:
```bash
cd web
npm start
# Opens at http://localhost:5173
```

**Run the backend server** (in a separate terminal):
```bash
cd server
go run main.go -dev
# Runs on http://localhost:8080
```

### Development Tips

- The web dev server (`npm start`) has hot module replacement (HMR)
- Use `-dev` flag on the server to enable CORS for local development
- Rebuild WASM (`make wasm`) after any changes to the parser code
- Browser plugin can be developed separately, see its [README](browserplugin/faceit/README.md)

## Building for Production

### Build WebAssembly Parser

```bash
make wasm
```

Or manually:
```bash
cd parser
GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o ../web/public/wasm/csdemoparser.wasm ./wasm.go
```

### Build Web Frontend

```bash
cd web
npm ci
npm run build
```

This creates an optimized production build in `web/dist/`.

### Build Server

```bash
cd server
go build -o csgo-2d-demo-viewer main.go
```

### Build with Docker

The project includes a multi-stage Dockerfile for production deployment:

```bash
docker build -t csgo-2d-demo-viewer .
```

The Docker image:
- Builds the WASM parser
- Builds the web frontend
- Compiles the Go server
- Produces a minimal Alpine-based image (~50MB)

**Run the Docker container**:
```bash
docker run -p 8080:8080 csgo-2d-demo-viewer
```

Access the application at `http://localhost:8080`.

## Running in Production

### Using the Binary

After building:

```bash
cd server
./csgo-2d-demo-viewer
```

The server will:
- Serve static files from `../web/dist/`
- Listen on port 8080 by default
- Proxy demo downloads with URL validation

### Using Docker

Pull the pre-built image from GitHub Container Registry:

```bash
docker pull ghcr.io/sparkoo/csgo-2d-demo-viewer:latest
docker run -p 8080:8080 ghcr.io/sparkoo/csgo-2d-demo-viewer:latest
```

### Environment Variables

- `PORT` - Server port (default: 8080)

## Testing

### Go Tests

**Test the parser**:
```bash
cd parser
go test -v ./...
```

**Test the server**:
```bash
cd server
go test -v ./...
```

### Linting

The project uses `golangci-lint` for Go code quality:

```bash
cd parser
golangci-lint run

cd server
golangci-lint run
```

Configuration is in `.golangci.yml`.

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Go builds and tests** - Validates parser and server
- **golangci-lint** - Checks code quality
- **Node.js builds** - Builds web frontend and browser plugin
- **Docker publish** - Builds and publishes Docker images to GHCR
- **Dependency review** - Scans for vulnerable dependencies

All workflows run on push to `master` and `dev` branches, and on pull requests.

## Project Structure

```
.
├── parser/                 # WebAssembly demo parser
│   ├── pkg/               # Parser packages
│   │   ├── parser/        # Core parsing logic
│   │   ├── message/       # Message types
│   │   ├── tools/         # Utility tools
│   │   └── log/           # Logging
│   ├── wasm.go            # WASM entry point
│   └── go.mod             # Go dependencies
├── server/                # HTTP server
│   ├── main.go            # Server implementation
│   └── go.mod             # Go dependencies
├── web/                   # Preact frontend
│   ├── src/               # React/Preact components
│   ├── public/            # Static assets and WASM
│   ├── package.json       # npm dependencies
│   └── README.md          # Frontend documentation
├── browserplugin/         # Browser extensions
│   └── faceit/            # FACEIT integration extension
│       └── README.md      # Extension documentation
├── protos/                # Protocol buffer definitions
├── Dockerfile             # Multi-stage production build
├── Makefile               # Build automation
└── README.md              # This file
```

## Technology Stack

### Backend
- **Go 1.25.1** - Programming language
- **WebAssembly** - For browser-side demo parsing
- **demoinfocs-golang** - CS2 demo parsing library
- **net/http** - Built-in Go HTTP server

### Frontend
- **Preact** - Lightweight React alternative
- **Vite** - Fast build tool and dev server
- **PrimeReact** - UI component library
- **HTML5 Canvas** - 2D rendering

### Browser Extension
- **Webpack** - Module bundling
- **webextension-polyfill** - Cross-browser compatibility
- **web-ext** - Firefox extension tooling

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **GitHub Container Registry** - Docker image hosting

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2023 Michal Vala

## Links

- **Live Demo**: [2d.sparko.cz](https://2d.sparko.cz)
- **GitHub Repository**: [sparkoo/csgo-2d-demo-viewer](https://github.com/sparkoo/csgo-2d-demo-viewer)
- **Docker Image**: [ghcr.io/sparkoo/csgo-2d-demo-viewer](https://github.com/sparkoo/csgo-2d-demo-viewer/pkgs/container/csgo-2d-demo-viewer)
- **demoinfocs-golang Library**: [markus-wa/demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang)

## Acknowledgments

- Built with [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) by Markus Walther
- Map overviews from the CS2 community
- Inspired by the need for accessible demo analysis tools
