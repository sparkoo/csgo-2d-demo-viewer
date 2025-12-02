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

// Faceit API endpoints
const FACEIT_MATCH_API = "https://www.faceit.com/api/match/v2/match";
const FACEIT_DOWNLOAD_API = "https://www.faceit.com/api/download/v2/demos/download-url";

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
      
      // Validate match ID format (should match Faceit match ID pattern)
      // Expected format: 1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx-x-x
      const matchIdPattern = /^\d+-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-\d+-\d+$/;
      if (!matchIdPattern.test(matchId)) {
        setIsError(true);
        setLoadingMessage(["Invalid Faceit match ID format"]);
        return;
      }
      
      setLoadingMessage(["Fetching demo from Faceit..."]);
      
      // First, fetch match details
      fetch(`${FACEIT_MATCH_API}/${matchId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch match data: ${response.status}`);
          }
          return response.json();
        })
        .then((matchData) => {
          console.log("Match data:", matchData);
          
          // Validate that demoURLs exists, is an array, and has at least one element
          if (!matchData.payload?.demoURLs || 
              !Array.isArray(matchData.payload.demoURLs) || 
              matchData.payload.demoURLs.length === 0) {
            throw new Error("No demo URLs found in match data");
          }
          
          const demoUrl = matchData.payload.demoURLs[0];
          
          // Then, get the download URL
          return fetch(FACEIT_DOWNLOAD_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resource_url: demoUrl,
            }),
          });
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch download URL: ${response.status}`);
          }
          return response.json();
        })
        .then((downloadData) => {
          // Validate download URL exists in response
          if (!downloadData.payload?.download_url) {
            throw new Error("No download URL found in response");
          }
          
          const downloadUrl = downloadData.payload.download_url;
          console.log("Demo download URL:", downloadUrl);
          
          // Validate the download URL is from expected Faceit CDN domains
          // Known Faceit demo CDN domains (Backblaze B2)
          // NOTE: This list should be kept in sync with server/download.go allowedHosts
          // Update this list if Faceit adds new CDN regions
          const allowedDomains = [
            'demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com',
            'demos-us-east-faceit-cdn.s3.us-east-005.backblazeb2.com'
          ];
          
          try {
            const url = new URL(downloadUrl);
            if (url.protocol !== 'https:' || !allowedDomains.includes(url.hostname)) {
              throw new Error("Demo URL is not from an expected Faceit CDN domain");
            }
          } catch (e) {
            throw new Error(`Invalid demo download URL: ${e.message}`);
          }
          
          // Now download the demo
          setIsDownloading(true);
          return axios.get(`${downloadServer}/download?url=${encodeURIComponent(downloadUrl)}`, {
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
          });
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
          worker.current.postMessage({
            filename: filename,
            data: new Uint8Array(response.data),
          });
        })
        .catch((error) => {
          setIsDownloading(false);
          setDownloadProgress(0);
          setIsError(true);
          setLoadingMessage(["Error loading demo: " + error.message]);
        });
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
    </ErrorBoundary>
  );
}
