import { useEffect, useState } from "react";
import './PlayerApp.css';
import ErrorBoundary from "./Error.jsx";
import MessageBus from "./MessageBus.js";
import Player from "./Player.js";
import Map2d from "./map/Map2d.jsx";
import InfoPanel from "./panel/InfoPanel.jsx";
import '../libs/wasm_exec.js';
import './protos/Message_pb.js'

export function PlayerApp() {
  const [messageBus] = useState(new MessageBus())
  const [player] = useState(new Player(messageBus))
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "");
  const [isWasmLoaded, setIsWasmLoaded] = useState(false)

  useEffect(() => {
    console.log("run run run")

    if (!isWasmLoaded) {
      loadWasm();
      return
    }

    const urlParams = new URLSearchParams(window.location.search);
    const channel = new BroadcastChannel(urlParams.get("uuid"));
    channel.addEventListener("message", e => {
      console.log("received", e, isWasmLoaded)
      window.testt(e.data, function (data) {
        if (data instanceof Uint8Array) {
          const msg = proto.Message.deserializeBinary(data).toObject()
          messageBus.emit(msg)
        } else {
          // text frame
          // console.log(event.data);
          console.log("[message] text data received from server, this is weird. We're using protobufs ?!?!?", data);
          messageBus.emit(JSON.parse(data))
        }

        // console.log(`[message] Data received from server: ${event.data}`);
        // let msg = JSON.parse(event.data)
        // messageBus.emit(msg)
      })
    });
    messageBus.listen([13], function (msg) {
      alert(msg.message)
      // window.testt(byteArray)
    })
    // Connect(this.messageBus)

    async function loadWasm() {
      const go = new window.Go();
      WebAssembly.instantiateStreaming(fetch(serverHost + "/wasm"), go.importObject)
        .then((result) => {
          go.run(result.instance);
          console.log("should be loaded now")
          setIsWasmLoaded(true)
          // window.withDownload("https://corsproxy.io/?" + encodeURIComponent("https://github.com/sparkoo/csgo-2d-demo-viewer/raw/refs/heads/master/test_demos/1-c26b4e22-66ac-4904-87cc-3b2b65a67ddb-1-1.dem.gz"))
          // fetch("https://corsproxy.io/?" + encodeURIComponent("https://github.com/sparkoo/csgo-2d-demo-viewer/raw/refs/heads/master/test_demos/1-c26b4e22-66ac-4904-87cc-3b2b65a67ddb-1-1.dem.gz"))
          // .then((result) => {
          //   console.log(result)
          //   result.arrayBuffer().then(b => {
          //     const data = new Uint8Array(b)
          //     console.log(data)
          //     window.testt(data, function (data) {
          //       if(data instanceof Uint8Array) {
          //         const msg = proto.Message.deserializeBinary(data).toObject()
          //         messageBus.emit(msg)
          //       } else {
          //         // text frame
          //         // console.log(event.data);
          //         console.log("[message] text data received from server, this is weird. We're using protobufs ?!?!?", data);
          //         messageBus.emit(JSON.parse(data))
          //       }

          //       // console.log(`[message] Data received from server: ${event.data}`);
          //       // let msg = JSON.parse(event.data)
          //       // messageBus.emit(msg)
          //     })
          //   })
          // })
          // .catch(err => console.log(err))
        });
    }

  }, [isWasmLoaded])


  return (
    <ErrorBoundary>
      <div className="grid-container">
        <div className="grid-item map">
          <Map2d messageBus={messageBus} />
        </div>
        <div className="grid-item infoPanel">
          <InfoPanel messageBus={messageBus} />
        </div>
      </div>
    </ErrorBoundary>);
}
