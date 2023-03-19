'use strict';

const faceitApiUrlBase = "/faceit/api";

let matchTableUpdater = {};

class MatchTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = { matches: [] }
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
    fetch(`${faceitApiUrlBase}/matches/${this.props.match.match_id}/stats`)
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
              } else {
                console.log(
                  `removing match ${this.props.match.match_id} because details rounds is ${detail.rounds.length} and teams is ${detail.teams.length}`)
                matchTableUpdater.remove(this.props.match.match_id);
              }
            })
            .catch(reason => console.log("failed", reason))
        } else {
          // try again
          let updateAgain = function() {
            this.updateMatchDetail()
          }.bind(this)
          setTimeout(updateAgain, 1000)
          
          // remove matches where we can't find detailed stats
          // matchTableUpdater.remove(this.props.match.match_id);
        }
      })
      .catch(reason => console.log("failed", reason))
  }

  downloadDemo(matchId) {
    fetch(`${faceitApiUrlBase}/matches/${matchId}`)
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
                renderError(`not expected to get ${detail.demo_url.length} demos`)
              }
            })
        } else {
          renderError(`response not ok, code: '${response.status}'`)
        }
      }).catch(error =>
        renderError(`no demo for match '${matchId}'. error: ${error.message}`))

  }

  render() {
    let demoDownloadLink;
    if (this.state.demoLink.length > 0) {
      demoDownloadLink = <a href={"#"}
        onClick={(e) => {
          e.preventDefault()
          this.downloadDemo(this.props.match.match_id)
        }}
        className={"material-icons w3-hover-text-amber"}>{"file_download"}</a>
    }

    let playerLink = `player?matchId=${this.props.match.match_id}`
    if (window.location.host.includes("localhost")) {
      playerLink = `http://localhost:3000/${playerLink}`
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
        <a href={playerLink} target="_blank"
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
  if (window.history.replaceState) {
    const url = window.location.protocol
      + "//" + window.location.host
      + window.location.pathname
      + "?nickname="
      + e.target.value;

    window.history.replaceState({
      path: url
    }, "", url)
  }

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

  fetch(`${faceitApiUrlBase}/players?nickname=${nickname}`)
    .then(response => {
      if (response.ok) {
        response.json()
          .then(player => {
            userName = nickname
            userId = player.player_id
            fetchMatches(player.player_id)
          })
          .catch(reason => ReactDOM.render(
            <span>Failed to parse faceit api response '{reason.message}'</span>,
            document.getElementById("searchNote")))
      } else {
        let updateAgain = function() {
          this.listMatches(nickname)
        }.bind(this)
        setTimeout(updateAgain, 1000)
        // ReactDOM.render(
        //   <span>player '{nickname}' does not exist on faceit ...</span>,
        //   document.getElementById("searchNote")
        // )
      }
    })
    .catch(reason => {
      renderError(`"Failed request to Faceit API: '${reason.message}'`)
    })
}

function renderError(message) {
  ReactDOM.render(
    <div className="w3-panel w3-red">
      <p>{message}</p>
    </div>,
    document.getElementById("searchNote"))
}

function fetchMatches(playerId) {
  fetch(`${faceitApiUrlBase}/players/${playerId}/history?limit=30`)
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        let updateAgain = function() {
          listMatches(nickname)
        }
        setTimeout(updateAgain, 1000)
        this.fetchMatches(playerId)
      }
    })
    .then(matchesResponse => {
      matchesResponse.items
      .filter(m => m.game_mode.includes("5v5", 0))
      .filter(m => m.finished_at > m.started_at)
      .forEach(match => {
        matchTableUpdater.addMatch(<MatchRow match={match} key={match.match_id} />)
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
  <MatchTable />,
  document.getElementById("matchList")
)

let userName = ""
let userId = ""

// use nickname from query if set
let paramString = window.location.search.split('?')[1];
let queryString = new URLSearchParams(paramString);
for (let pair of queryString.entries()) {
  if (pair[0] === "nickname") {
    userName = pair[1]
    saveSearchedNicknameToCookie(userName)
    break
  }
}

if (document.getElementById("faceitNickname")) {
  listMatches(document.getElementById("faceitNickname").innerHTML)
}

const searchInput = <input
  className="w3-input w3-round w3-xxlarge"
  type="text"
  placeholder="faceit nickname or id"
  onKeyUp={playerSearchSubmit}
  defaultValue={userName} />

ReactDOM.render(
  searchInput,
  document.getElementById("searchBar")
)