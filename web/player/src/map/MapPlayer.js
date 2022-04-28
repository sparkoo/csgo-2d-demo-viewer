import "./MapPlayer.css"
import {Component} from "react";

class MapPlayer extends Component {

  render() {
    const posStyle = {
      left: `${this.props.player.X}%`,
      top: `${this.props.player.Y}%`,
      background: `linear-gradient(0deg, var(--${this.props.player.Team}Color) ${this.props.player.Hp}%, transparent 0%)`,
    }
    const rotStyle = {
      transform: `rotate(${this.props.player.Rotation}deg) translateY(-50%)`,
    }
    const playerClass = `player
      ${this.props.player.Team}
      ${this.props.player.Flashed ? "flashed" : ""}
      ${!this.props.player.Alive ? "dead" : ""}`
    let playerArrow
    if (this.props.player.Alive) {
      playerArrow = <div className={`playerArrowContainer ${this.props.player.Team}`}>
        <div className={`playerArrow ${this.props.player.Team}`} style={rotStyle}></div>
      </div>
    }
    return (
        <div className={playerClass} style={posStyle}>
          {playerArrow}
          <div className="playerNameTag">{this.props.player.Name}</div>
          <div className={`playerMapWeapon ${this.props.player.Weapon}`}></div>
        </div>
    );
  }
}

export default MapPlayer
