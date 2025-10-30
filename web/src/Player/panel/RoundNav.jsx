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
              endReason={r.endreason}
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
      <div className="round-nav-container">
        <div className="w3-bar w3-small w3-left-align">{this.state.rounds}</div>
      </div>
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

  getRoundEndIcon() {
    const endReason = this.props.endReason;
    // RoundEndReason enum values from protobuf:
    // STILLINPROGRESS: 0, TARGETBOMBED: 1, BOMBDEFUSED: 7, 
    // CTWIN: 8, TERRORISTSWIN: 9, TARGETSAVED: 12
    
    switch (endReason) {
      case 1: // TARGETBOMBED - bomb exploded
        return "💣";
      case 7: // BOMBDEFUSED - bomb defused
        return "🔧";
      case 8: // CTWIN - full kills (CT)
      case 9: // TERRORISTSWIN - full kills (T)
        return "☠️";
      case 12: // TARGETSAVED - time expired
        return "⏱️";
      default:
        return "";
    }
  }

  render() {
    const icon = this.getRoundEndIcon();
    return (
      <button
        className={`w3-button roundNav ${this.props.winner} ${
          this.state.active ? "active" : ""
        }`}
        onClick={(_) => this.playRound(this.props.roundNo)}
        title={this.getRoundEndReasonText()}
      >
        <span className="round-number">{this.props.roundNo}</span>
        {icon && <span className="round-icon">{icon}</span>}
      </button>
    );
  }

  getRoundEndReasonText() {
    const endReason = this.props.endReason;
    switch (endReason) {
      case 1:
        return "Bomb exploded";
      case 7:
        return "Bomb defused";
      case 8:
      case 9:
        return "Full kills";
      case 12:
        return "Time expired";
      default:
        return "";
    }
  }
}
