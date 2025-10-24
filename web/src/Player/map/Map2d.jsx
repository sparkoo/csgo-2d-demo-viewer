import { Component } from "react";
import React from "react";
import { MSG_PLAY_CHANGE } from "../constants";
import KillFeed from "./KillFeed";
import "./Map.css";
import MapBomb from "./MapBomb";
import MapNade from "./MapNade";
import MapPlayer from "./MapPlayer";
import MapShot from "./MapShot";

class Map2d extends Component {
  constructor(props) {
    super(props);
    this.state = {
      mapName: "empty",
      layer: "",
      hasLower: false,
      players: [],
      shots: [],
      nades: [],
      nadeExplosions: [],
      bomb: { x: -100, y: -100 },
      zoom: 1,
      panX: 0,
      panY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
    };

    props.messageBus.listen([4], this.onMessage.bind(this));
    props.messageBus.listen([1], this.tickUpdate.bind(this));
    props.messageBus.listen([9], this.handleShot.bind(this));
    props.messageBus.listen(
      [MSG_PLAY_CHANGE],
      function () {
        this.setState({
          shots: [],
          nadeExplosions: [],
        });
      }.bind(this)
    );
    props.messageBus.listen([14], this.handleNadeExplosion.bind(this));

    document.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  tickUpdate(message) {
    if (message.tickstate.playersList) {
      this.setState({
        players: message.tickstate.playersList,
        nades: message.tickstate.nadesList,
        bomb: message.tickstate.bomb,
      });
    }
  }

  handleShot(msg) {
    this.setState({
      shots: [...this.state.shots, msg.shot],
    });
  }

  handleNadeExplosion(msg) {
    this.setState({
      nadeExplosions: [...this.state.nadeExplosions, msg.grenadeevent],
    });
  }

  onMessage(message) {
    switch (message.msgtype) {
      case 4:
        console.log(message.init.mapname);
        this.setMapName(message.init.mapname);
        break;
      default:
        console.log("unknown message [Map2d.js]", message);
    }
  }

  setMapName(name) {
    const hasLower =
      name === "de_nuke" || name === "de_train" || name === "de_vertigo";
    this.setState({
      mapName: name,
      layer: "",
      hasLower: hasLower,
    });
  }

  removeNade(index) {
    const newState = this.state.nadeExplosions;
    newState[index] = null;
    this.setState({
      nadeExplosions: newState,
    });
  }

  removeShot(index) {
    const newState = this.state.shots;
    newState[index] = null;
    this.setState({
      shots: newState,
    });
  }

  toggleLayer() {
    if (this.state.hasLower) {
      this.setState({
        layer: this.state.layer === "_lower" ? "" : "_lower",
      });
    }
  }

  handleKeyDown(event) {
    if (event.key === "q" || event.key === "Q") {
      this.toggleLayer();
    }
  }

  handleMouseDown = (e) => {
    if (this.state.zoom > 1) {
      this.setState({
        isDragging: true,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY,
      });
    }
  };

  handleMouseMove = (e) => {
    if (this.state.isDragging) {
      const deltaX = e.clientX - this.state.lastMouseX;
      const deltaY = e.clientY - this.state.lastMouseY;
      this.setState({
        panX: this.state.panX + deltaX,
        panY: this.state.panY + deltaY,
        lastMouseX: e.clientX,
        lastMouseY: e.clientY,
      });
    }
  };

  handleMouseUp = () => {
    this.setState({ isDragging: false });
  };

  handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.setState({
      zoom: Math.min(Math.max(this.state.zoom * zoomFactor, 1), 2.5),
    });
  };

  render() {
    const style = {
      backgroundImage: `url("/overviews/${this.state.mapName}${this.state.layer}.png")`,
      transform: `scale(${this.state.zoom}) translate(${this.state.panX}px, ${this.state.panY}px)`,
      transformOrigin: "center",
      cursor:
        this.state.zoom > 1
          ? this.state.isDragging
            ? "grabbing"
            : "grab"
          : "default",
    };
    const playerComponents = [];
    if (this.state.players && this.state.players.length > 0) {
      this.state.players.forEach((p) => {
        playerComponents.push(<MapPlayer key={p.playerid} player={p} />);
      });
    }
    const shots = this.state.shots.map((s, i) => {
      if (s === null) {
        return null;
      }
      return (
        <MapShot
          key={i}
          shot={s}
          removeCallback={this.removeShot.bind(this)}
          index={i}
        />
      );
    });
    const nadeComponents = [];
    if (this.state.nades && this.state.nades.length > 0) {
      this.state.nades.forEach((n) => {
        nadeComponents.push(<MapNade key={n.id} nade={n} />);
      });
    }
    const nadeExplosions = this.state.nadeExplosions.map((n, i) => {
      if (n != null && n.id) {
        return (
          <MapNade
            key={n.id}
            nade={n}
            hide={true}
            removeCallback={this.removeNade.bind(this)}
            index={i}
          />
        );
      }
      return null;
    });
    return (
      <div
        className="map-container"
        id="map"
        style={style}
        onMouseDown={this.handleMouseDown}
        onMouseMove={this.handleMouseMove}
        onMouseUp={this.handleMouseUp}
        onMouseLeave={this.handleMouseUp}
        onWheel={this.handleWheel}
      >
        <KillFeed messageBus={this.props.messageBus} />
        {this.state.hasLower && (
          <button
            className={`layer-toggle ${
              this.state.layer === "_lower" ? "lower-active" : ""
            }`}
            onClick={this.toggleLayer.bind(this)}
          >
            <div className="layer-icon">⇅</div>
            <div className="layer-hint">Q</div>
          </button>
        )}
        {playerComponents}
        {nadeComponents}
        {shots}
        {nadeExplosions}
        <MapBomb bomb={this.state.bomb} />
      </div>
    );
  }
}

export default Map2d;
