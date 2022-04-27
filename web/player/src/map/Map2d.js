import './Map.css';
import {Component} from "react";
import MapPlayer from "./MapPlayer";
import MapShot from "./MapShot";
import {MSG_PLAY_CHANGE} from "../constants";
import MapNade from "./MapNade";

class Map2d extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapName: "de_dust2",
      players: [],
      shots: [],
      nades: [],
      nadeExplosions: [],
    }

    props.messageBus.listen([4, 13], this.onMessage.bind(this))
    props.messageBus.listen([1], this.tickUpdate.bind(this))
    props.messageBus.listen([9], this.handleShot.bind(this))
    props.messageBus.listen([MSG_PLAY_CHANGE], function () {
      this.setState({
        shots: [],
        nadeExplosions: [],
      })
    }.bind(this))
    props.messageBus.listen([14], this.handleNadeExplosion.bind(this))
  }

  tickUpdate(message) {
    if (message.tickState.Players) {
      this.setState({
        players: message.tickState.Players,
        nades: message.tickState.Nades
      })
    }
  }

  handleShot(msg) {
    this.setState({
      shots: [...this.state.shots, msg.shot]
    })
  }

  handleNadeExplosion(msg) {
    this.setState({
      nadeExplosions: [...this.state.nadeExplosions, msg.grenadeEvent]
    })
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

  removeNade(index) {
    const newState = this.state.nadeExplosions
    newState[index] = null
    this.setState({
      nadeExplosions: newState,
    })
  }

  removeShot(index) {
    const newState = this.state.shots
    newState[index] = null
    this.setState({
      shots: newState,
    })
  }

  render() {
    const style = {
      backgroundImage: `url("https://raw.githubusercontent.com/zoidbergwill/csgo-overviews/master/overviews/${this.state.mapName}.jpg")`,
    }
    const playerComponents = []
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach(p => {
        playerComponents.push(<MapPlayer
            key={p.PlayerId}
            player={p}/>)
      })
    }
    const shots = this.state.shots.map((s, i) => {
      if (s === null) {
        return null
      }
      return <MapShot key={i} shot={s} removeCallback={this.removeShot.bind(this)} index={i}/>
    })
    const nadeComponents = []
    if (this.state.nades && this.state.nades.length > 0) {
      this.state.nades.forEach(n => {
        nadeComponents.push(<MapNade key={n.id} nade={n}/>)
      })
    }
    const nadeExplosions = this.state.nadeExplosions.map((n, i) => {
      if (n === null) {
        return null
      }
      return <MapNade key={n.id} nade={n} hide={true} removeCallback={this.removeNade.bind(this)} index={i}/>
    })
    return (
        <div className="map-container" id="map" style={style}>
          {playerComponents}
          {nadeComponents}
          {shots}
          {nadeExplosions}
        </div>
    )
  }
}

export default Map2d
