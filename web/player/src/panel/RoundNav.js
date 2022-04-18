import "./RoundNav.css"
import {Component} from "react";
import {MSG_INIT_ROUNDS, MSG_PLAY} from "../constants";

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
        rounds.push(
            <a href="#"
               key={`round${r.RoundNo}`}
               className={`w3-button roundNav ${r.Winner}`}
               onClick={_ => this.playRound(r.RoundNo)}>
              {r.RoundNo}
            </a>)
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
