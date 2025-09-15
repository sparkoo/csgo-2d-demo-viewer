import { Component } from "react";
import { MSG_INIT_ROUNDS, MSG_PLAY, MSG_PLAY_ROUND_UPDATE } from "../constants";
import "./RoundNav.css";

class RoundNav extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rounds: [],
    };
    this.messageBus = props.messageBus;
    this.messageBus.listen(
      [MSG_INIT_ROUNDS],
      function (msg) {
        let rounds = [];
        msg.rounds.forEach((r) => {
          rounds.push(
            <Round
              key={`round${r.roundno}`}
              winner={r.winner}
              roundNo={r.roundno}
              messageBus={this.messageBus}
            />
          );
          if (r.roundno <= 24 && r.roundno % 12 === 0) {
            rounds.push(<br key={`break${r.roundno}`} />);
          } else if (r.roundno > 24 && r.roundno % 6 === 0) {
            rounds.push(<br key={`break${r.roundno}`} />);
          }
        });
        this.setState({
          rounds: rounds,
        });
      }.bind(this)
    );
  }

  render() {
    return (
      <div className="w3-bar w3-small w3-left-align">{this.state.rounds}</div>
    );
  }
}

export default RoundNav;

class Round extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
    };
    this.messageBus = props.messageBus;
    this.messageBus.listen(
      [MSG_PLAY_ROUND_UPDATE],
      function (msg) {
        this.setState({
          active: msg.round === this.props.roundNo,
        });
      }.bind(this)
    );
  }

  playRound(round) {
    this.messageBus.emit({
      msgtype: MSG_PLAY,
      round: round,
    });
  }

  render() {
    return (
      <button
        className={`w3-button roundNav ${this.props.winner} ${
          this.state.active ? "active" : ""
        }`}
        onClick={(_) => this.playRound(this.props.roundNo)}
      >
        {this.props.roundNo}
      </button>
    );
  }
}
