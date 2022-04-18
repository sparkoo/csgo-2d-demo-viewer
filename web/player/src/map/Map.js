import './Map.css';
import {Component} from "react";

class Map extends Component {
  constructor(props) {
    super(props);
    // this.setMapName("blabol")
    this.state = {
      mapName: "de_dust2",
    }
    props.messageBus.listen([4, 13], this.onMessage.bind(this))
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
    return (
        <div className="map-container" id="map" style={style}>
        </div>
    )
  }
}

export default Map
