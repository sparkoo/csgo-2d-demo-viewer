# backend build
FROM golang:1.23 AS builder_go

USER root
WORKDIR /csgo-2d-demo-player

COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GO111MODULE=on go build \
  -a -o _output/main \
  -gcflags all=-trimpath=/ \
  -asmflags all=-trimpath=/ \
  main.go

# web build
FROM node:lts-slim AS builder_npm

USER root

WORKDIR /csgo-2d-demo-player/web

COPY web/package.json .
COPY web/package-lock.json .
RUN npm install

COPY web/index.html .
COPY web/vite.config.js .
COPY web/.env.production .
COPY web/public public
COPY web/src src
RUN npm run build

# dist
FROM debian:buster-slim

RUN apt-get update && apt-get install -y ca-certificates

COPY --from=builder_go /csgo-2d-demo-player/_output/main /csgo-2d-demo-player/
COPY --from=builder_npm /csgo-2d-demo-player/web/dist/assets/. /csgo-2d-demo-player/assets/
COPY --from=builder_npm /csgo-2d-demo-player/web/dist/ /csgo-2d-demo-player/web/dist/

WORKDIR /csgo-2d-demo-player

CMD /csgo-2d-demo-player/main
