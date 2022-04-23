import {Component} from "react";
import {MSG_PLAY, MSG_PLAY_ROUND_PROGRESS, MSG_PLAY_TOGGLE, MSG_PROGRESS_MOVE} from "../constants";

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

  mouseMove(e) {
    if (e.buttons === 1) {
      this.moveProgress(e)
    }
  }

  mouseDown(e) {
    this.moveProgress(e)
  }

  mouseUp(e) {
    this.messageBus.emit({
      msgType: MSG_PLAY,
    })
  }

  mouseLeave(e) {
    if (e.buttons === 1) {
      this.messageBus.emit({
        msgType: MSG_PLAY,
      })
    }
  }

  moveProgress(e) {
    const barRect = e.currentTarget.getBoundingClientRect()
    const progressWidth = barRect.right - barRect.left
    const x = e.nativeEvent.x - barRect.left
    const progress = x / progressWidth

    this.setState({
      progress: progress,
    })
    this.messageBus.emit({
      msgType: MSG_PROGRESS_MOVE,
      progress: progress,
    })
  }

  render() {
    const progress = {
      width: `${this.state.progress * 100}%`
    }
    return (
        <div className="w3-xlarge w3-left-align w3-dark-gray"
             onMouseMove={this.mouseMove.bind(this)}
             onMouseDown={this.mouseDown.bind(this)}
             onMouseUp={this.mouseUp.bind(this)}
             onMouseLeave={this.mouseLeave.bind(this)}>
          <div className="w3-container w3-gray" style={progress}>
            {this.state.time}
          </div>
        </div>
    );
  }
}

export default Timer
