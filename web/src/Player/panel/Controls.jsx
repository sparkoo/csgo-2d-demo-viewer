import "./Controls.css"
import { Component } from "react";
import { MSG_PLAY_CHANGE, MSG_PLAY_ROUND_INCREMENT, MSG_PLAY_SPEED, MSG_PLAY_TOGGLE } from "../constants";

class Controls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
      playingSpeed: 1,
    }
    this.messageBus = props.messageBus
    this.messageBus.listen([MSG_PLAY_CHANGE], function (msg) {
      this.setState({
        playing: msg.playing,
      })
    }.bind(this))
  }

  togglePlay() {
    this.messageBus.emit({
      msgtype: MSG_PLAY_TOGGLE,
    })
  }

  playRoundIncrement(inc) {
    this.messageBus.emit({
      msgtype: MSG_PLAY_ROUND_INCREMENT,
      increment: inc,
    })
  }

  playSpeed(speed) {
    this.setState({
      playingSpeed: speed
    })
    this.messageBus.emit({
      msgtype: MSG_PLAY_SPEED,
      speed: speed,
    })
  }

  togglePlaySpeed(speed) {
    if (this.state.playingSpeed === speed) {
      this.playSpeed(1)
    } else {
      this.playSpeed(speed)
    }
  }

  render() {
    const playButton = this.state.playing ? String.fromCodePoint(0xe034) : String.fromCodePoint(0xe037)

    return (
      <div className="controls-container">
        <div className="controls-wrapper">
          <button className="control-button material-icons"
            onClick={_ => this.playRoundIncrement(-1)}>&#xe045;
          </button>
          <button className="control-button play-button material-icons"
            onClick={_ => this.togglePlay()}>{playButton}
          </button>
          <button
            className={`control-button speed-button material-icons ${this.state.playingSpeed === 4 ? "active" : ""}`}
            onClick={_ => this.togglePlaySpeed(4)}>
            &#xe01f;
          </button>
          <button className="control-button material-icons"
            onClick={_ => this.playRoundIncrement(1)}>&#xe044;
          </button>
        </div>
      </div>
    )
  }
}

export default Controls
