import "./MapNade.css"
import {Component} from "react";

class MapNade extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const className = `mapNade ${this.props.nade.kind} ${this.props.nade.action}`
    const style = {
      left: `${this.props.nade.x}%`,
      top: `${this.props.nade.y}%`,
    }
    return (
        <div className={className} style={style}>

        </div>
    );
  }
}

export default MapNade
