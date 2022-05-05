import "./MapBomb.css"
import {Component} from "react";

const bombStateClasses = {
  0: "",
  1: "defusing",
  2: "defused",
  3: "explode",
  4: "planting",
  5: "planted",
};

class MapBomb extends Component {
  render() {
    const style = {
      left: `${this.props.bomb.x}%`,
      top: `${this.props.bomb.y}%`,
    }
    // console.log(this.props.bomb.state)

    return (
        <div className={`mapBomb ${bombStateClasses[this.props.bomb.state]}`} style={style}>
          &nbsp;
        </div>
    );
  }
}

export default MapBomb
