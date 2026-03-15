# CS2 2D Demo Viewer

A web-based application for visualizing Counter-Strike 2 (CS2) demo files in 2D.

 - [Live environment](https://2d.sparko.cz)
 - [Staging environment](https://dev.2d.sparko.cz)
 - [Chrome extension](https://chromewebstore.google.com/detail/kagfmemgilamfeoljmajifkbhfglebdb?utm_source=item-share-cb)
 - [Firefix extension](https://addons.mozilla.org/en-US/firefox/addon/faceit-2d-replay/)

## Project Components

### Parser (`parser/`)
Written in Go, built into WebAssembly.

Using CS demo parser library https://github.com/markus-wa/demoinfocs-golang ❤️

### Frontend (`web/`)
Written in JavaScript using Preact.

 - Homepage component at `web/src/Index` (only static page, nothing interesting here)
 - Player component at `web/src/Player`

**Player** is using *parser webassembly* to parse the binary demo. It then stores received data from the parser into the memory and plays them.

### Protocol Buffers ( `protos/`)

Custom message format to send demo data between parser and the *Player* application.

### Backend (`server/`)

 - Demo download proxy (the only endpoint in production)
 - Serves static content in local dev (`make server`)

### Faceit browser plugin (`browserplugin/faceit/`)
Adds several buttons to Faceit interface to play the demo. Fetches the demo URL from Faceit API and opens the player. After the demo is downloaded, the URL is automatically updated to use the Faceit match ID for easy sharing. Works for Firefox and Chrome-based browsers.

### Deployment
Static assets and the SPA are served by **Firebase Hosting** (`firebase.json`). The Go server is deployed as a Cloud Run container and only handles the `/download` proxy endpoint. WASM binaries are uploaded to GCS and served from there.

### CI/CD (`.github/workflows/`)
Using GitHub Actions

### GitHub Copilot Agents (`.github/agents/`)
Specialized agents provide expert guidance for different areas of the codebase:
- **Go Parser Specialist** - WebAssembly parser development
- **Frontend Specialist** - Preact/JavaScript UI and visualization
- **Server Specialist** - Go HTTP server and proxying
- **Build & CI Specialist** - Build processes and GitHub Actions
- **Browser Plugin Specialist** - Browser extension and FACEIT integration
- **Agent Writer Specialist** - Meta agent for creating/maintaining agents

See [.github/agents/README.md](.github/agents/README.md) for details on using these agents.

## Development
`Makefile` to ease the development.

To build the Parser WebAssembly
```sh
make wasm
```

To run the frontend (together with *wasm*, it is enough to develop a Player with manual upload)
```sh
make dev
```

To run the server (runs the server in dev mode, which enables local testing using url like `http://localhost:5173/player?demourl=http://localhost:8080/testdemos/1-6e537ed7-b125-44f8-add6-14e814af55a6-1-1.dem.zst`)
```sh
make server
```

### URL Parameters

The player supports the following URL parameters:

- `demourl` - Direct URL to a demo file (e.g., `?demourl=https://...`)
  - When a demo is loaded via this parameter, the URL is automatically updated to use `faceit_match_id` if the demo is from Faceit
- `faceit_match_id` - Faceit match ID (e.g., `?faceit_match_id=1-6e537ed7-b125-44f8-add6-14e814af55a6`)
  - This creates shareable URLs that work even after the original demo URL expires
  - When opened with `faceit_match_id`, the player shows a dialog with a link to the corresponding Faceit match page where you can download the demo
