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
    matchTableUpdater.remove = (matchId) => {
      this.setState({
        matches: this.state.matches
        .filter(m => m.props.match.match_id !== matchId)
      });
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
      playedMap: "...",
      demoLink: "#",
    }
    this.updateMatchDetail()
  }

  updateMatchDetail() {
    fetch(`${faceitApiUrlBase}/matches/${this.props.match.match_id}/stats`,
        reqParamHeaders)
    .then(response => {
      if (response.ok) {
        response.json()
        .then(detail => {
          if (detail.rounds.length === 1 &&
              detail.rounds[0].teams.length === 2) {
            let updatedState = this.state
            updatedState.playedMap = detail.rounds[0].round_stats.Map
            let round = detail.rounds[0]
            updatedState.TeamA = round.teams[0].team_stats.Team
            updatedState.ScoreA = round.teams[0].team_stats["Final Score"]
            updatedState.TeamB = round.teams[1].team_stats.Team
            updatedState.ScoreB = round.teams[1].team_stats["Final Score"]

            let userTeam = ""
            round.teams.forEach(team => {
              if (team.players.some(p => p.player_id === userId)) {
                userTeam = team.team_id
              }
            })
            updatedState.Win = userTeam === round.round_stats.Winner

            this.setState(updatedState)

            this.updateMatchDemoLink()
          } else {
            console.log(
                `removing match ${this.props.match.match_id} because details rounds is ${detail.rounds.length} and teams is ${detail.teams.length}`)
            matchTableUpdater.remove(this.props.match.match_id);
          }
        })
        .catch(reason => console.log("failed", reason))
      } else {
        // remove matches where we can't find detailed stats
        matchTableUpdater.remove(this.props.match.match_id);
      }
    })
    .catch(reason => console.log("failed", reason))
  }

  updateMatchDemoLink() {
    fetch(`${faceitApiUrlBase}/matches/${this.props.match.match_id}`,
        reqParamHeaders)
    .then(response => {
      if (response.ok) {
        response.json()
        .then(detail => {
          let updatedState = this.state;
          if (detail.demo_url.length === 1) {
            updatedState.demoLink = detail.demo_url[0]
          } else {
            updatedState.demoLink = ""
          }
          this.setState(updatedState)
        })
      } else {
        updatedState.demoLink = ""
        this.setState(updatedState)
      }
    })
  }

  render() {
    let demoDownloadLink;
    if (this.state.demoLink.length > 0) {
      demoDownloadLink = <a href={this.state.demoLink}
                            className={"material-icons w3-hover-text-amber "
                                + (this.state.demoLink === "#" ? "rotate"
                                    : "")}>{(this.state.demoLink === "#"
          ? "loop"
          : "file_download")}</a>
    }

    return <tr className="w3-hover-gray w3-medium">
      <td className="w3-col l2">
        {this.state.playedTime}
      </td>
      <td className="w3-col l1">
        {this.state.playedMap}
      </td>
      <td className="w3-col l2 w3-centered">
        {this.props.match.game_mode}
      </td>
      <td className="w3-col l2 w3-right-align">
        {this.state.TeamA}
      </td>
      <td className={"w3-col l1 " + (this.state.Win ? "w3-green" : "w3-red")}>
        {this.state.ScoreA} : {this.state.ScoreB}
      </td>
      <td className="w3-col l2 w3-left-align">
        {this.state.TeamB}
      </td>
      <td className="w3-col l2 actionButtons w3-right-align">
        {demoDownloadLink}
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
    saveSearchedNicknameToCookie(e.target.value)
    listMatches(e.target.value)
  }
}

function listMatches(nickname) {
  ReactDOM.render(
      <span className="material-icons w3-xxxlarge rotate">autorenew</span>,
      document.getElementById('searchNote')
  );

  matchTableUpdater.clearMatches()

  fetch(`${faceitApiUrlBase}/players?nickname=${nickname}`,
      reqParamHeaders)
  .then(response => {
    if (response.ok) {
      response.json()
      .then(player => {
        userName = nickname
        userId = player.player_id
        fetchMatches(player.player_id)
      })
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
  fetch(`${faceitApiUrlBase}/players/${playerId}/history?limit=100`,
      reqParamHeaders)
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

let userName = ""
let userId = ""
if (document.cookie.length > 0) {
  let cookie = document.cookie
  cookie.split(";").forEach(c => {
    let kv = c.split("=")
    if (kv[0] === "lastSearchedNickname") {
      userName = kv[1]
      listMatches(userName)
    }
  })
}

const searchInput = <input
    className="w3-input w3-round w3-xxlarge"
    type="text"
    placeholder="faceit nickname or id"
    onKeyUp={playerSearchSubmit}
    defaultValue={userName}/>
ReactDOM.render(
    searchInput,
    document.getElementById("searchBar")
)