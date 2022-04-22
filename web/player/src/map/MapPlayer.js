import "./MapPlayer.css"
import {Component} from "react";

class MapPlayer extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const posStyle = {
      left: `${this.props.player.X}%`,
      top: `${this.props.player.Y}%`,
      background: `linear-gradient(0deg, var(--${this.props.player.Team}Color) ${this.props.player.Hp}%, transparent 0%)`,
      opacity: "1",
    }
    const rotStyle = {
      transform: `rotate(${this.props.player.Rotation}deg) translateY(-40%)`,
    }
    return (
        <div className={`player ${this.props.player.Team}`} style={posStyle}>
          <div className={`playerArrowContainer ${this.props.player.Team}`}>
            <div className={`playerArrow ${this.props.player.Team}`}
                 style={rotStyle}></div>
          </div>
        </div>
    );
  }
}

/**
 * <div class="player T deletable" id="playerMap217"
 *            style="left: 55.5173%; top: 37.5477%; background: linear-gradient(0deg, var(--TColor) 92%, transparent 0%); opacity: 1;">
 *         <div id="playerContainer217" class="playerArrowContainer T">
 *           <div id="playerArrow217" class="playerArrow T" style="transform: rotate(16.2488deg) translateY(-40%);"></div>
 *         </div>
 *         <div id="playerNameTag217" class="playerNameTag">spr21</div>
 *         <div id="playerMapWeapon217" class="playerMapWeapon ak47"></div>
 *       </div>
 */

export default MapPlayer
