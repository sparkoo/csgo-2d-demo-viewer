#!/usr/bin/env sh

protoc -I="./protos" --go_out="./pkg" --js_out="./assets/message" ./protos/*.proto
