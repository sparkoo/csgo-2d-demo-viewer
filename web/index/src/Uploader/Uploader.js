import { React, useState } from 'react';
import './Uploader.css';
import { FileUpload } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';

const Uploader = (props) => {
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [uploadProgress, setUploadProgress] = useState([])
  const onUpload = function (event) {
    console.log("file upload", event)
  }

  const onProgress = (event, filename) => {
    console.log("progress", filename, event)
  }

  const uploadChunk = function (chunk, filename, chunkId) {
    console.log("uploading chunk", filename)
    

    let formData = new FormData();
    formData.append("demoFile", chunk, filename);

    let xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      // TODO: set new state with progresses
      console.log("progress", uploadProgress)
      setUploadProgress((old) => old.map(p => {
        if (p.chunkId === chunkId) {
          return {
            chunkId: chunkId,
            filename: filename,
            loaded: e.loaded,
            total: e.total
          }
        } else {
          return p
        }
      }))
    });
    xhr.onreadystatechange = (xhr, event) => {
      console.log("onreadystatechange", xhr, event)
    };
    xhr.open('POST', serverHost + "/match/upload", true);
    xhr.send(formData);
  }

  const uploadHandler = function ({ files }) {
    const [file] = files;
    const chunkSize = 1024 * 1024 * 30; // 30MB

    let start = 0;
    let chunkNo = 0;
    while (start < file.size) {
      const newUp = {
        chunkId: chunkNo,
        filename: file.name + "_" + chunkNo,
        loaded: 0,
        total: 0
      }
      setUploadProgress(old => [...old, newUp])
      uploadChunk(file.slice(start, start + chunkSize), file.name + "_" + chunkNo, chunkNo++);
      start += chunkSize;
    }
  }

const valueTemplate = function(p, percent) {
  return p.filename
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
          <ProgressBar key={p.chunkId} value={(p.loaded/p.total) * 100} displayValueTemplate={(percent) => valueTemplate(p, percent)} />
        ))}
      </div>
    </div>
  )
}

export default Uploader;
