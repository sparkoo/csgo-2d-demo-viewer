const serverHost = globalThis.location.host.includes("localhost") ? "http://localhost:8080" : "";

importScripts('wasm_exec.js');

onmessage = (event) => {
  if (event.data instanceof Uint8Array) {
    globalThis.testt(event.data, async function (data) {
      if (data instanceof Uint8Array) {
        postMessage(data)
        // const msg = proto.Message.deserializeBinary(data).toObject()
        // messageBus.emit(msg)
      } else {
        console.log("[message] text data received from server, this is weird. We're using protobufs ?!?!?", data);
        postMessage(JSON.parse(data))
      }
    })
  }
}

async function loadWasm() {
  console.log("hus", serverHost + "/wasm")
  const go = new globalThis.Go();
  await WebAssembly.instantiateStreaming(fetch(serverHost + "/wasm"), go.importObject)
    .then((result) => {
      go.run(result.instance);
      console.log("should be loaded now")
    });
}
loadWasm();
