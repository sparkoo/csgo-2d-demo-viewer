import { useState, useEffect } from "react";
import "./Home.css";
import Uploader from "./Uploader/Uploader";

export function Home() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVideoLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="App">
      {/* Hero Section with Background Image */}
      <section className="hero-section">
        <div className="hero-image-container">
          <img
            src="/header.png"
            alt="Header background"
            className="hero-background-image"
          />
          <div className="hero-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="w3-container">
            <h1>Counter-Strike 2D Replay</h1>
            <p>Analyze CS matches in 2D</p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="main-content">
        <div className="w3-container">
          <div className="content-wrapper">
            {/* Upload Section */}
            <div className="upload-section">
              <h2>Play The Demo</h2>
              <Uploader />
            </div>

            {/* Bottom Sections */}
            <div className="bottom-sections">
              {/* Faceit Extension Section */}
              <div className="links-section">
                <div className="links-container">
                  <h2>
                    <img
                      src="/faceit_icon.svg"
                      alt="Faceit Icon"
                      className="faceit-icon"
                      width="24"
                      height="24"
                    />
                    <span>Faceit Extension</span>
                  </h2>
                  <div className="tool-buttons">
                    <a
                      href="https://chromewebstore.google.com/detail/faceit-2d-replay/kagfmemgilamfeoljmajifkbhfglebdb"
                      className="tool-btn chrome-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/extension_chrome_badge.png"
                        alt="Chrome Extension Badge"
                        className="tool-badge"
                      />
                    </a>

                    <a
                      href="https://addons.mozilla.org/en-US/firefox/addon/faceit-2d-replay/"
                      className="tool-btn firefox-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/extension_firefox_badge.png"
                        alt="Firefox Add-on Badge"
                        className="tool-badge"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* Open-Source Section */}
              <div className="open-source-section">
                <div className="links-container">
                  <h2>
                    <span>Open-Source</span>
                  </h2>
                  <div className="tool-buttons">
                    <a
                      href="https://github.com/sparkoo/csgo-2d-demo-viewer"
                      className="tool-btn github-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src="/github_icon.svg"
                        alt="GitHub Icon"
                        className="github-icon"
                        width="24"
                        height="24"
                      />
                      GitHub Repository
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="w3-container">
          <div className="footer-content">
            <div className="footer-copyright">
              <a
                href="https://sparko.cz"
                target="_blank"
                rel="noopener noreferrer"
              >
                © {new Date().getFullYear()} sparko
              </a>
            </div>
            <div className="footer-links">
              <a
                href="https://github.com/sparkoo/csgo-2d-demo-viewer"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/github_icon.svg"
                  alt="GitHub Icon"
                  className="github-icon"
                  width="20"
                  height="20"
                />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
