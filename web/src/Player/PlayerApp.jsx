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
import DemoDataService from "./DemoDataService.js";

export function PlayerApp() {
  const demoData = useContext(DemoContext);
  const [worker] = useState(new Worker("worker.js"));

  const demoDataService = new DemoDataService();
  const playerMessageBus = new MessageBus();

  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const loader = useState(
    new LoaderService(worker, demoDataService, setIsWasmLoaded)
  );
  const player = useState(new Player(playerMessageBus));

  useEffect(() => {
    console.log("isWasmLoaded", isWasmLoaded);
    if (isWasmLoaded) {
      if (demoData.demoData) {
        worker.postMessage(demoData.demoData);
      }
    }
  }, []);

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
