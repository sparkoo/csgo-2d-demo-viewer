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

export default MatchRow;
