import "./MapBomb.css"
import {Component} from "react";

class MapBomb extends Component {
  render() {
    const style = {
      left: `${this.props.bomb.x}%`,
      top: `${this.props.bomb.y}%`,
    }
    console.log(this.props.bomb.state)
    return (
        <div className={"mapBomb"} style={style}>
          &nbsp;
        </div>
    );
  }
}

export default MapBomb
