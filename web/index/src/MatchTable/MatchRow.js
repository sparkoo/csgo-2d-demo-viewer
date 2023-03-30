const MatchRow = (props) => {
  let winner = false
  let winnerTeam = []
  if (props.details.scoreA > props.details.scoreB) {
    winnerTeam = props.details.teamAPlayers
  } else {
    winnerTeam = props.details.teamBPlayers
  }
  winnerTeam.forEach(pId => {
    if (pId === props.auth.faceitGuid) {
      winner = true
    }
  });

  return (
    <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2 w3-left-align">
        <img src="/assets/faceit-logo.svg" className="w3-margin-right" alt="faceit-logo" height="32" />
        {props.details.dateTime}
      </td>
      <td className="w3-col l2">
        {props.details.map}
      </td>
      <td className="w3-col l2 w3-right-align">
        {props.details.teamA}
      </td>
      <td className={"w3-col l1 " + (winner ? "w3-green" : "w3-red")}>
        {props.details.scoreA} : {props.details.scoreB}
      </td>
      <td className="w3-col l2 w3-left-align">
        {props.details.teamB}
      </td>
      <td className="w3-col l2 w3-centered">
        {props.details.type}
      </td>
      <td className="w3-col l1 actionButtons w3-right-align">
        {props.details.demoLink}
        <a href={props.details.matchLink}
          target="_blank" rel="noreferrer"
          className="material-icons w3-hover-text-deep-orange">table_chart</a>
        <a href={props.details.matchId}
          target="_blank" rel="noreferrer"
          className="material-icons w3-hover-text-amber">play_circle_outline</a>
      </td>
    </tr>
  )
}

export default MatchRow;
