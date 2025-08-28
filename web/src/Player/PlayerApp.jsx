import { useEffect, useState, useContext } from "react";
import "./PlayerApp.css";
import ErrorBoundary from "./Error.jsx";
import MessageBus from "./MessageBus.js";
import Player from "./Player.js";
import Map2d from "./map/Map2d.jsx";
import InfoPanel from "./panel/InfoPanel.jsx";
import "./protos/Message_pb.js";
import DemoContext from "../context.js";
import LoaderService from "./Loader.js";

export function PlayerApp() {
  const demoData = useContext(DemoContext);
  const worker = new Worker("worker.js");

  const playerMessageBus = new MessageBus();
  const loaderMessageBus = new MessageBus();

  // const loader = LoaderService(loaderMessageBus, playerMessageBus);
  const player = new Player(playerMessageBus);

  const [isWasmLoaded, setIsWasmLoaded] = useState(false);

  worker.onmessage = (e) => {
    console.log("Message received from worker", e);
    if (e.data === "ready") {
      setIsWasmLoaded(true);
    } else {
      const msg = proto.Message.deserializeBinary(e.data).toObject();
      loaderMessageBus.emit(msg);
    }
  };

  useEffect(() => {
    console.log("isWasmLoaded", isWasmLoaded);
    if (isWasmLoaded) {
      if (demoData.demoData) {
        worker.postMessage(demoData.demoData);
      }
      loaderMessageBus.listen([13], function (msg) {
        alert(msg.message);
      });
    }
  }, [isWasmLoaded]);

  return (
    <ErrorBoundary>
      <div className="grid-container">
        <div className="grid-item map">
          <Map2d messageBus={playerMessageBus} />
        </div>
        <div className="grid-item infoPanel">
          <InfoPanel messageBus={playerMessageBus} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
