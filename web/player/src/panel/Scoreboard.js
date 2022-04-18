import {Component} from "react";

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
      this.setState({
        TName: msg.init.TName,
        CTName: msg.init.CTName,
      })
    }.bind(this))
  }

  render() {
    return (
        <div>
          <div className="w3-row">
            <div className="w3-col l6 w3-center">
              <h2 className="T">{this.state.TScore}</h2>
            </div>
            <div className="w3-col l6 w3-center">
              <h2 className="CT">{this.state.CTScore}</h2>
            </div>
          </div>
          <div className="w3-row">
            <div className="w3-col l6 w3-center">
              <h3 className="T">{this.state.TName}</h3>
            </div>
            <div className="w3-col l6 w3-center">
              <h3 className="CT">{this.state.CTName}</h3>
            </div>
          </div>
        </div>
    );
  }
}

export default Scoreboard
