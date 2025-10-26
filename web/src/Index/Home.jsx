import { useState, useEffect } from "react";
import "./Home.css";
import Uploader from "./Uploader/Uploader";

const videos = Array.from(
  { length: 12 },
  (_, i) => `highlights_${String(i + 1).padStart(2, "0")}.mp4`
);

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Home() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shuffledVideos, setShuffledVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setShuffledVideos(shuffleArray(videos));

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
          <video
            autoPlay
            muted
            loop
            className="hero-background-video"
            key={shuffledVideos[currentIndex]}
            onEnded={() =>
              setCurrentIndex((prev) => (prev + 1) % shuffledVideos.length)
            }
          >
            <source
              src={`homeheader_video/${shuffledVideos[currentIndex]}`}
              type="video/mp4"
            />
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
                    Faceit extension
                  </h2>
                  <div className="tool-buttons">
                    <a
                      href="https://chrome.google.com/webstore/detail/extension-id"
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
                      href="https://addons.mozilla.org/en-US/firefox/addon/extension-id"
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
                  <h2>Open-Source</h2>
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
                      GitHub
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
                  width="24"
                  height="24"
                />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
