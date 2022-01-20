'use strict';

const faceitApiUrlBase = "https://open.faceit.com/data/v4";
const faceitApiKey = "edb4088b-cd60-42e3-96db-0119d8327105";
const reqParamHeaders = {
  headers: {
    Authorization: `Bearer ${faceitApiKey}`
  }
}

function matchRow(key, TeamA, TeamB, ScoreA, ScoreB, time) {
  return <tr key={key}>
    <td className="w3-col l2">
      {time}
    </td>
    <td className="w3-col l1">
      de_dust2
    </td>
    <td className="w3-col l1">
      5v5
    </td>
    <td className="w3-col l6">
      <span className={ScoreA > ScoreB ? "w3-green"
          : ""}>{TeamA}</span> {ScoreA} : {ScoreB} <span
        className={ScoreA < ScoreB ? "w3-green" : ""}>{TeamB}</span>
    </td>
    <td className="w3-col l2">
      <a href="#">Faceit</a> <a href="#">2D</a>
    </td>
  </tr>;
}

function handleMatches(matchesResponse) {
  const matchesList = []
  matchesResponse.items.forEach(match => {
    const time = new Date(match.finished_at * 1000);
    const dateString = `${time.getFullYear()}-${time.getMonth()
    + 1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}`
    matchesList.push(matchRow(match.match_id, match.teams.faction1.nickname,
        match.teams.faction2.nickname, match.results.score.faction1,
        match.results.score.faction2, dateString))
  })
  ReactDOM.render(
      matchesList,
      document.getElementById('matchList')
  );
  ReactDOM.render(
      [],
      document.getElementById("searchNote")
  )
}

function playerSearchSubmit(e) {
  if (e.keyCode === 13) {
    const loading = <span className="material-icons w3-xxxlarge rotate">
      autorenew
      </span>
    ReactDOM.render(
        [],
        document.getElementById('matchList')
    );
    ReactDOM.render(
        loading,
        document.getElementById('searchNote')
    );

    fetch(`${faceitApiUrlBase}/players?nickname=${e.target.value}`,
        reqParamHeaders)
    .then(response => {
      if (response.ok) {
        response.json()
            .then(player => fetchMatches(player.player_id))
            .catch(reason => console.log("failed", reason))
      } else {
        ReactDOM.render(
            [],
            document.getElementById('matchList')
        );
        ReactDOM.render(
            <span>player '{e.target.value}' does not exist on faceit ...</span>,
            document.getElementById("searchNote")
        )
      }
    })
    .catch(reason => console.log("failed", reason))
  }
}

function fetchMatches(playerId) {
  fetch(`${faceitApiUrlBase}/players/${playerId}/history`, reqParamHeaders)
  .then(response => response.json())
  .then(content => handleMatches(content))
  .catch(reason => console.log("failed", reason))
}

const searchInput = <input
    className="w3-input w3-round w3-xxlarge"
    type="text"
    placeholder="faceit nickname or id"
    onKeyUp={playerSearchSubmit}/>
ReactDOM.render(
    searchInput,
    document.getElementById("searchBar")
)
