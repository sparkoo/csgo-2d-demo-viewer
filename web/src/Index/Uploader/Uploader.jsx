import { useLocation } from "preact-iso";
import { useContext } from "react";
import { DemoContext } from "../../context";
import DemoUploadArea from "./DemoUploadArea";

const Uploader = () => {
  const demoData = useContext(DemoContext);
  const { route } = useLocation();

  const handleFile = ({ filename, data }) => {
    demoData.setDemoData({ filename, data });
    route("/player");
  };

  return (
    <DemoUploadArea
      onFile={handleFile}
      subtext="Supports .dem, .dem.gz, .dem.zst and .dem.bz2 files up to 1GB"
    />
  );
};

export default Uploader;
