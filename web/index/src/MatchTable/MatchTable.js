import { useState, useEffect } from 'react';
import MatchRow from './MatchRow';

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

export default MatchTable;
