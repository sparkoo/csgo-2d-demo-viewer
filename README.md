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

 - Serving of static web content
 - Demo download proxy

### Faceit browser plugin (`browserplugin/faceit/`)
Adds several buttons to Faceit interface to play the demo. Internaly it resolves the real demo URL and opens player link with the demo url in parameter. Works for Firefox and Chrome-based browsers.

### Container
Whole application is built into container and deployed to GCP. Everything is server by Go server.

### CI/CD (`.github/workflows/`)
Using GitHub Actions

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
