import {Component} from "react";
import PlayerListItem from "./PlayerListItem";
import "./PlayerList.css";

class PlayerList extends Component {
  constructor(props) {
    super(props);
    this.messageBus = this.props.messageBus
    this.messageBus.listen([1], this.update.bind(this))
    this.state = {
      players: [],
    }
  }

  update(msg) {
    this.setState({
      players: msg.tickstate.playersList,
    })
  }

  render() {
    const players = {"T": [], "CT": []}
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        players[p.team].push(<PlayerListItem key={p.playerid} player={p} />)
      })
    }
    return <div className="player-list-container w3-row">
      <div className="w3-col l6 team-section">
        <div className="T w3-medium team-list" id="TList">
          {players.T}
        </div>
      </div>
      <div className="w3-col l6 team-section">
        <div className="CT w3-medium team-list" id="CTList">
          {players.CT}
        </div>
      </div>
    </div>
  }
}

export default PlayerList
