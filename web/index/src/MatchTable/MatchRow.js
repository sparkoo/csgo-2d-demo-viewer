import { useEffect, useState } from 'react';

const MatchRow = (props) => {
  const [match, setMatch] = useState(props.details)

  let winner = false
  let playerTeam = ""
  match.teamAPlayers.forEach(pId => {
    if (pId === props.auth.faceitGuid) {
      playerTeam = "A"
    }
  })
  match.teamBPlayers.forEach(pId => {
    if (pId === props.auth.faceitGuid) {
      playerTeam = "B"
    }
  })
  
  if (match.scoreA > match.scoreB) {
    if (playerTeam === "A") {
      winner = true
    }
  } else {
    if (playerTeam === "B") {
      winner = true
    }
  }

  useEffect(() => {
    if (match.map.length > 0) {
      return
    }
    fetch(`${props.serverHost}/match/detail?platform=${match.hostPlatform}&matchId=${match.matchId}`, {
      credentials: "include", method: "POST", body: JSON.stringify(match)
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log("got", data)
        setMatch(data)
      })
      .catch((err) => {
        console.log("failed to request matches", err.message);
      });
  }, [match, props.serverHost])

  const downloadDemo = (matchId) => {
    fetch(props.serverHost + `/faceit/api/matches/${matchId}`)
      .then(response => {
        if (response.ok) {
          response.json()
            .then(detail => {
              if (detail.demo_url.length === 1) {
                var element = document.createElement('a');
                element.setAttribute('href', detail.demo_url[0]);
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              } else {
                alert(`not expected to get ${detail.demo_url.length} demos`)
              }
            })
        } else {
          alert(`response not ok, code: '${response.status}'`)
        }
      }).catch(error =>
        alert(`no demo for match '${matchId}'. error: ${error.message}`))
  }

  return (
    <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2 w3-left-align">
        <img src="/assets/faceit-logo.svg" className="w3-margin-right" alt="faceit-logo" height="20" />
        {match.dateTime}
      </td>
      <td className="w3-col l2 w3-centered">
        {match.type}
      </td>
      <td className="w3-col l1">
        {match.map}
      </td>
      <td className="w3-col l2 w3-right-align">
        {playerTeam === "A" && <b>{match.teamA}</b>}
        {playerTeam !== "A" && match.teamA}
      </td>
      <td className={"w3-col l1 " + (winner ? "w3-green" : "w3-red")}>
        {match.scoreA} : {match.scoreB}
      </td>
      <td className="w3-col l2 w3-left-align">
        {playerTeam === "B" && <b>{match.teamB}</b>}
        {playerTeam !== "B" && match.teamB}
      </td>
      <td className="w3-col l2 actionButtons w3-right-align">
        <a href={"/#"}
          onClick={(e) => {
            e.preventDefault()
            downloadDemo(match.matchId)
          }}
          className={"material-icons w3-hover-text-amber"}>{"file_download"}</a>
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
