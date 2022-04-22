import {Component} from "react";
import LoadingProgressBar from "./LoadingProgressBar";
import Scoreboard from "./Scoreboard";
import RoundNav from "./RoundNav";
import Controls from "./Controls";
import Timer from "./Timer";

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
      {/*<hr/>*/}
      {/*<div className="w3-row">*/}
      {/*  <div className="w3-col l6">*/}
      {/*    <div className="T w3-medium" id="TList">*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*  <div className="w3-col l6">*/}
      {/*    <div className="CT w3-medium" id="CTList">*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}
    </div>
  }
}

export default InfoPanel
