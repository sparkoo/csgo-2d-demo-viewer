import "./KillFeed.css"
import {Component} from "react";

class KillFeed extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const style = {
      width: "100%",
      "font-size": "12px",
      "font-weight": "bold",
      "text-stroke": "2px black",
      "padding-right": "20px",
      "padding-top": "10px",
    }
    const iconStyle = {
      "background-size": "auto 50%",
      "background-repeat": "no-repeat",
      "background-position": "center",
      display: "inline-block",
      margin: "0 10px",
    }
    const rowStyle = {
      "background-color": "var(--DarkColor)",
      "padding": "1px 10px",
      // "border": "2px solid #800000",
      "border-radius": "5px",
      "opacity": "0.75",
      display: "inline-block",
      float: "right",
      clear: "right",
      margin: "2px 0",
    }
    const imgStyle = {
      "margin": "0 2px",
    }

    return <div style={style} className={"w3-right-align"}>
      <div style={rowStyle} className={"bla"}>
        <span className={"CT"}>blabol</span>
        <span style={iconStyle}>
          <img src={"player/assets/icons/csgo/awp.svg"} height={"10px"} style={imgStyle}/>
          <img src={"player/assets/icons/csgo/he.svg"} height={"10px"} style={imgStyle}/>
        </span>
        <span className={"T"}>fafan</span>
      </div>
      <div style={rowStyle} className={"bla"}>
        <span className={"CT"}>blabol</span>
        <span style={iconStyle}><img src={"player/assets/icons/csgo/he.svg"} height={"10px"}/></span>
        <span className={"T"}>fafan</span>
      </div>
      <div style={rowStyle} className={"bla"}>
        <span className={"CT"}>blabol</span>
        <span style={iconStyle}><img src={"player/assets/icons/csgo/awp.svg"} height={"10px"}/></span>
        <span className={"T"}>fafan</span>
      </div>
      <div style={rowStyle} className={"bla"}>
        <span className={"CT"}>blabol</span>
        <span style={iconStyle}><img src={"player/assets/icons/csgo/awp.svg"} height={"10px"}/></span>
        <span className={"T"}>fafan</span>
      </div>
    </div>
  }
}

export default KillFeed
