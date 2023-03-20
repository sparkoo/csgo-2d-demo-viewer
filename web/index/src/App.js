import './App.css';
import { useState, useEffect } from 'react';

function App() {
    const [posts, setPosts] = useState([]);
    useEffect(() => {
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=10')
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setPosts(data);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }, []);
    
    return (
      <div className="App">
        <span class="material-icons preload">autorenew</span>
        <div class="w3-container">
          <div class="w3-row">
            <div class="w3-col l2">
              <br />
            </div>
            <div class="w3-col l8">
              <div class="w3-container w3-xlarge w3-light-grey">
                <div>
                  {/* {{ if .AuthCookie }} */}
                  <a href="https://www.faceit.com/en/players/{{.AuthCookie}}" target="_blank"><img src="/assets/faceit-logo.svg" height="50" /><span id="faceitNickname">labol</span></a>
                  <a class="material-icons w3-large" href="/auth/faceit/logout">logout</a>
                  {/* {{ else}} */}
                  <a href="/auth/faceit/login"><img src="/assets/faceit-logo.svg" height="50" />Connect FACEIT account</a>
                  {/* {{ end }} */}
                </div>
              </div>
              <div id="searchNote" class="w3-margin w3-container w3-center loader w3-xlarge">
              </div>
              <table class="w3-table-all w3-centered w3-hoverable" id="matchList">
              </table>
            </div>
            <div class="w3-col l2">
              <br />
            </div>
          </div>
        </div>
      </div>
    );
}

export default App;
