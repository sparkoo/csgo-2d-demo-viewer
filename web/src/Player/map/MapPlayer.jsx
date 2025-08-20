import "./MapPlayer.css"
import {Component} from "react";

class MapPlayer extends Component {

  render() {
    const posStyle = {
      left: `${this.props.player.x}%`,
      top: `${this.props.player.y}%`,
      background: `linear-gradient(0deg, var(--${this.props.player.team}Color) ${this.props.player.hp}%, transparent 0%)`,
    }
    const rotStyle = {
      transform: `rotate(${this.props.player.rotation}deg) translateY(-50%)`,
    }
    const playerClass = `player
      ${this.props.player.team}
      ${this.props.player.flashed ? "flashed" : ""}
      ${!this.props.player.alive ? "dead" : ""}`
    let playerArrow
    if (this.props.player.alive) {
      playerArrow = <div className={`playerArrow ${this.props.player.team}`} style={rotStyle}></div>
    }

    return (
        <div className={playerClass} style={posStyle}>
          <div className={`playerArrowContainer ${this.props.player.team}`}>
            {playerArrow}
          </div>
          <div className="playerNameTag">{this.props.player.name}</div>
          <div className={`playerMapWeapon ${this.props.player.weapon}`}></div>
        </div>
    );
  }
}

export default MapPlayer
