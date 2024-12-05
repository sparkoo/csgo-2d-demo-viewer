import './Uploader.css';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';

const Uploader = (props) => {
  // const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  // const [uploadProgress, setUploadProgress] = useState([])
  // const onUpload = function (event) {
  //   console.log("file upload", event)
  // }

  // const onProgress = (event, filename) => {
  //   console.log("progress", filename, event)
  // }

  const uploadHandler = function ({ files }) {
    const [file] = files;
    console.log(file)
    console.log("am I even here?")

    const reader = new FileReader();
    
    console.log("and here?")
    reader.onload = function (e) {
      console.log("loadedede");
      const arrayBuffer = e.target.result;
      const byteArray = new Uint8Array(arrayBuffer);

      const uuid = crypto.randomUUID()
      window.open("/player?platform=upload&uuid=" + uuid, '_blank').focus();
      const channel = new BroadcastChannel(uuid);
      setTimeout(() => {
        channel.postMessage(byteArray);
      }, 1000)
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div>
      <FileUpload
        mode="basic"
        name="demoFile"
        accept="application/*"
        maxFileSize={200_000_000}
        // onProgress={onProgress}
        customUpload={true}
        uploadHandler={uploadHandler}
        auto />
    </div>
  )
}

export default Uploader;
