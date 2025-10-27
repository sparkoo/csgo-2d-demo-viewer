import { Component } from "react";
import Scoreboard from "./Scoreboard";
import RoundNav from "./RoundNav";
import Controls from "./Controls";
import Timer from "./Timer";
import PlayerList from "./PlayerList";
import "./InfoPanel.css";

class InfoPanel extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus;
  }

  render() {
    return (
      <div className="info-panel-container">
        <Timer messageBus={this.messageBus} />
        <RoundNav messageBus={this.messageBus} />
        <Controls messageBus={this.messageBus} />
        <Scoreboard messageBus={this.messageBus} />
        <div className="divider"></div>
        <PlayerList messageBus={this.messageBus} />
      </div>
    );
  }
}

export default InfoPanel;
