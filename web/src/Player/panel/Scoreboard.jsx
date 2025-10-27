import {Component} from "react";
import {MSG_TEAMSTATE_UPDATE} from "../constants";
import "./Scoreboard.css";

class Scoreboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      TName: "Terrorists",
      TScore: 0,
      CTName: "Counter Terrorists",
      CTScore: 0,
    }
    props.messageBus.listen([4, 5], function (msg) {
      // console.log(msg)
      this.setState({
        TName: msg.init.tname,
        CTName: msg.init.ctname,
      })
    }.bind(this))

    props.messageBus.listen([MSG_TEAMSTATE_UPDATE], function (msg) {
      this.setState({
        TName: msg.teamstate.tname,
        TScore: msg.teamstate.tscore,
        CTName: msg.teamstate.ctname,
        CTScore: msg.teamstate.ctscore,
      })
    }.bind(this))
  }

  render() {
    return (
        <div className="scoreboard-container">
          <div className="scoreboard-scores">
            <div className="score-display">
              <h2 className="score-number T">{this.state.TScore}</h2>
            </div>
            <div className="score-display">
              <h2 className="score-number CT">{this.state.CTScore}</h2>
            </div>
          </div>
          <div className="scoreboard-teams">
            <div className="score-display">
              <h3 className="team-name T">{this.state.TName}</h3>
            </div>
            <div className="score-display">
              <h3 className="team-name CT">{this.state.CTName}</h3>
            </div>
          </div>
        </div>
    );
  }
}

export default Scoreboard
