import {Component} from "react";
import {MSG_PLAY_ROUND_PROGRESS} from "../constants";

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      time: "0:00",
      progress: 0,
    }
    this.messageBus = props.messageBus
    this.messageBus.listen([8], msg => {
      this.setState(
          {
            time: msg.roundTime.RoundTime,
          }
      )
    })
    this.messageBus.listen([MSG_PLAY_ROUND_PROGRESS], msg => {
      this.setState(
          {
            progress: msg.progress,
          }
      )
    })
  }

  render() {
    const progress = {
      width: `${this.state.progress * 100}%`
    }
    return (
        <div className="w3-xlarge w3-left-align w3-dark-gray">
          <div className="w3-container w3-gray" style={progress}>
            {this.state.time}
          </div>
        </div>
    );
  }
}

export default Timer
