#!/usr/bin/env sh

# protoc -I="./protos" --go_out="./pkg" --js_out=library=blubli,binary:"web/src/Player/protos" ./protos/*.proto
# protoc -I="./protos" --js_out=library=Message_pb,binary:"web/src/Player/protos" ./protos/*.proto
protoc -I="./protos" --js_out=import_style=commonjs,binary:"web/src/Player/protos" ./protos/*.proto

# import jspb from 'google-protobuf'

# // var jspb = require('google-protobuf');
# goog.object.extend(window.proto = window.proto || {}, proto.csgo);