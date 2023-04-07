FROM golang:1.19 as builderGo

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


FROM node:lts-slim as builderNpm

USER root

# index build
WORKDIR /csgo-2d-demo-player/index

COPY web/index/package.json .
COPY web/index/package-lock.json .
RUN npm install

COPY web/index/.env.production .
COPY web/index/public public
COPY web/index/src src
RUN npm run build

# player build
WORKDIR /csgo-2d-demo-player/player

COPY web/player/package.json .
COPY web/player/package-lock.json .
RUN npm install

COPY web/player/public public
COPY web/player/src src
RUN npm run build


FROM debian:buster-slim
COPY --from=builderGo /csgo-2d-demo-player/_output/main /csgo-2d-demo-player/
COPY --from=builderGo /csgo-2d-demo-player/assets/ /csgo-2d-demo-player/assets/
COPY --from=builderNpm /csgo-2d-demo-player/player/build/ /csgo-2d-demo-player/web/player/build/
COPY --from=builderNpm /csgo-2d-demo-player/index/build/ /csgo-2d-demo-player/web/index/build/

WORKDIR /csgo-2d-demo-player

CMD /csgo-2d-demo-player/main
