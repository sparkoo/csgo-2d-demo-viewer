import { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "preact-iso";
import axios from "axios";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import "./PlayerApp.css";
import "./weapons.css";
import DemoUploadArea from "../Index/Uploader/DemoUploadArea";
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

// Core Faceit match ID format: digit-hex8-hex4-hex4-hex4-hex12
// Examples: 1-95e66a49-44ed-4c95-9838-87204f1abffd, 1-b4f72a00-351d-4073-949d-8a29472ae422
const FACEIT_MATCH_ID_CORE = String.raw`\d+-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`;

// Pattern to extract Faceit match ID from a demo URL path.
// The (?:-\d+-\d+)? part optionally matches but does not capture the -1-1 suffix.
const FACEIT_MATCH_ID_PATTERN = new RegExp(`/(${FACEIT_MATCH_ID_CORE})(?:-\\d+-\\d+)?\\.`, "i");

// Pattern to validate a faceit_match_id URL parameter (exact match, no suffix).
const FACEIT_MATCH_ID_VALIDATION_PATTERN = new RegExp(`^${FACEIT_MATCH_ID_CORE}$`, "i");

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
  const [loadingMessage, setLoadingMessage] = useState(["Loading..."]);
  const [isError, setIsError] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFaceitDialog, setShowFaceitDialog] = useState(false);
  const [faceitMatchId, setFaceitMatchId] = useState(null);

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

    playerMessageBus.listen([4], (msg) => {
      setLoadingMessage([
        "Loading match...",
        msg.init.tname + " vs " + msg.init.ctname,
        "Map: " + msg.init.mapname,
      ]);
    });

    playerMessageBus.listen([MSG_PLAY_CHANGE], function (msg) {
      setIsPlaying(msg.playing);
      if (msg.playing) {
        setHasPlayed(true);
      }
      if (!msg.playing) {
        setLoadingMessage(["Loading..."]);
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
    } else if (isWasmLoaded && location.query.faceit_match_id) {
      // Handle Faceit match ID parameter
      const matchId = location.query.faceit_match_id;
      
      if (!FACEIT_MATCH_ID_VALIDATION_PATTERN.test(matchId)) {
        setIsError(true);
        setLoadingMessage(["Invalid Faceit match ID format"]);
        return;
      }
      
      // Show dialog to inform user about Faceit download option
      setFaceitMatchId(matchId);
      setShowFaceitDialog(true);
    } else if (isWasmLoaded && location.query.demourl) {
      const demoUrl = location.query.demourl;
      setIsDownloading(true);
      axios
        .get(`${downloadServer}/download?url=${encodeURIComponent(demoUrl)}`, {
          responseType: "arraybuffer",
          onDownloadProgress: (progressEvent) => {
            console.log(
              progressEvent,
              progressEvent.event.target.getResponseHeader("X-Demo-Length")
            );
            var totalSize =
              progressEvent.event.target.getResponseHeader("X-Demo-Length");
            setDownloadProgress(
              totalSize ? (progressEvent.loaded / totalSize) * 100 : 0
            );
            setLoadingMessage([`Downloading demo...`]);
          },
        })
        .then((response) => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setLoadingMessage(["Loading match..."]);
          const contentDisposition = response.headers["content-disposition"];
          let filename = "demo.zst";
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
            if (filenameMatch) {
              filename = filenameMatch[1];
            }
          }
          
          // Extract match ID from demo URL and update browser URL
          const matchIdMatch = demoUrl.match(FACEIT_MATCH_ID_PATTERN);
          if (matchIdMatch && matchIdMatch[1]) {
            const matchId = matchIdMatch[1];
            console.log("Extracted match ID from demo URL:", matchId);
            // Update URL to use faceit_match_id instead of demourl without reloading
            const newUrl = `/player?faceit_match_id=${encodeURIComponent(matchId)}`;
            window.history.replaceState({}, '', newUrl);
          }
          
          worker.current.postMessage({
            filename: filename,
            data: new Uint8Array(response.data),
          });
        })
        .catch((error) => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setIsError(true);
          setLoadingMessage(["Error downloading demo: " + error.message]);
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
      {!isPlaying && !hasPlayed && (
        <div className="loading-overlay">
          <div className="loading-dialog">
            {isError ? (
              <div className="error-icon">⚠️</div>
            ) : (
              <div className="loading-spinner"></div>
            )}
            {loadingMessage.map((msg, idx) => (
              <p key={idx}>{msg}</p>
            ))}
            {isDownloading && (
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
      <Dialog
        header="Faceit Match Demo"
        visible={showFaceitDialog}
        style={{ width: '450px' }}
        onHide={() => setShowFaceitDialog(false)}
        footer={
          <div>
            <Button
              label="Close"
              icon="pi pi-times"
              onClick={() => setShowFaceitDialog(false)}
              autoFocus
            />
          </div>
        }
      >
        <div style={{ marginBottom: '1rem' }}>
          <p>
            To view this demo:
          </p>
          <ol style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', lineHeight: '1.8' }}>
            <li>
              Download the demo from the{' '}
              <a
                href={`https://www.faceit.com/en/cs2/room/${faceitMatchId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#007bff',
                  textDecoration: 'underline',
                  fontWeight: 'bold'
                }}
              >
                Faceit match page
              </a>
            </li>
            <li>Upload it below</li>
          </ol>
          <div style={{ marginTop: '1rem' }}></div>
          <DemoUploadArea
            onFile={({ filename, data }) => {
              setShowFaceitDialog(false);
              worker.current.postMessage({ filename, data });
            }}
          />
        </div>
      </Dialog>
    </ErrorBoundary>
  );
}
