import {Component} from "react";
import "./PlayerListItem.css"

class PlayerListItem extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    // console.log(this.props.player)
    let armor = ""
    if (this.props.player.Armor > 0) {
      if (this.props.player.Helmet) {
        armor = "vesthelm"
      } else {
        armor = "vest"
      }
    }

    const nades = []
    for (let gi = 0; gi < 4; gi++) {
      if (this.props.player.Grenades && gi < this.props.player.Grenades.length) {
        const active = this.props.player.Weapon === this.props.player.Grenades[gi] ? "active" : ""
        nades.push(<div key={gi} className={`w3-col l1 ${this.props.player.Grenades[gi]} ${active}`}>&nbsp;</div>)
      } else {
        nades.push(<div key={gi} className={"w3-col l1"}>&nbsp;</div>)
      }
    }

    return (
        <div className={"playerListItemContainer w3-row"}>
          <div className={"playerListItem w3-row"}>
            <div className="playerListHp w3-dark-grey">
              <div className={`playerListHpValue ${this.props.player.Team}`}
                   style={{width: `${this.props.player.Hp}%`}}/>
            </div>
            <div className={`playerListItemName w3-col l9 ${this.props.player.Team}`}>{this.props.player.Name}</div>
            <div className={`w3-col l1 bckg playerListVest ${this.props.player.Team} ${armor}`}>&nbsp;</div>
            <div className={`playerListHpText w3-col l2 ${this.props.player.Team} ${this.props.player.Alive ? "" : "dead"}`}>
              {this.props.player.Alive ? this.props.player.Hp : ""}&nbsp;
            </div>
          </div>
          <div className="w3-row playerListWeapons">
            <div className={`w3-col l1 ${this.props.player.Defuse ? "defuse" : ""}`}>&nbsp;</div>
            <div className={`w3-col l3 ${this.props.player.Primary}`}>&nbsp;</div>
            <div className={`w3-col l2 ${this.props.player.Secondary}`}>&nbsp;</div>
            <div className={`w3-col l2 ${this.props.player.Alive ? "knife" : ""}`}>&nbsp;</div>
            {nades}
          </div>
          <div className="w3-row">
            <div className="w3-col l1">&nbsp;</div>
            <div className="w3-col l3 playerListPrimaryAmmo w3-small">
              {this.props.player.Primary ?
                `${this.props.player.PrimaryAmmoMagazine}/${this.props.player.PrimaryAmmoReserve}`
                : ""}
              &nbsp;
            </div>
            <div className="w3-col l2 playerListSecondaryAmmo w3-small">
              {this.props.player.Secondary ?
                  `${this.props.player.SecondaryAmmoMagazine}/${this.props.player.SecondaryAmmoReserve}`
                  : ""}
              &nbsp;
            </div>
            <div className="w3-col l6 playerListMoney w3-right-align playerListItemName">{this.props.player.Money}$</div>
          </div>
        </div>
    )
  }
}

/**
 * <div id="playerListItem217" class="playerListItemContainer w3-row deletable">
 *               <div class="playerListItem w3-row">
 *                 <div class="playerListHp w3-dark-grey">
 *                   <div id="playerListHpValue217" class="playerListHpValue T" style="width: 92%;"></div>
 *                 </div>
 *                 <div id="playerListItemName217" class="playerListItemName w3-col l9 T">spr21</div>
 *                 <div id="playerListItemVesthelm217" class="w3-col l1 bckg playerListVest T vesthelm">&nbsp;</div>
 *                 <div id="playerListHpText217" class="playerListHpText w3-col l2 T">92</div>
 *               </div>
 *               <div class="w3-row playerListWeapons">
 *                 <div id="playerListBombDef217" class="w3-col l1">&nbsp;</div>
 *                 <div id="playerListPrimary217" class="w3-col l3
 *       ak47 active">&nbsp;
 *                 </div>
 *                 <div id="playerListSecondary217" class="w3-col l2
 *       glock ">&nbsp;
 *                 </div>
 *                 <div id="playerListKnife217" class="w3-col l2 knife ">&nbsp;</div>
 *                 <div id="playerListG1217" class="w3-col l1">&nbsp;</div>
 *                 <div id="playerListG2217" class="w3-col l1">&nbsp;</div>
 *                 <div id="playerListG3217" class="w3-col l1">&nbsp;</div>
 *                 <div id="playerListG4217" class="w3-col l1">&nbsp;</div>
 *               </div>
 *             </div>
 */

export default PlayerListItem
