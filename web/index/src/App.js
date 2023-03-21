import './App.css';
import { useState, useEffect } from 'react';

function App() {
  let serverHost = ""
  if (window.location.host.includes("localhost")) {
    serverHost = "http://localhost:8080"
  }

  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch(serverHost + '/match/list')
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setPosts(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    fetch(serverHost + "/auth/whoami")
    .then(response => response.json)
    .then(data => {
      console.log("whoami data vvv")
      console.log(data)
    })
  })

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
                  <a href="https://www.faceit.com/en/players/{{.AuthCookie}}" target="_blank" rel="noreferrer"><img src="/assets/faceit-logo.svg" alt="faceit-logo" height="50" /><span id="faceitNickname">labol</span></a>
                  <a className="material-icons w3-large" href={serverHost + "/auth/faceit/logout"}>logout</a>
                  <a href={serverHost + "/auth/faceit/login"}><img src="/assets/faceit-logo.svg" height="50" alt="faceit-logo" />Connect FACEIT account</a>
                </div>
              </div>
            </div>
            <div id="searchNote" className="w3-margin w3-container w3-center loader w3-xlarge">
            </div>
            <span className="material-icons w3-xxxlarge rotate">autorenew</span>
            <table className="w3-table-all w3-centered w3-hoverable" id="matchList">
            </table>
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
