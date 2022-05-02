import {Component} from "react";

class LoadingProgressBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: false,
      progress: 0,
      message: "",
    }
    props.messageBus.listen([5, 7], function (msg) {
      switch (msg.msgtype) {
        case 5:
          this.setState({
            hidden: true,
          })
          break
        case 7:
          this.setState({
            hidden: false,
            progress: msg.progress.progress,
            message: msg.progress.message,
          })
          break
        default:
          console.log("unknown message [LoadingProgressBar.js]", msg)
      }
    }.bind(this));
  }

  render() {
    if (this.state.hidden) {
      return
    }
    const progress = {
      width: `${this.state.progress}%`
    }
    return (
        <div id="loadingProgress">
          <div className="w3-dark-gray w3-xlarge w3-left-align">
            <div className="w3-container w3-gray" style={progress}>
              <br/>
            </div>
          </div>
          <span id="loadingProgressMessage">{this.state.message}</span>
        </div>
    );
  }
}

export default LoadingProgressBar