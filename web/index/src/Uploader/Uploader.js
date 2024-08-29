import { React, useState } from 'react';
import './Uploader.css';
import { FileUpload } from 'primereact/fileupload';

const Uploader = (props) => {
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [uploadProgress, setUploadProgress] = useState([])
  const onUpload = function (event) {
    console.log("file upload", event)
  }

  const onProgress = (event, filename) => {
    console.log("progress", filename, event)
  }

  const uploadHandler = function ({ files }) {

    const uploadChunk = function (chunk, filename, chunkId) {
      console.log("uploading chunk", filename)
      let progressBar = {
        chunkId: chunkId,
        filename: filename,
        loaded: 0,
        total: 0
      }
      setUploadProgress([...uploadProgress, progressBar])

      let formData = new FormData();
      formData.append("demoFile", chunk, filename);

      let xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        // TODO: set new state with progresses
        console.log("progress", filename)
        progressBar.loaded = e.loaded
        progressBar.total = e.total
      });
      xhr.onreadystatechange = (xhr, event) => {
        console.log("onreadystatechange", xhr, event)
      };
      xhr.open('POST', serverHost + "/match/upload", true);
      xhr.withCredentials = props.withCredentials;
      xhr.send(formData);
    }

    const [file] = files;
    const chunkSize = 1024 * 1024 * 30; // 30MB

    let start = 0;
    let chunkNo = 0;
    while (start < file.size) {
      uploadChunk(file.slice(start, start + chunkSize), file.name + "_" + chunkNo, chunkNo++);
      start += chunkSize;
    }
  }

  return (
    <div>
      <FileUpload
        mode="basic"
        name="demoFile"
        url={serverHost + "/match/upload"}
        accept="application/*"
        maxFileSize={200_000_000}
        onUpload={onUpload}
        // onProgress={onProgress}
        customUpload={true}
        uploadHandler={uploadHandler}
        auto />
      <div>
        {uploadProgress.map((p) => (
          <div key={p.chunkId}>{p.filename} - {p.loaded}/{p.total}</div>
        ))}
      </div>
    </div>
  )
}

export default Uploader;
