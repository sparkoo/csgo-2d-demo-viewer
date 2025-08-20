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
          </div>
          <div className="w3-col l2">
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}
