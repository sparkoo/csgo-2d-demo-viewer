import { useEffect, useState } from 'react';
import './Home.css';
import MatchTable from './MatchTable/MatchTable';
import DemoLinkInput from './DemoLinkInput/DemoLinkInput';
import Uploader from './Uploader/Uploader';

export function Home() {
  const [auth/*, setAuth*/] = useState([]);
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "");
  const [content, setContent] = useState([]);

  const [isWasmLoaded, setIsWasmLoaded] = useState(false);


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
                  {/* <div className='faceit'>{faceitAuth}</div> */}
                  {/* <div className='steam'>{steamAuth}</div> */}
                </div>
              </div>
            </div>
            <div id="searchNote" className="w3-margin w3-container w3-center loader w3-xlarge">
            </div>
            {content}
            <DemoLinkInput />
            <Uploader />
            <hr />
            <button onClick={clickeeedd}>Testt</button>
            <h3>Test demos</h3>
            <ul>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-c26b4e22-66ac-4904-87cc-3b2b65a67ddb-1-1.dem.gz" target="_blank">Vertigo</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-01b60b8a-0b9c-4fe1-bea2-f9e612523112-1-1.dem.gz" target="_blank">Inferno</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-2ca03eac-ea19-4ea6-9d2c-dfae175ff16c-1-1.dem.gz" target="_blank">Mirage</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-2d177174-727c-4529-b2af-d156d6457da2-1-1.dem.gz" target="_blank">Nuke</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-72fbfe3f-a924-446d-ae8b-03965920425c-1-1.dem.gz" target="_blank">Anubis</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-81f43518-aacc-45ac-a391-b2ada5e6ce53-1-1.dem.gz" target="_blank">Ancient</a>
              </li>
              <li>
                <a href="/player?platform=upload&matchId=https://github.com/sparkoo/csgo-2d-demo-viewer/raw/dev/test_demos/1-a7190a93-3116-41bf-9253-977abaa5cd13-1-1.dem.gz" target="_blank">Dust2</a>
              </li>
            </ul>
          </div>
          <div className="w3-col l2">
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}

function clickeeedd() {
  const uuid = crypto.randomUUID()
  window.open("/player?platform=upload&uuid=" + uuid, '_blank').focus();
  const channel = new BroadcastChannel(uuid);
  setTimeout(() => {
    channel.postMessage("Hey, how's it going mate? I'm from a different tab!");
  }, 100)
  
}