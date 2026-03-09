import { useState } from "react";
import "./Uploader.css";

const DEMO_ACCEPT = ".dem,.dem.gz,.dem.zst,.dem.bz2";

const DemoUploadArea = ({ onFile, subtext = "Supports .dem, .dem.gz, .dem.zst and .dem.bz2 files" }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    onFile({ filename: file.name, data: new Uint8Array(arrayBuffer) });
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDragEnter = (e) => {
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
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-container">
      <div
        className={`upload-area ${isDragOver ? "dragover" : ""}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="upload-icon">📂</span>
        <div className="upload-text">Drop Demo File Here or Click to Browse</div>
        <div className="upload-subtext">{subtext}</div>
        <input
          type="file"
          accept={DEMO_ACCEPT}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) handleFile(file);
          }}
          className="upload-input"
        />
      </div>
    </div>
  );
};

export default DemoUploadArea;
