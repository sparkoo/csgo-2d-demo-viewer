import { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "preact-iso";
import axios from "axios";
import "./PlayerApp.css";
import "./weapons.css";
import ErrorBoundary from "./Error.jsx";
import MessageBus from "./MessageBus.js";
import Player from "./Player.js";
import Map2d from "./map/Map2d.jsx";
import InfoPanel from "./panel/InfoPanel.jsx";
import "./protos/Message_pb.js";
import DemoContext from "../context.js";
import { MSG_PLAY_CHANGE } from "./constants.js";

const downloadServer = window.location.host.includes("localhost")
  ? "http://localhost:8080"
  : "";

export function PlayerApp() {
  const location = useLocation();
  const worker = useRef(null);
  const player = useRef(null);

  const demoData = useContext(DemoContext);

  const [playerMessageBus] = useState(new MessageBus());
  const [loaderMessageBus] = useState(new MessageBus());

  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker("worker.js");
      console.log("Worker created.");
    }

    if (!player.current) {
      player.current = new Player(playerMessageBus, loaderMessageBus);
      console.log("Player created.");
    }

    worker.current.onmessage = (e) => {
      console.log("Message received from worker", e);
      if (e.data === "ready") {
        setIsWasmLoaded(true);
      } else {
        const msg = proto.Message.deserializeBinary(e.data).toObject();
        loaderMessageBus.emit(msg);
      }
    };
    playerMessageBus.listen([13], function (msg) {
      alert(msg.message);
    });

    playerMessageBus.listen([MSG_PLAY_CHANGE], function (msg) {
      setIsPlaying(msg.playing);
      if (msg.playing) {
        setHasPlayed(true);
      }
      if (!msg.playing) {
        setLoadingMessage("Loading...");
      }
    });

    return () => {
      if (worker.current) {
        worker.current.terminate();
        console.log("Worker terminated.");
        worker.current = null;
      }

      if (player.current) {
        player.current = null;
      }
    };
  }, []);

  useEffect(() => {
    console.log("isWasmLoaded", isWasmLoaded);
    if (isWasmLoaded && demoData.demoData) {
      console.log("Posting demo data to worker.");
      worker.current.postMessage(demoData.demoData);
    } else if (isWasmLoaded && location.query.demourl) {
      const demoUrl = location.query.demourl;
      console.log("Demo URL found:", demoUrl);
      axios
        .get(`${downloadServer}/download?url=${encodeURIComponent(demoUrl)}`, {
          responseType: "arraybuffer",
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(percentCompleted);
            setLoadingMessage(`Downloading demo... ${percentCompleted}%`);
          },
        })
        .then((response) => {
          console.log("Response size:", response.data.byteLength);
          setLoadingMessage("Parsing demo...");
          setDownloadProgress(0);
          const contentDisposition = response.headers['content-disposition'];
          let filename = "demo.zst";
          if (contentDisposition) {
            const match = contentDisposition.match(/filename="([^"]+)"/);
            if (match) {
              filename = match[1];
            }
          }
          worker.current.postMessage({
            filename: filename,
            data: new Uint8Array(response.data),
          });
        })
        .catch((error) => console.error("Error fetching demo:", error));
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
      {!isPlaying && !hasPlayed && (
        <div className="loading-overlay">
          <div className="loading-dialog">
            <div className="loading-spinner"></div>
            <p>{loadingMessage}</p>
            {downloadProgress > 0 && (
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}
