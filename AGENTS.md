# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Commands

See [.ai/build-and-test.md](.ai/build-and-test.md) for build, test, and lint commands.

## Architecture

The app has four main components that work together:

```
parser/ (Go → WASM)
    ↕ Protobuf messages (protos/)
web/ (Preact frontend)
    ↕ HTTP proxy
server/ (Go HTTP server)

browserplugin/faceit/ (independent browser extension)
```

### Data flow for demo playback

1. **Parser** (`parser/pkg/parser/parser.go`): Uses `demoinfocs-golang` to parse `.dem` files. Registers event handlers (kills, grenades, round events, player ticks) and emits `proto.Message` objects via callback. Output includes `Round`, `TickState`, `Frag`, `Init`, `DemoEnd` message types.

2. **WASM bridge** (`parser/wasm.go`): Exposes `wasmParseDemo(filename, bytes, callback)` to JS. Runs in a Web Worker (`web/public/worker.js`). Each parsed protobuf chunk is `Uint8Array`-copied to JS.

3. **Frontend messaging** (`web/src/Player/`):
   - Two `MessageBus` instances: `loaderBus` (WASM → Player) and `playerBus` (UI events ↔ components)
   - `Player.js` listens on `loaderBus` for round data (msgtype 6), buffers tick arrays, then plays them at 16ms intervals using `setInterval`
   - Components subscribe to `playerBus` by message type number (defined in `constants.js`)
   - Protobuf deserialization uses the generated `protos/Message_pb.js`

4. **Map rendering** (`web/src/Player/map/`): `Map2d.jsx` draws the 2D overhead view. Player positions are translated to percentages (0–100%) by the parser using per-map scale/offset data in `parser/pkg/parser/map.go`.

### URL parameter handling

- `?demourl=<url>`: Downloads via server proxy `/download?url=...`, then after download extracts Faceit match ID from the URL and updates browser URL to `?faceit_match_id=<id>` (for shareability, since demo CDN URLs expire)
- `?faceit_match_id=<id>`: Shows a dialog directing the user to the Faceit match page (direct Faceit API download is not available from the browser)

### Server (`server/`)

- `main.go`: Serves `web/dist` as SPA, `/download` proxy, and in dev mode `/testdemos/` static files
- `download.go`: Security-critical proxy — validates URLs against an allowlist of Faceit CDN hosts (Backblaze), enforces HTTPS in production, extracts and validates match ID from path using regex `\d-[a-f0-9]{8}-...-[a-f0-9]{12}-\d-\d`
- Dev mode (`-dev` flag): Relaxes CORS and allows `http://localhost:8080` URLs for local testing

### Protobuf

Proto definitions are in `protos/`. Generated files:
- Go: `parser/pkg/message/Message.pb.go`
- JS: `web/src/Player/protos/Message_pb.js`

When changing `.proto` files, regenerate both.

### Browser Extension (`browserplugin/faceit/`)

Cross-browser extension (Chrome + Firefox) using `webextension-polyfill`. Injects buttons into the Faceit UI and opens the 2D viewer with the demo URL. Built with webpack.

## Key conventions

- Player positions in protobuf are percentages (0.0–100.0), not world coordinates — translation happens in the parser via `translatePosition()`
- Tick sampling: player state is sampled every 4 frames; time updates every 16 frames; other frames emit `EmptyType`
- The match ID regex format is `1-<uuid_without_version>-1-1` (single-digit prefix and suffix only)
- In `Player.js`, round `ticksList` is pre-grouped by tick number into arrays before playback
