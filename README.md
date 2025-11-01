# CS2 2D Demo Viewer

A web application for visualizing Counter-Strike 2 (CS2) demo files in 2D.

- Production: https://2d.sparko.cz
- Staging: https://dev.2d.sparko.cz
- Chrome extension: https://chromewebstore.google.com/detail/kagfmemgilamfeoljmajifkbhfglebdb
- Firefox extension: https://addons.mozilla.org/en-US/firefox/addon/faceit-2d-replay/

## Overview

This project parses CS2 demo files in a WebAssembly (WASM) module written in Go and renders the replay in a lightweight Preact frontend. A small Go server serves static assets and proxies demo downloads when needed.

## Project structure

- Parser (WASM) — `parser/`
  - Go → WebAssembly module for parsing CS2 demos
  - Powered by demoinfocs: https://github.com/markus-wa/demoinfocs-golang ❤️
- Frontend — `web/`
  - Preact + Vite application
  - Key areas:
    - Homepage: `web/src/Index`
    - Player: `web/src/Player` (consumes the WASM parser and plays back parsed data)
- Protocol Buffers — `protos/`
  - Custom message format for parser ↔ player communication
- Backend — `server/`
  - Serves static web content
  - Provides a secure demo download proxy
- FACEIT browser extension — `browserplugin/faceit/`
  - Adds buttons to FACEIT to open demos in the 2D viewer
  - Internally resolves the real demo URL and opens the player with the URL as a parameter
  - Works in Firefox and Chromium-based browsers
- Containerization
  - The whole application is packaged into a container and deployed to GCP
  - Assets are served by the Go server

## Requirements

- Go 1.25+
- Node.js 18+ and npm
- Make (for the provided targets)
- Optional: Docker, if you want to build and run the container image

## Development

The top-level Makefile provides convenient targets.

- Build the parser WebAssembly
  ```sh
  make wasm
  ```
  Outputs the WASM artifacts to `web/public/wasm/` so the frontend can load them in dev.

- Run the frontend (Vite dev server)
  ```sh
  make dev
  ```
  This starts the Vite dev server for the frontend. Open http://localhost:5173. The previously built WASM is served from `web/public/wasm/`.

- Run the backend server (useful for testing the proxy or a built frontend)
  ```sh
  make server
  ```
  Starts the Go server on http://localhost:8080 with development flags enabled.

Notes:
- The frontend dev server (Vite) and the Go server are separate processes. Use `make dev` during UI development. Use `make server` to test the proxy and SPA serving behavior against a built `dist/`.

## Production build and Docker

Build the production assets and server into a container:
```sh
docker build -t cs2-2d-demo-viewer .
```

Run the container:
```sh
docker run --rm -p 8080:8080 cs2-2d-demo-viewer
```

The server serves the built SPA from `/web/dist` and exposes a download proxy at `/download`.

## Security notes

The download proxy restricts what can be fetched:
- Only HTTPS is allowed
- Only approved hosts are permitted
- Fragments in URLs are rejected
- Match IDs are validated

This reduces the risk of abusing the proxy to access arbitrary resources.

## CI/CD

GitHub Actions are used for CI/CD workflows located under `.github/workflows/`.

## License

See the LICENSE file for details.
