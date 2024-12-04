import { useEffect, useState } from "react";
import './App.css';
import ErrorBoundary from "./Error";
import MessageBus from "./MessageBus";
import Player from "./Player";
import Map2d from "./map/Map2d";
import InfoPanel from "./panel/InfoPanel";
import './wasm_exec.js';

function App() {
  const [messageBus] = useState(new MessageBus())
  const [player] = useState(new Player(messageBus))
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "");
  const proto = require("./protos/Message_pb");

  useEffect(() => {
    console.log("run run run")
    messageBus.listen([13], function (msg) {
      alert(msg.message)
    })
    // Connect(this.messageBus)

    async function loadWasm() {
      const go = new window.Go();
      WebAssembly.instantiateStreaming(fetch(serverHost + "/wasm"), go.importObject)
        .then((result) => {
          go.run(result.instance);

          // window.withDownload("https://corsproxy.io/?" + encodeURIComponent("https://github.com/sparkoo/csgo-2d-demo-viewer/raw/refs/heads/master/test_demos/1-c26b4e22-66ac-4904-87cc-3b2b65a67ddb-1-1.dem.gz"))
          fetch("https://corsproxy.io/?" + encodeURIComponent("https://github.com/sparkoo/csgo-2d-demo-viewer/raw/refs/heads/master/test_demos/1-c26b4e22-66ac-4904-87cc-3b2b65a67ddb-1-1.dem.gz"))
          .then((result) => {
            console.log(result)
            result.arrayBuffer().then(b => {
              const data = new Uint8Array(b)
              console.log(data)
              window.testt(data, function (data) {
                if(data instanceof Uint8Array) {
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
            })
          })
          .catch(err => console.log(err))
        });
    }

    loadWasm();
  }, [])


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

export default App;
