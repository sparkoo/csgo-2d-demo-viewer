# Server build stage
# Static assets (JS, CSS, images) are served by Firebase Hosting.
# WASM binary is served from GCS (see .github/workflows/upload-wasm-gcs.yml).
# This image only needs the Go HTTP server for the /download proxy.
FROM golang:1.25 AS builder_server

USER root
WORKDIR /csgo-2d-demo-player

COPY server/go.mod .
# COPY server/go.sum .
RUN go mod download

COPY server .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o main .

# Final stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app/server

COPY --from=builder_server /csgo-2d-demo-player/main ./

# Expose port 8080
EXPOSE 8080

# Start server
CMD ["./main"]
