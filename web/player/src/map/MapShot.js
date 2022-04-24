import "./MapShot.css"
import {Component} from "react";

class MapShot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transformStyle: `rotate(${this.props.shot.Rotation}deg) translateY(-100%)`,
      hiddent: false,
    }
  }

  componentDidMount() {
    setTimeout(function () {
      this.setState({
        transformStyle: `rotate(${this.props.shot.Rotation}deg) translateY(-500%)`,
      })
    }.bind(this), 10)

    setTimeout(function () {
      this.setState({
        hidden: true,
      })
    }.bind(this), 100)
  }

  render() {
    const style = {
      top: `${this.props.shot.Y}%`,
      left: `${this.props.shot.X}%`,
      transform: this.state.transformStyle,
    }
    return (
        <div className={"playerShot"} style={style} hidden={this.state.hidden}>
        </div>
    );
  }
}

export default MapShot
