import { React, useState } from 'react';
import './Uploader.css';
import { FileUpload } from 'primereact/fileupload';

const Uploader = (props) => {
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const onUpload = function (event) {
    console.log("file upload", event)
  }
  return (
    <div>
      <FileUpload mode="basic" name="demo[]" url={serverHost + "/match/upload"} accept="application/*" maxFileSize={10000000} onUpload={onUpload} auto />
    </div>
  )
}

export default Uploader;
