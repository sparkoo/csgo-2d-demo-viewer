import { Component } from "react";
import './App.css';
import ErrorBoundary from "./Error";
import MessageBus from "./MessageBus";
import Player from "./Player";
import Connect from "./Websocket";
import Map2d from "./map/Map2d";
import InfoPanel from "./panel/InfoPanel";

class App extends Component {
  constructor(props) {
    super(props);
    this.messageBus = new MessageBus()
    this.player = new Player(this.messageBus)
    this.messageBus.listen([13], function (msg) {
      alert(msg.message)
    })
    Connect(this.messageBus)
  }

  render() {
    return (
        <ErrorBoundary>
          <div className="grid-container">
            <div className="grid-item map">
              <Map2d messageBus={this.messageBus}/>
            </div>
            <div className="grid-item infoPanel">
              <InfoPanel messageBus={this.messageBus}/>
            </div>
          </div>
        </ErrorBoundary>);
  }
}

export default App;
