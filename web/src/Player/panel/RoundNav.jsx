import { Component } from "react";
import { MSG_INIT_ROUNDS, MSG_PLAY, MSG_PLAY_ROUND_UPDATE } from "../constants";
import "./RoundNav.css";

// Round end reason constants from protobuf (proto.csgo.Round.RoundEndReason)
const RoundEndReason = {
  STILLINPROGRESS: 0,
  TARGETBOMBED: 1,
  BOMBDEFUSED: 7,
  CTWIN: 8,
  TERRORISTSWIN: 9,
  TARGETSAVED: 12
};

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
    
    switch (endReason) {
      case RoundEndReason.TARGETBOMBED:
        return "💣";
      case RoundEndReason.BOMBDEFUSED:
        return "🔧";
      case RoundEndReason.CTWIN:
      case RoundEndReason.TERRORISTSWIN:
        return "☠️";
      case RoundEndReason.TARGETSAVED:
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
      case RoundEndReason.TARGETBOMBED:
        return "Bomb exploded";
      case RoundEndReason.BOMBDEFUSED:
        return "Bomb defused";
      case RoundEndReason.CTWIN:
      case RoundEndReason.TERRORISTSWIN:
        return "Full kills";
      case RoundEndReason.TARGETSAVED:
        return "Time expired";
      default:
        return "";
    }
  }
}
