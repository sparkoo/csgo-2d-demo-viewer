import {Component} from "react";
import LoadingProgressBar from "./LoadingProgressBar";

class InfoPanel extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus
  }

  render() {
    return <div className="w3-row">
      <LoadingProgressBar messageBus={this.messageBus}/>
    </div>
  }
}

export default InfoPanel
