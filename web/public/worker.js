importScripts("wasm/wasm_exec.js");

onmessage = (event) => {
  console.log("received event: ", event);
  var demoData = event.data.data;
  var filename = event.data.filename;
  console.log("file: ", filename);
  if (demoData instanceof Uint8Array) {
    globalThis.wasmParseDemo(filename, demoData, async function (data) {
      if (data instanceof Uint8Array) {
        postMessage(data);
        // const msg = proto.Message.deserializeBinary(data).toObject()
        // messageBus.emit(msg)
      } else {
        console.log(
          "[message] text data received from server, this is weird. We're using protobufs ?!?!?",
          data
        );
        postMessage(JSON.parse(data));
      }
    });
  }
};

async function loadWasm() {
  const go = new globalThis.Go();
  await WebAssembly.instantiateStreaming(
    fetch("/wasm/csdemoparser.wasm"),
    go.importObject
  ).then((result) => {
    go.run(result.instance);
    console.log("should be loaded now");
  });
}
loadWasm();
