import {Component} from "react";
import LoadingProgressBar from "./LoadingProgressBar";
import Scoreboard from "./Scoreboard";
import RoundNav from "./RoundNav";
import Controls from "./Controls";
import Timer from "./Timer";
import PlayerList from "./PlayerList";

class InfoPanel extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus
  }

  render() {
    return <div className="w3-row">
      <LoadingProgressBar messageBus={this.messageBus}/>
      <Timer messageBus={this.messageBus}/>
      <RoundNav messageBus={this.messageBus}/>
      <Controls messageBus={this.messageBus}/>
      <Scoreboard messageBus={this.messageBus}/>
      <hr/>
      <PlayerList messageBus={this.messageBus}/>
    </div>
  }
}

export default InfoPanel
