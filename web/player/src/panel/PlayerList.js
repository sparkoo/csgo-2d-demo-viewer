import {Component} from "react";
import PlayerListItem from "./PlayerListItem";

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
      players: msg.tickState.Players,
    })
  }

  render() {
    const players = {"T": [], "CT": []}
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        players[p.Team].push(<PlayerListItem key={p.PlayerId} player={p} />)
      })
    }
    return <div className="w3-row">
      <div className="w3-col l6">
        <div className="T w3-medium" id="TList">
          {players.T}
        </div>
      </div>
      <div className="w3-col l6">
        <div className="CT w3-medium" id="CTList">
          {players.CT}
        </div>
      </div>
    </div>
  }
}

export default PlayerList
