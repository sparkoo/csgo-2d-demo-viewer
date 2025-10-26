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
      {/* Hero Section with Background Video */}
      <section className="hero-section">
        <div className="hero-video-container">
          <video autoPlay muted loop className="hero-background-video">
            <source src="/highlights.mp4" type="video/mp4" />
          </video>
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
              <h2>Play the demo</h2>
              <div
                id="searchNote"
                className="w3-margin w3-container w3-center loader w3-xlarge"
              ></div>
              <Uploader />
            </div>

            {/* Links Section */}
            <div className="links-section">
              <div className="links-container">
                <h2>Faceit extension</h2>
                <div className="tool-buttons">
                  <a
                    href="https://chrome.google.com/webstore/detail/extension-id"
                    className="tool-btn chrome-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="tool-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                        fill="currentColor"
                      />
                      <circle cx="12" cy="12" r="5" fill="currentColor" />
                    </svg>
                    Chrome Extension
                  </a>

                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/extension-id"
                    className="tool-btn firefox-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="tool-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                        fill="currentColor"
                      />
                    </svg>
                    Firefox Add-on
                  </a>

                  <a
                    href="https://github.com/sparkoo/csgo-2d-demo-viewer"
                    className="tool-btn github-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      className="tool-icon"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path
                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                        fill="currentColor"
                      />
                    </svg>
                    View on GitHub
                  </a>
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
              © {new Date().getFullYear()} CS2D Replay
            </div>
            <div className="footer-links">
              <a
                href="https://github.com/sparkoo/csgo-2d-demo-viewer"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <a
                href="https://chrome.google.com/webstore/detail/extension-id"
                target="_blank"
                rel="noopener noreferrer"
              >
                Chrome
              </a>
              <a
                href="https://addons.mozilla.org/en-US/firefox/addon/extension-id"
                target="_blank"
                rel="noopener noreferrer"
              >
                Firefox
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
