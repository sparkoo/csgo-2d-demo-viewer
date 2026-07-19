import { useState } from "react";
import { useLocation } from "preact-iso";
import { useContext } from "react";
import { DemoContext } from "../../context";
import DemoUploadArea from "./DemoUploadArea";
import "./Uploader.css";

const Uploader = () => {
  const demoData = useContext(DemoContext);
  const { route } = useLocation();
  const [demoUrl, setDemoUrl] = useState("");
  const [urlError, setUrlError] = useState("");

  const handleFile = ({ filename, data }) => {
    demoData.setDemoData({ filename, data });
    route("/player");
  };

  const handleDemoUrl = (event) => {
    event.preventDefault();

    try {
      const parsedUrl = new URL(demoUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }

      route(`/player?demourl=${encodeURIComponent(parsedUrl.toString())}`);
    } catch {
      setUrlError("Enter a valid http:// or https:// demo URL.");
    }
  };

  return (
    <>
      <DemoUploadArea
        onFile={handleFile}
        subtext="Supports .dem, .dem.gz, .dem.zst and .dem.bz2 files up to 1GB"
      />
      <div className="demo-url-divider">or</div>
      <form className="demo-url-form" onSubmit={handleDemoUrl}>
        <label htmlFor="demo-url">Load from demo URL</label>
        <div className="demo-url-controls">
          <input
            id="demo-url"
            type="url"
            value={demoUrl}
            onInput={(event) => {
              setDemoUrl(event.currentTarget.value);
              setUrlError("");
            }}
            placeholder="http://replay392.valve.net/730/….dem.bz2"
            required
          />
          <button type="submit">Load demo</button>
        </div>
        {urlError && <p className="demo-url-error">{urlError}</p>}
      </form>
    </>
  );
};

export default Uploader;
