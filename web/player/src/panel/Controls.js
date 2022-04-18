import {Component} from "react";
import {MSG_PLAY_ROUND_INCREMENT, MSG_PLAY_SPEED, MSG_PLAY_TOGGLE} from "../constants";

class Controls extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus
  }

  togglePlay() {
    this.messageBus.emit({
      msgType: MSG_PLAY_TOGGLE,
    })
  }

  playRoundIncrement(inc) {
    this.messageBus.emit({
      msgType: MSG_PLAY_ROUND_INCREMENT,
      increment: inc,
    })
  }

  playSpeed(speed) {
    this.messageBus.emit({
      msgType: MSG_PLAY_SPEED,
      speed: speed,
    })
  }

  render() {
    return (
        <div className="w3-row">
          <div className="w3-col l4"><br/></div>
          <div className="w3-col l4">
            <button className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.playRoundIncrement(-1)}>&#xe045;
            </button>
            <button id="playToggleButton" className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.togglePlay()}>&#xe037;
            </button>
            <button className="w3-button w3-ripple w3-dark-gray material-icons"
                    onClick={_ => this.playRoundIncrement(1)}>&#xe044;
            </button>
          </div>
          <div className="w3-col l4 w3-right-align">
            <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(.5)}>
              &#xe068;
            </button>
            <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(.1)}>
              &#xe037;
            </button>
            <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick={_ => this.playSpeed(.4)}>
              &#xe01f;
            </button>
          </div>
        </div>
    )
  }
}

export default Controls
