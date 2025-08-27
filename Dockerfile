# WASM build stage
FROM golang:1.24 AS builder_go

USER root
WORKDIR /csgo-2d-demo-player/parser

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=js GOARCH=wasm GO111MODULE=on go build \
  -a -o _output/csdemoparser.wasm \
  -gcflags all=-trimpath=/ \
  -asmflags all=-trimpath=/ \
  wasm.go

# Frontend build stage
FROM node:lts-alpine AS builder_npm

USER root

WORKDIR /csgo-2d-demo-player/web

COPY web/package.json .
COPY web/package-lock.json .
RUN npm install

COPY web/index.html .
COPY web/vite.config.js .
COPY web/public public
COPY web/src src
RUN npm run build

# Nginx stage
FROM nginx:alpine

# Copy built frontend assets
COPY --from=builder_npm /csgo-2d-demo-player/web/dist/ /usr/share/nginx/html/

# Copy WASM files to correct locations
COPY --from=builder_go /csgo-2d-demo-player/parser/_output/csdemoparser.wasm /usr/share/nginx/html/wasm/
COPY --from=builder_go /usr/local/go/lib/wasm/wasm_exec.js /usr/share/nginx/html/wasm/

# Copy custom nginx configuration
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
