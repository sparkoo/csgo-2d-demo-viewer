import "./KillFeed.css";
import "../protos/Message_pb";
import { Component } from "react";
import { MSG_PLAY_CHANGE } from "../constants";

const weaponIconUrls = import.meta.glob("../assets/icons/csgo/*.{svg,png}", {
  eager: true,
  import: "default",
  query: "?url",
});

function weaponIconUrl(weapon) {
  return (
    weaponIconUrls[`../assets/icons/csgo/${weapon}.svg`] ||
    weaponIconUrls[`../assets/icons/csgo/${weapon}.png`] ||
    weaponIconUrls["../assets/icons/csgo/not_found.svg"]
  );
}

class KillFeed extends Component {
  constructor(props) {
    super(props);
    props.messageBus.listen([11], this.fragMessage.bind(this));
    props.messageBus.listen(
      [MSG_PLAY_CHANGE],
      function () {
        this.setState({
          frags: [],
        });
      }.bind(this)
    );
    this.state = {
      frags: [],
    };
  }

  fragMessage(msg) {
    this.setState({
      frags: [...this.state.frags, msg.frag],
    });
  }

  removeFrag(index) {
    const newState = this.state.frags;
    newState[index] = null;
    this.setState({
      frags: newState,
    });
  }

  render() {
    const fragComps = this.state.frags.map((f, i) => {
      if (f === null) {
        return null;
      }
      return (
        <Kill
          key={i}
          frag={f}
          removeCallback={this.removeFrag.bind(this)}
          index={i}
        />
      );
    });

    return <div className={"w3-right-align killfeed"}>{fragComps}</div>;
  }
}

export default KillFeed;

class Kill extends Component {
  componentDidMount() {
    setTimeout(
      function () {
        this.props.removeCallback(this.props.index);
      }.bind(this),
      3000
    );
  }

  render() {
    if (this.props.frag === undefined) {
      return null;
    }
    const killer = this.props.frag.killername ? (
      <span className={this.props.frag.killerteam}>
        {this.props.frag.killername}
      </span>
    ) : (
      ""
    );
    const victim = this.props.frag.victimname ? (
      <span className={this.props.frag.victimteam}>
        {this.props.frag.victimname}
      </span>
    ) : (
      ""
    );
    const headshot = this.props.frag.isheadshot ? (
      <img
        className="killfeedIcon headshot"
        src={weaponIconUrl("headshot")}
        alt=""
      />
    ) : (
      ""
    );
    return (
      <div className={"killfeedRow"}>
        {killer}
        <img
          className="killfeedIcon"
          data-weapon={this.props.frag.weapon}
          src={weaponIconUrl(this.props.frag.weapon)}
          alt=""
        />
        {headshot}
        {victim}
      </div>
    );
  }
}
