import { decodeMessage } from "./decodeMessage.js";

const wasmBase = new URL(
  import.meta.env.VITE_WASM_BASE_URL
    ? import.meta.env.VITE_WASM_BASE_URL.replace(/\/?$/, "/")
    : import.meta.env.BASE_URL,
  self.location.origin
);

self.onmessage = ({ data: { filename, data } }) => {
  if (data instanceof Uint8Array) {
    globalThis.wasmParseDemo(filename, data, (payload) => {
      self.postMessage(
        payload instanceof Uint8Array
          ? decodeMessage(payload)
          : JSON.parse(payload)
      );
    });
  }
};

async function loadWasm() {
  const runtimeURL = new URL("wasm/wasm_exec.js", wasmBase).href;
  await import(/* @vite-ignore */ runtimeURL);
  const go = new globalThis.Go();
  const { instance } = await WebAssembly.instantiateStreaming(
    fetch(new URL("wasm/csdemoparser.wasm", wasmBase)),
    go.importObject
  );
  go.run(instance);
  self.postMessage("ready");
}

loadWasm();
