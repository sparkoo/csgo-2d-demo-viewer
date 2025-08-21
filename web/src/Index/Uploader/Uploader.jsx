import "./Uploader.css";
import { FileUpload } from "primereact/fileupload";
import { useLocation } from "preact-iso";
import { useContext } from "react";
import { DemoContext } from "../../context";

const Uploader = () => {
  const demoData = useContext(DemoContext);
  const { route } = useLocation();

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

  return (
    <div>
      <FileUpload
        mode="basic"
        name="demoFile"
        accept="application/zstd"
        maxFileSize={500_000_000}
        // onProgress={onProgress}
        customUpload={true}
        uploadHandler={uploadHandler}
        auto
      />
    </div>
  );
};

export default Uploader;
