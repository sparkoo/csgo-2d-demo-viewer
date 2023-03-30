import { useState, useEffect } from 'react';
import MatchRow from './MatchRow';

const MatchTable = (props) => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (matches.length > 0) {
      return
    }
    fetch(props.serverHost + '/match/list', { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        console.log("got", data)
        setMatches(data)
      })
      .catch((err) => {
        console.log("failed to request matches", err.message);
      });
  }, [matches, props.serverHost])

  return (
    <table className="w3-table-all w3-centered w3-hoverable" id="matchList">
      <tbody>
        {matches.map(match => (
          <MatchRow key={match.matchId} details={match} auth={props.auth} />
        ))}
      </tbody>
    </table>
  )
}

export default MatchTable;
