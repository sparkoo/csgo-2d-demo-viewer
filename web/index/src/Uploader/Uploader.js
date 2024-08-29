import { React, useState } from 'react';
import './Uploader.css';
import { FileUpload } from 'primereact/fileupload';

const Uploader = (props) => {
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const onUpload = function (event) {
    console.log("file upload", event)
  }

  const uploadHandler = function ({ files }) {
    const [file] = files;
    let formData = new FormData();
    formData.append('demoFile', file);

    fetch(serverHost + "/match/upload",
      {
        method: 'POST',
        body: formData
      },
    ).catch(err => {
      console.log("failed to upload")
    })

    // const fileReader = new FileReader();
    // fileReader.onload = (e) => {
    //   uploadDemo(e.target.result);
    // };
    // fileReader.readAsDataURL(file);
  }

  const uploadDemo = async (demoFile) => {
    let formData = new FormData();
    formData.append('demoFile', demoFile);

    const response = await fetch(serverHost + "/match/upload",
      {
        method: 'POST',
        body: formData
      },
    );
    console.log(response)
  };
  const onProgress = (event) => {
    console.log("progress", event)
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
        onProgress={onProgress}
        // customUpload={true}
        // uploadHandler={uploadHandler}
        auto />
    </div>
  )
}

export default Uploader;
