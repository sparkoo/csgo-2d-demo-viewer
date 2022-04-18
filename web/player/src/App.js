import logo from './logo.svg';
import './App.css';
import {Component} from "react";
import Connect from "./Websocket";

class App extends Component {
  constructor(props) {
    super(props);
    Connect(this.onMessage)
  }

  onMessage(msg) {
    // switch (msg.msgType) {
    //   case 4:
    //     handleInitMessage(msg.init);
    //     break
    //   case 5:
    //     console.log("done loading, playing demo now");
    //     progressDone();
    //     handleInitMessage(msg.init);
    //     initRounds();
    //     play();
    //     break;
    //   case 6:
    //     handleAddRound(msg.round)
    //     // msg.round.Ticks.forEach(addTick);
    //     break;
    //   case 7:
    //     updateLoadProgress(msg);
    //     break;
    //   case 13:
    //     alert(msg.error.message);
    //     break;
    //   default:
    //     addTick(msg);
    // }
  }

  render() {
    return (
        <div className="App">
          <header className="App-header">
            <img src={logo} className="App-logo" alt="logo"/>
            <p>
              Eedit <code>src/App.js</code> and save to reload.
            </p>
            <a
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
            >
              Learn React
            </a>
          </header>
        </div>);
  }
}

export default App;
