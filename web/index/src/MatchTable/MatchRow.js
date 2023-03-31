import { useEffect, useState } from 'react';

const MatchRow = (props) => {
  const [match, setMatch] = useState(props.details)

  let winner = false
  let winnerTeam = []
  if (match.scoreA > match.scoreB) {
    winnerTeam = match.teamAPlayers
  } else {
    winnerTeam = match.teamBPlayers
  }
  winnerTeam.forEach(pId => {
    if (pId === props.auth.faceitGuid) {
      winner = true
    }
  });

  useEffect(() => {
    if (match.map.length > 0) {
      return
    }
    fetch(`${props.serverHost}/match/detail?platform=${match.hostPlatform}&matchId=${match.matchId}`, {
      credentials: "include", method: "POST", body: JSON.stringify(match)
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("got", data)
        setMatch(data)
      })
      .catch((err) => {
        console.log("failed to request matches", err.message);
      });
  }, [match, props.serverHost])

  return (
    <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2 w3-left-align">
        <img src="/assets/faceit-logo.svg" className="w3-margin-right" alt="faceit-logo" height="32" />
        {match.dateTime}
      </td>
      <td className="w3-col l2">
        {match.map}
      </td>
      <td className="w3-col l2 w3-right-align">
        {match.teamA}
      </td>
      <td className={"w3-col l1 " + (winner ? "w3-green" : "w3-red")}>
        {match.scoreA} : {match.scoreB}
      </td>
      <td className="w3-col l2 w3-left-align">
        {match.teamB}
      </td>
      <td className="w3-col l2 w3-centered">
        {match.type}
      </td>
      <td className="w3-col l1 actionButtons w3-right-align">
        {match.demoLink}
        <a href={match.matchLink}
          target="_blank" rel="noreferrer"
          className="material-icons w3-hover-text-deep-orange">table_chart</a>
        <a href={"/player?matchId=" + match.matchId}
          target="_blank" rel="noreferrer"
          className="material-icons w3-hover-text-amber">play_circle_outline</a>
      </td>
    </tr>
  )
}

export default MatchRow;
