# WASM build stage
FROM golang:1.25 AS builder_parser

USER root
WORKDIR /csgo-2d-demo-player

COPY parser/go.mod .
COPY parser/go.sum .
RUN go mod download

COPY parser .
RUN CGO_ENABLED=0 GOOS=js GOARCH=wasm GO111MODULE=on go build \
  -a -o _output/csdemoparser.wasm \
  -gcflags all=-trimpath=/ \
  -asmflags all=-trimpath=/ \
  wasm.go

# Frontend build stage
FROM node:lts-alpine AS builder_npm

USER root

WORKDIR /csgo-2d-demo-player

COPY web/package.json .
COPY web/package-lock.json .
RUN npm install

COPY web/index.html .
COPY web/vite.config.js .
COPY web/public public
COPY web/src src

# Support for external CDN via build arg
ARG VITE_ASSETS_BASE_URL=""
ENV VITE_ASSETS_BASE_URL=$VITE_ASSETS_BASE_URL

RUN npm run build

# Remove large assets from build if using external CDN
RUN if [ -n "$VITE_ASSETS_BASE_URL" ]; then \
      echo "Using external CDN, removing large assets from build..."; \
      rm -rf dist/homeheader_video dist/overviews; \
    fi

# Server build stage
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

WORKDIR /app

# Copy built frontend assets
COPY --from=builder_npm /csgo-2d-demo-player/dist/ ./web/dist/

# Copy WASM files to correct locations
COPY --from=builder_parser /csgo-2d-demo-player/_output/csdemoparser.wasm ./web/dist/wasm/
COPY --from=builder_parser /usr/local/go/lib/wasm/wasm_exec.js ./web/dist/wasm/

# Copy server binary
COPY --from=builder_server /csgo-2d-demo-player/main ./server/

WORKDIR /app/server

# Expose port 8080
EXPOSE 8080

# Start server
CMD ["./main"]
