'use strict';

const faceitApiUrlBase = "https://open.faceit.com/data/v4";
const faceitApiKey = "edb4088b-cd60-42e3-96db-0119d8327105";
const reqParamHeaders = {
  headers: {
    Authorization: `Bearer ${faceitApiKey}`
  }
}

let matchTableUpdater = {};

class MatchTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {matches: []}
  }

  componentDidMount() {
    matchTableUpdater.addMatch = (match) => {
      let updatedMatches = [...this.state.matches];
      updatedMatches.push(match);
      this.setState({
        matches: updatedMatches
      });
    }
    matchTableUpdater.clearMatches = () => {
      this.setState({
        matches: []
      })
    }
  }

  render() {
    return <tbody>
    {this.state.matches}
    </tbody>
  }
}

class MatchRow extends React.Component {
  constructor(props) {
    super(props);
    const time = new Date(props.match.finished_at * 1000);
    this.state = {
      playedTime: formatDate(time),
      TeamA: props.match.teams.faction1.nickname,
      TeamB: props.match.teams.faction2.nickname,
      ScoreA: props.match.results.score.faction1,
      ScoreB: props.match.results.score.faction2,
    }
  }

  render() {
    return <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2">
        {this.state.playedTime}
      </td>
      <td className="w3-col l3">
        {this.props.match.game_mode}
      </td>
      <td className="w3-col l1">
        {this.state.playedMap}
      </td>
      <td className="w3-col l4">
      <span className={this.state.ScoreA > this.state.ScoreB ?
          "w3-green" : ""}>
        {this.state.TeamA}
      </span>
        {this.state.ScoreA} : {this.state.ScoreB}
        <span
            className={this.state.ScoreA < this.state.ScoreB ?
                "w3-green" : ""}>
        {this.state.TeamB}
      </span>
      </td>
      <td className="w3-col l2 actionButtons w3-right-align">
        <a href={this.props.match.faceit_url.replace("{lang}", "en")}
           target="_blank"
           className="material-icons w3-hover-text-deep-orange">table_chart</a>
        <a href={"/player?matchId=" + this.props.match.match_id} target="_blank"
           className="material-icons w3-hover-text-amber">play_circle_outline</a>
      </td>
    </tr>;
  }
}

function twoDigits(number) {
  if (number < 10) {
    return "0" + number
  } else {
    return number
  }
}

function formatDate(time) {
  let dateString = []
  dateString.push(time.getFullYear())
  dateString.push("-")
  dateString.push(twoDigits(time.getMonth() + 1))
  dateString.push("-")
  dateString.push(twoDigits(time.getDate()))
  dateString.push(" ")
  dateString.push(twoDigits(time.getHours()))
  dateString.push(":")
  dateString.push(twoDigits(time.getMinutes()))

  return dateString.join("")
}

function playerSearchSubmit(e) {
  if (e.keyCode === 13) {
    listMatches(e.target.value)
  }
}

function listMatches(nickname) {
  ReactDOM.render(
      <span className="material-icons w3-xxxlarge rotate">autorenew</span>,
      document.getElementById('searchNote')
  );

  saveSearchedNicknameToCookie(nickname)
  matchTableUpdater.clearMatches()

  fetch(`${faceitApiUrlBase}/players?nickname=${nickname}`,
      reqParamHeaders)
  .then(response => {
    if (response.ok) {
      response.json()
      .then(player => fetchMatches(player.player_id))
      .catch(reason => console.log("failed", reason))
    } else {
      ReactDOM.render(
          <span>player '{nickname}' does not exist on faceit ...</span>,
          document.getElementById("searchNote")
      )
    }
  })
  .catch(reason => console.log("failed", reason))
}

function fetchMatches(playerId) {
  fetch(`${faceitApiUrlBase}/players/${playerId}/history`, reqParamHeaders)
  .then(response => response.json())
  .then(matchesResponse => {
    matchesResponse.items
    .filter(m => m.game_mode.includes("5v5", 0))
    .forEach(match => {
      matchTableUpdater.addMatch(<MatchRow match={match} key={match.match_id}/>)
    })
    ReactDOM.render(
        null,
        document.getElementById('searchNote')
    );
  })
  .catch(reason => console.log("failed", reason))
}

function saveSearchedNicknameToCookie(nickname) {
  document.cookie = `lastSearchedNickname=${nickname}`
}

ReactDOM.render(
    <MatchTable/>,
    document.getElementById("matchList")
)

let lastSearchedNickname = ""
if (document.cookie.length > 0) {
  let cookie = document.cookie
  cookie.split(";").forEach(c => {
    let kv = c.split("=")
    if (kv[0] === "lastSearchedNickname") {
      lastSearchedNickname = kv[1]
      listMatches(lastSearchedNickname)
    }
  })
}

const searchInput = <input
    className="w3-input w3-round w3-xxlarge"
    type="text"
    placeholder="faceit nickname or id"
    onKeyUp={playerSearchSubmit}
    defaultValue={lastSearchedNickname}/>
ReactDOM.render(
    searchInput,
    document.getElementById("searchBar")
)