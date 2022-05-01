#!/usr/bin/env sh

protoc -I="./protos" --go_out="./pkg" --js_out=import_style=commonjs,binary:"web/player/src/protos" ./protos/*.proto
