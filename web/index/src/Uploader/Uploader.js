import 'filepond/dist/filepond.min.css';
import { React, useState } from 'react';
import { FilePond } from 'react-filepond';
import './Uploader.css';

let uuid = crypto.randomUUID()

const Uploader = (props) => {
  const [demofile, setFiles] = useState([])
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [playerHost] = useState(window.location.host.includes("localhost") ? "http://localhost:3000" : "")
  console.log("random", uuid)

  return <FilePond
    files={demofile}
    onupdatefiles={setFiles}
    allowMultiple={false}
    maxFiles={1}
    server={serverHost + "/demo/upload?matchId=" + uuid}
    chunkSize={10000000}
    chunkUploads={true}
    name="files"
    labelIdle='Drop your demo file here or <span class="filepond--label-action">Browse</span>. GZ format required'
    credits={false}
    acceptedFileTypes={"application/octet-stream"}
    onpreparefile={(f,out) => {console.log("preparefile", f, out);}}
    onactivatefile={() => {console.log("onactivatefile")}}
    onaddfilestart={() => {console.log("onaddfilestart"); uuid = crypto.randomUUID();}}
    onprocessfilestart={() => {console.log("onprocessfilestart"); window.open(playerHost + "/player?platform=upload&matchId=" + uuid, "_blank");}}
    onprocessfile={(e, f) => {console.log("onprocessfile",e, f);}}
    onaddfileprogress={() => {console.log("onaddfileprogress")}}
    onprocessfileprogress={(fil,ee) => {console.log("onprocessfileprogress", fil, ee)}}
  />
}

export default Uploader;
