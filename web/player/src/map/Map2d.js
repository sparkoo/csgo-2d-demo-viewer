import './Map.css';
import {Component} from "react";
import MapPlayer from "./MapPlayer";

class Map2d extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapName: "de_dust2",
      players: {},
      playerComps: new Map(),
    }
    this.playerComponents = new Map()

    props.messageBus.listen([4, 13], this.onMessage.bind(this))
    props.messageBus.listen([1], this.tickUpdate.bind(this))
  }

  tickUpdate(message) {
    // TODO: update list of player child components by passing state as child props, then try to just set state here
    if (message.tickState.Players) {
      this.setState({players: message.tickState.Players})
    }
  }

  updatePlayer(players) {

  }

  onMessage(message) {
    switch (message.msgType) {
      case 4:
        console.log(message.init.mapName)
        this.setMapName(message.init.mapName)
        break;
    }
  }

  setMapName(name) {
    this.setState({
          mapName: name,
        }
    )
  }

  render() {
    const style = {
      backgroundImage: `url("https://raw.githubusercontent.com/zoidbergwill/csgo-overviews/master/overviews/${this.state.mapName}.jpg")`,
    }
    const c = []
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        c.push(<MapPlayer
            key={p.PlayerId}
            player={p}/>)
      })
    }
    return (
        <div className="map-container" id="map" style={style}>
          {c}
        </div>
    )
  }
}

export default Map2d
