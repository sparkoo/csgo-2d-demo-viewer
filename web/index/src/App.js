import './App.css';
import { useState, useEffect } from 'react';
import MatchTable from './MatchTable/MatchTable';

function App() {
  const [auth, setAuth] = useState([]);
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [content, setContent] = useState([]);

  useEffect(() => {
    setContent(<span className="material-icons w3-xxxlarge rotate">autorenew</span>)
    fetch(serverHost + "/auth/whoami", {credentials: "include"})
    .then(response => response.json())
    .then(data => {
      setAuth(data);
      if (Object.keys(data).length > 0) {
        setContent(<MatchTable auth={auth} serverHost={serverHost} />)
      } else {
        setContent()
      }
    })
  }, [serverHost])

  let loginBar = (<a href={serverHost + "/auth/faceit/login"}><img src="/assets/faceit-logo.svg" height="50" alt="faceit-logo" />Connect FACEIT account</a>)
  if (Object.keys(auth).length > 0) {
    loginBar = (
      <div>
        <a href={"https://www.faceit.com/en/players/" + auth.faceitNickname} target="_blank" rel="noreferrer">
          <img src="/assets/faceit-logo.svg" alt="faceit-logo" height="50" /><span id="faceitNickname">{auth.faceitNickname}</span>
        </a>
        <a className="material-icons w3-large" href={serverHost + "/auth/faceit/logout"}>logout</a>
      </div>
    )
  }

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
                  {loginBar}
                </div>
              </div>
            </div>
            <div id="searchNote" className="w3-margin w3-container w3-center loader w3-xlarge">
            </div>
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
