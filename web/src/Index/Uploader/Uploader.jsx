import "./Uploader.css";
import { useLocation } from "preact-iso";
import { useContext, useState } from "react";
import { DemoContext } from "../../context";

const Uploader = () => {
  const demoData = useContext(DemoContext);
  const { route } = useLocation();
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadHandler = function ({ files }) {
    const [file] = files;

    const reader = new FileReader();

    reader.onload = function (e) {
      const arrayBuffer = e.target.result;
      const byteArray = new Uint8Array(arrayBuffer);
      demoData.setDemoData({ filename: file.name, data: byteArray });
      route("/player");
      // const uuid = crypto.randomUUID()
      // window.open("/player?platform=upload&uuid=" + uuid, '_blank').focus();
      // const channel = new BroadcastChannel(uuid);
      // setTimeout(() => {
      //   channel.postMessage(byteArray);
      // }, 1000)
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadHandler({ files });
    }
  };

  return (
    <div className="upload-container">
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="upload-icon">📂</span>
        <div className="upload-text">
          Drop Your Demo File Here or Click to Browse
        </div>
        <div className="upload-subtext">
          Supports .dem.gz, .dem.zst and .dem.bz2 files up to 500MB
        </div>
        <input
          type="file"
          accept=".dem.gz,.dem.zst,.dem.bz2"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              uploadHandler({ files: [file] });
            }
          }}
          className="upload-input"
        />
      </div>
    </div>
  );
};

export default Uploader;
