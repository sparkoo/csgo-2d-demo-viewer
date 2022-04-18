import "./RoundNav.css"
import {Component} from "react";
import {MSG_INIT_ROUNDS, MSG_PLAY, MSG_PLAY_ROUND_UPDATE} from "../constants";

class RoundNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rounds: [],
    }
    this.messageBus = props.messageBus
    this.messageBus.listen([MSG_INIT_ROUNDS], function (msg) {
      let rounds = []
      msg.rounds.forEach(r => {
        rounds.push(<Round key={`round${r.RoundNo}`} winner={r.Winner} roundNo={r.RoundNo}
                           messageBus={this.messageBus}/>)
        if (r.RoundNo <= 30 && r.RoundNo % 15 === 0) {
          rounds.push(<br key={`break${r.RoundNo}`}/>)
        } else if (r.RoundNo > 30 && r.RoundNo % 6 === 0) {
          rounds.push(<br key={`break${r.RoundNo}`}/>)
        }
      })
      this.setState({
            rounds: rounds,
          }
      )
    }.bind(this))
  }

  playRound(round) {
    this.messageBus.emit({
      msgType: MSG_PLAY,
      round: round,
    })
  }

  render() {
    return (
        <div className="w3-bar w3-small">
          {this.state.rounds}
        </div>
    );
  }
}

export default RoundNav

class Round extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
    }
    this.messageBus = props.messageBus
    this.messageBus.listen([MSG_PLAY_ROUND_UPDATE], function (msg) {
      this.setState({
        active: msg.round === this.props.roundNo,
      })
    }.bind(this))
  }

  playRound(round) {
    this.messageBus.emit({
      msgType: MSG_PLAY,
      round: round,
    })
  }

  render() {
    return <a href="#"
              className={`w3-button roundNav ${this.props.winner} ${this.state.active ? "active" : ""}`}
              onClick={_ => this.playRound(this.props.roundNo)}>
      {this.props.roundNo}
    </a>
  }
}
