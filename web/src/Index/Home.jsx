import { useState } from "react";
import "./Home.css";
import DemoLinkInput from "./DemoLinkInput/DemoLinkInput";
import Uploader from "./Uploader/Uploader";

export function Home() {
  return (
    <div className="App">
      <div className="w3-container">
        <div className="w3-row">
          <div className="w3-col l2">
            <br />
          </div>
          <div className="w3-col l8">
            <div className="w3-container w3-xlarge w3-light-grey">
              <div className="w3-row">
                <div className="w3-col l4 w3-left-align">
                  <a href="/">
                    <h1>2d.sparko.cz</h1>
                  </a>
                </div>
                <div className="w3-col l4">&nbsp;</div>
                <div className="w3-col l4 w3-right-align"></div>
              </div>
            </div>
            <div
              id="searchNote"
              className="w3-margin w3-container w3-center loader w3-xlarge"
            ></div>
            <DemoLinkInput />
            <Uploader />
            <hr />
          </div>
          <div className="w3-col l2">
            <br />
          </div>
        </div>
      </div>
    </div>
  );
}
