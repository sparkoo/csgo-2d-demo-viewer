# CS2 Demo Viewer Server

A lightweight Go HTTP server that serves the web application and proxies demo file downloads.

## Overview

This server component provides two main functions:
1. **Static file serving**: Serves the built web application (HTML, JS, CSS, WASM files)
2. **Demo download proxy**: Securely proxies demo file downloads from external sources (e.g., FACEIT)

## Technology Stack

- **Language**: Go 1.25.1
- **HTTP Server**: Standard library `net/http`

## Development

### Prerequisites

- Go 1.25.1 or higher

### Running the Server

#### Development mode (from project root)

```bash
make server
```

Or directly:

```bash
go run server/main.go -dev
```

Development mode enables:
- CORS headers for cross-origin requests
- Relaxed URL validation for demo downloads
- Useful for local development with the web frontend

#### Production mode

```bash
go run server/main.go
```

Production mode:
- Restricts demo URLs to allowed domains for security
- No CORS headers
- Suitable for deployment

### Testing

Run tests from the server directory:

```bash
cd server
go test -v ./...
```

### Building

Build a production binary:

```bash
go build -o csgo-server server/main.go
```

## API Endpoints

### `GET /download?url=<demo_url>`

Proxies demo file downloads from external sources.

**Query Parameters:**
- `url`: The URL of the demo file to download

**Response Headers:**
- `Content-Type`: Set from the upstream response
- `Content-Disposition`: Attachment with filename based on match ID
- `X-Demo-Length`: Content length from the upstream response (if available)
- `Access-Control-Allow-Origin`: `*` (only in dev mode)

**Example:**
```bash
curl "http://localhost:8080/download?url=https://example.com/demo.dem.zst"
```

**Security:**
- In production mode, only whitelisted domains are allowed
- No HTTP redirects are followed to prevent SSRF attacks
- 60-second timeout on upstream requests

### Static File Serving

All other requests serve static files from the web application build directory.

## Configuration

- `-dev`: Enable development mode (default: `false`)

## How It Works

1. **Static Files**: The server serves pre-built web application files from the `dist` directory
2. **Demo Downloads**: When a user requests a demo file:
   - The browser sends a request to `/download?url=<demo_url>`
   - The server validates the URL (in production mode)
   - The server fetches the file from the external source
   - The file is streamed back to the client in chunks
3. **CORS**: In dev mode, CORS headers allow the web app to make requests from different origins

## Security Considerations

- **URL Validation**: In production, only specific domains are allowed for demo downloads
- **No Redirects**: HTTP redirects are blocked to prevent Server-Side Request Forgery (SSRF)
- **Timeout**: Requests to external sources timeout after 60 seconds
- **Streaming**: Large files are streamed in 32KB chunks to prevent memory exhaustion
