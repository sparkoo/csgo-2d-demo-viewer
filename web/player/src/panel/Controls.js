import "./Controls.css"
import {Component} from "react";
import {MSG_PLAY_CHANGE, MSG_PLAY_ROUND_INCREMENT, MSG_PLAY_SPEED, MSG_PLAY_TOGGLE} from "../constants";

class Controls extends Component {
  constructor(props) {
    super(props);
    this.state = {
      playing: false,
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
    this.messageBus.emit({
      msgtype: MSG_PLAY_SPEED,
      speed: speed,
    })
  }

  render() {
    const playButton = this.state.playing ? String.fromCodePoint(0xe034) : String.fromCodePoint(0xe037)

    return (
        <div className="w3-row">
          <div className="w3-col l4">&nbsp;</div>
          <div className="w3-col l4">
            <button className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.playRoundIncrement(-1)}>&#xe045;
            </button>
            <button className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.togglePlay()}>{playButton}
            </button>
            <button className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.playRoundIncrement(1)}>&#xe044;
            </button>
          </div>
          {/*<div className="w3-col l4 w3-right-align">*/}
          {/*  <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(.5)}>*/}
          {/*    &#xe068;*/}
          {/*  </button>*/}
          {/*  <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(1)}>*/}
          {/*    &#xe037;*/}
          {/*  </button>*/}
          {/*  <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(4)}>*/}
          {/*    &#xe01f;*/}
          {/*  </button>*/}
          {/*</div>*/}
        </div>
    )
  }
}

export default Controls
