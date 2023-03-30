import { useState, useEffect } from 'react';
import MatchRow from './MatchRow';

const MatchTable = (props) => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetch(props.serverHost + '/match/list', { credentials: "include" })
      .then((response) => response.json())
      .then((data) => {
        setMatches(data)
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [props.serverHost, matches])

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

export default MatchTable;
