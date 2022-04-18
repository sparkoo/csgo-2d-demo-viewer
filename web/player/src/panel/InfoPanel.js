import {Component} from "react";
import LoadingProgressBar from "./LoadingProgressBar";
import Scoreboard from "./Scoreboard";
import RoundNav from "./RoundNav";

class InfoPanel extends Component {
  constructor(props) {
    super(props);
    this.messageBus = props.messageBus
  }

  render() {
    return <div className="w3-row">
      <LoadingProgressBar messageBus={this.messageBus}/>
      <RoundNav messageBus={this.messageBus}/>
      <Scoreboard messageBus={this.messageBus}/>
      {/*<div id="timerContainer" className="w3-xlarge w3-left-align w3-dark-gray">*/}
      {/*  <div id="timer" className="w3-container w3-gray">*/}
      {/*    0:00*/}
      {/*  </div>*/}
      {/*</div>*/}
      {/*<div className="w3-bar w3-small" id="roundNavBar">*/}
      {/*</div>*/}
      {/*<div className="w3-row">*/}
      {/*  <div className="w3-col l4"><br></div>*/}
      {/*  <div className="w3-col l4">*/}
      {/*    <button className="w3-button w3-ripple w3-dark-gray material-icons"*/}
      {/*            onClick="playRoundIncrement(-1)">&#xe045;*/}
      {/*    </button>*/}
      {/*    <button id="playToggleButton" className="w3-button w3-ripple w3-dark-gray material-icons"*/}
      {/*            onClick="togglePlay()">&#xe037;*/}
      {/*    </button>*/}
      {/*    <button className="w3-button w3-ripple w3-dark-gray material-icons"*/}
      {/*            onClick="playRoundIncrement(1)">&#xe044;*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*  <div className="w3-col l4 w3-right-align">*/}
      {/*    <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick="playSpeed(0.5)">*/}
      {/*      &#xe068;*/}
      {/*    </button>*/}
      {/*    <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick="playSpeed(1)">*/}
      {/*      &#xe037;*/}
      {/*    </button>*/}
      {/*    <button className="w3-button w3-ripple w3-dark-gray material-icons" onClick="playSpeed(4)">*/}
      {/*      &#xe01f;*/}
      {/*    </button>*/}
      {/*  </div>*/}
      {/*</div>*/}
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
