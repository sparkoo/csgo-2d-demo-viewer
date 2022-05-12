import './App.css';
import {Component} from "react";
import Connect from "./Websocket";
import Map2d from "./map/Map2d";
import MessageBus from "./MessageBus";
import InfoPanel from "./panel/InfoPanel";
import Player from "./Player";

class App extends Component {
  constructor(props) {
    super(props);
    this.messageBus = new MessageBus()
    this.player = new Player(this.messageBus)
    this.messageBus.listen([13], function (msg) {
      alert(msg.error.message)
    })
    Connect(this.messageBus)
  }

  render() {
    return (
        <div className="grid-container">
          <div className="grid-item map">
            <Map2d messageBus={this.messageBus}/>
          </div>
          <div className="grid-item infoPanel">
            <InfoPanel messageBus={this.messageBus}/>
          </div>
        </div>);
  }
}

export default App;
