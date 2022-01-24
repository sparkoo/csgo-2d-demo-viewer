FROM quay.io/eclipse/che-golang-1.17:ae494ed as builder

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

#FROM scratch
FROM quay.io/app-sre/ubi8-ubi-minimal:8.5-218
COPY --from=builder /csgo-2d-demo-player/_output/main /csgo-2d-demo-player/
COPY --from=builder /csgo-2d-demo-player/templates/ /csgo-2d-demo-player/templates/
COPY --from=builder /csgo-2d-demo-player/assets/ /csgo-2d-demo-player/assets/

WORKDIR /csgo-2d-demo-player

CMD /csgo-2d-demo-player/main
# ENTRYPOINT ["/csgo-2d-demo-player/main"]
