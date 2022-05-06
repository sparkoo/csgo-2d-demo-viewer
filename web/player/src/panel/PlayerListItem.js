import {Component} from "react";
import "./PlayerListItem.css"

class PlayerListItem extends Component {

  render() {
    // console.log(this.props.player)
    let armor = ""
    if (this.props.player.armor > 0) {
      if (this.props.player.helmet) {
        armor = "vesthelm"
      } else {
        armor = "vest"
      }
    }

    const nades = []
    for (let gi = 0; gi < 4; gi++) {
      if (this.props.player.grenadesList && gi < this.props.player.grenadesList.length) {
        const active = this.props.player.weapon === this.props.player.grenadesList[gi] ? "active" : ""
        nades.push(<div key={gi} className={`w3-col l1 ${this.props.player.grenadesList[gi]} ${active}`}>&nbsp;</div>)
      } else {
        nades.push(<div key={gi} className={"w3-col l1"}>&nbsp;</div>)
      }
    }

    return (
        <div className={"playerListItemContainer w3-row"}>
          <div className={"playerListItem w3-row"}>
            <div className="playerListHp w3-dark-grey">
              <div className={`playerListHpValue ${this.props.player.team}`}
                   style={{width: `${this.props.player.hp}%`}}/>
            </div>
            <div className={`playerListItemName w3-col l9 ${this.props.player.team}`}>{this.props.player.name}</div>
            <div className={`w3-col l1 bckg playerListVest ${this.props.player.team} ${armor}`}>&nbsp;</div>
            <div
                className={`playerListHpText w3-col l2
                ${this.props.player.team}
                ${this.props.player.alive ? "" : "dead"}`}>
              {this.props.player.alive ? this.props.player.hp : ""}&nbsp;
            </div>
          </div>
          <div className="w3-row playerListWeapons">
            <div
                className={`w3-col l1
                ${this.props.player.defuse ? "defuse" : ""}
                ${this.props.player.bomb ? "c4" : ""}
                ${this.props.player.weapon === "c4" ? "active" : ""}`}>&nbsp;</div>
            <div
                className={`w3-col l3
                ${this.props.player.primary}
                ${this.props.player.weapon === this.props.player.primary ? "active" : ""}`}>&nbsp;</div>
            <div
                className={`w3-col l2
                ${this.props.player.secondary}
                ${this.props.player.weapon === this.props.player.secondary ? "active" : ""}`}>&nbsp;</div>
            <div
                className={`w3-col l2
                ${this.props.player.alive ? "knife" : ""}
                ${this.props.player.weapon === "knife" ? "active" : ""}`}>&nbsp;</div>
            {nades}
          </div>
          <div className="w3-row">
            <div className="w3-col l1">&nbsp;</div>
            <div className="w3-col l3 playerListPrimaryAmmo w3-small">
              {this.props.player.primary ?
                  `${this.props.player.primaryammomagazine}/${this.props.player.primaryammoreserve}`
                  : ""}
              &nbsp;
            </div>
            <div className="w3-col l2 playerListSecondaryAmmo w3-small">
              {this.props.player.secondary ?
                  `${this.props.player.secondaryammomagazine}/${this.props.player.secondaryammoreserve}`
                  : ""}
              &nbsp;
            </div>
            <div className="w3-col l6 playerListMoney w3-right-align playerListItemName">{this.props.player.money}$
            </div>
          </div>
        </div>
    )
  }
}

export default PlayerListItem
