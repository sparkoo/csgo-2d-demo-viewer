import { useEffect, useState } from 'react';
import './App.css';
import MatchTable from './MatchTable/MatchTable';
import Uploader from './Uploader/Uploader';

function App() {
  const [auth, setAuth] = useState([]);
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [content, setContent] = useState([]);

  useEffect(() => {
    if (Object.keys(auth).length > 0) {
      setContent(<MatchTable auth={auth} serverHost={serverHost} />)
      return
    }
    setContent(<span className="material-icons w3-xxxlarge rotate">autorenew</span>)

    fetch(serverHost + "/auth/whoami", { credentials: "include" })
      .then(response => response.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setAuth(data)
        } else {
          setContent(<span className="w3-xxxlarge rotate">Connect account or upload demo file</span>)
        }
      })
      .catch(err => {
        console.log(err)
        setContent(<span className="w3-xxxlarge rotate">failed to contact server ...</span>)
      })
  }, [serverHost, auth])

  // let faceitAuth = (
  //   <div className='faceitAuth'>
  //     <a href={serverHost + "/auth/faceit/login"}>
  //       Connect FACEIT <img src="https://upload.wikimedia.org/wikipedia/commons/5/52/Cib-faceit_%28CoreUI_Icons_v1.0.0%29.svg" height="32" alt="faceit-logo" />
  //     </a>
  //   </div>)
  // let steamAuth = (
  //   <div className='steamAuth'>
  //     <a href={serverHost + "/auth/steam/login"}>
  //       Connect Steam <img src='https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg' height="32" alt="steam-login" />
  //     </a>
  //   </div>
  // )
  // if (Object.keys(auth).length > 0) {
  //   if (auth.faceitNickname) {
  //     faceitAuth = (
  //       <div className='faceitAuth'>
  //         <a href={"https://www.faceit.com/en/players/" + auth.faceitNickname} target="_blank" rel="noreferrer">
  //           <img src="/assets/faceit-logo.svg" alt="faceit-logo" height="32" /><span id="faceitNickname">{auth.faceitNickname}</span>
  //         </a>
  //         <a className="material-icons w3-large" href={serverHost + "/auth/faceit/logout"}>logout</a>
  //       </div>
  //     )
  //   }
  //   if (auth.steamId) {
  //     steamAuth = (
  //       <div className='steamAuth'>
  //         <a href={"https://steamcommunity.com/profiles/" + auth.steamId} target="_blank" rel="noreferrer">
  //         <img src={auth.steamAvatar} height="32" alt="steam-login" /><span id="steamNickname">{auth.steamUsername}</span>
  //         </a>
  //         <a className="material-icons w3-large" href={serverHost + "/auth/steam/logout"}>logout</a>
  //       </div>
  //     )
  //   }
  // }

  return (
    <div className="App">
      <div className="w3-container">
        <div className="w3-row">
          <div className="w3-col l2">
            <br />
          </div>
          <div className="w3-col l8">
            <div className="w3-container w3-xlarge w3-light-grey">
              <div className="w3-row">
                <div className="w3-col l4 w3-left-align">
                  <a href="/"><h1>2d.sparko.cz</h1></a>
                </div>
                <div className='w3-col l4'>
                  &nbsp;
                </div>
                <div className="w3-col l4 w3-right-align">
                  {/* <div className='faceit'>{faceitAuth}</div>
                  <div className='steam'>{steamAuth}</div> */}
                </div>
              </div>
            </div>
            <div id="searchNote" className="w3-margin w3-container w3-center loader w3-xlarge">
            </div>
            <Uploader />
            {content}
          </div>
          <div className="w3-col l2">
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
