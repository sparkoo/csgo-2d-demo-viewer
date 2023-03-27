import './App.css';
import { useState, useEffect } from 'react';

function App() {
  const [auth, setAuth] = useState([]);
  const [serverHost] = useState(window.location.host.includes("localhost") ? "http://localhost:8080" : "")
  const [content, setContent] = useState([]);

  useEffect(() => {
    fetch(serverHost + "/auth/whoami", {credentials: "include"})
    .then(response => response.json())
    .then(data => {
      setAuth(data);
      if (Object.keys(data).length > 0) {
        setContent(<MatchTable auth={auth} serverHost={serverHost} />)
      } else {
        setContent(<span className="material-icons w3-xxxlarge rotate">autorenew</span>)
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

const MatchTable = (props) => {
  const [matches, setMatches] = useState([]);
  const [loaded, setLoaded] = useState([]);

  useEffect(() => {
    fetch(props.serverHost + '/match/list')
    .then((response) => response.json())
    .then((data) => {
      setLoaded(true)
      console.log(data)
      setMatches(data)
    })
    .catch((err) => {
      console.log(err.message);
    });
  }, [loaded])

  return (
    <table className="w3-table-all w3-centered w3-hoverable" id="matchList">
      <tbody>
        {matches.map(match => (
          <MatchRow key={match.matchId} details={match} />
        ))}
      </tbody>
    </table>
  )
}

const MatchRow = (props) => {
  return (
    <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2">
        {props.details.dateTime}
      </td>
      <td className="w3-col l1">
        {props.details.map}
      </td>
      <td className="w3-col l2 w3-centered">
        {props.details.type}
      </td>
      <td className="w3-col l2 w3-right-align">
        {props.details.teamA}
      </td>
      <td className={"w3-col l1 " + (true ? "w3-green" : "w3-red")}>
        {props.details.scoreA} : {props.details.scoreB}
      </td>
      <td className="w3-col l2 w3-left-align">
        {props.details.teamB}
      </td>
      <td className="w3-col l2 actionButtons w3-right-align">
        {props.details.demoLink}
        <a href={props.details.matchId}
          target="_blank"
          className="material-icons w3-hover-text-deep-orange">table_chart</a>
        <a href={props.details.matchId} target="_blank"
          className="material-icons w3-hover-text-amber">play_circle_outline</a>
      </td>
    </tr>
  )
}

export default App;
