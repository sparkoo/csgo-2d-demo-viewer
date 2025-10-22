// CS2 Demo Viewer - FACEIT Integration Content Script
import browser from "webextension-polyfill";

console.log("🚀 CS2 Demo Viewer extension loaded!");
console.log("📍 Current URL:", window.location.href);
console.log("📄 Document ready state:", document.readyState);
console.log("🌐 User agent:", navigator.userAgent);

class FACEITDemoViewer {
  constructor() {
    this.demoViewerUrl = "https://2d.sparko.cz"; // Default fallback
    this.buttonClass = "cs2-demo-viewer-btn";
    this.debugMode = true;
    this.injectionTimeout = null;
    this.historyCheckTimeout = null;
    this.init();
  }

  log(...args) {
    if (this.debugMode) {
      console.log("🔧 [CS2 Extension]", ...args);
    }
  }

  async init() {
    this.log("Initializing extension...");

    // Load demoViewerUrl from browser.storage
    try {
      const result = await browser.storage.sync.get({
        demoViewerUrl: this.demoViewerUrl, // Use default if not set
      });
      this.demoViewerUrl = result.demoViewerUrl || this.demoViewerUrl;
      this.log("Loaded demoViewerUrl:", this.demoViewerUrl);
    } catch (error) {
      this.log(
        "Error loading demoViewerUrl from storage, using default:",
        error
      );
    }

    // Wait for page to be fully loaded
    if (document.readyState === "loading") {
      this.log("Document still loading, waiting for DOMContentLoaded...");
      document.addEventListener("DOMContentLoaded", () => this.start());
    } else {
      this.log("Document already loaded, starting immediately...");
      this.start();
    }
  }

  start() {
    this.log("🎯 Starting FACEIT integration...");
    this.log("Current page URL:", window.location.href);
    this.log("Page title:", document.title);

    // Check if we're actually on FACEIT
    const hostname = window.location.hostname;
    if (!/^(.+\.)?faceit\.com$/.test(hostname)) {
      this.log("❌ Not on FACEIT domain, exiting...");
      return;
    }

    this.log("✅ Confirmed on FACEIT domain");

    this.observePageChanges();
    this.injectButtons();
    this.checkScrollableMatchHistory();
  }

  isMatchRoomPage() {
    // Check if current URL is a match room page
    const url = window.location.href;
    const matchRoomPattern = /\/cs2\/room\/[^\/]+$/;
    return matchRoomPattern.test(url);
  }

  observePageChanges() {
    // FACEIT uses SPA navigation, so we need to observe DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;

      // Always check for scrollable-match-history on DOM changes (separate from button injection)
      clearTimeout(this.historyCheckTimeout);
      this.historyCheckTimeout = setTimeout(() => {
        this.checkScrollableMatchHistory();
      }, 500);

      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          // Check if significant content was added
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Look for info div elements
              if (
                node.querySelector &&
                (node.querySelector('div[name="info"]') ||
                  (node.tagName === "DIV" &&
                    node.getAttribute("name") === "info"))
              ) {
                shouldReinject = true;
                break;
              }
            }
          }
        }
      });

      if (shouldReinject) {
        // Debounce the injection to avoid too many calls
        clearTimeout(this.injectionTimeout);
        this.injectionTimeout = setTimeout(() => {
          this.log("Page content changed, re-injecting buttons...");
          this.injectButtons();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for URL changes (for SPA navigation)
    let currentUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.log("URL changed to:", currentUrl);

        // Wait a bit for the new page to load
        setTimeout(() => {
          this.injectButtons();
        }, 1500);

        // Separate timeout for history check
        setTimeout(() => {
          this.checkScrollableMatchHistory();
        }, 500);
      }
    });

    urlObserver.observe(document.querySelector("title"), {
      childList: true,
      subtree: true,
    });
  }

  injectButtons() {
    this.log("🔍 Starting button injection...");

    // Remove existing buttons to avoid duplicates
    const existingButtons = document.querySelectorAll(`.${this.buttonClass}`);
    this.log(`Found ${existingButtons.length} existing buttons to remove`);
    existingButtons.forEach((btn) => btn.remove());

    // Check if we're on a match room page first
    if (this.isMatchRoomPage()) {
      this.log(
        "🎯 Detected match room page, injecting button into div[name='info']"
      );
      const buttonAdded = this.injectIntoInfoDiv();
      if (buttonAdded) {
        this.log("✅ Successfully added button to div[name='info']");
      } else {
        this.log("⚠️ Could not find div[name='info'] element");
      }
    } else {
      this.log("⚠️ Not a match room page, skipping injection");
    }
  }

  injectIntoInfoDiv() {
    this.log("🔍 Looking for div[name='info'] element...");

    // Look for div with name="info"
    const infoDiv = document.querySelector('div[name="info"]');

    if (!infoDiv) {
      this.log("❌ Could not find div[name='info'] element");
      return false;
    }

    this.log("✅ Found div[name='info'] element:", infoDiv);

    // Find the "Watch demo" button
    const watchDemoButton = Array.from(infoDiv.querySelectorAll("button")).find(
      (btn) => btn.textContent.trim().toLowerCase().includes("watch demo")
    );

    if (!watchDemoButton) {
      this.log("❌ Could not find 'Watch demo' button");
      return false;
    }

    this.log("✅ Found 'Watch demo' button:", watchDemoButton);

    // Create our button
    const button = this.createReplayButton("match-room-info");

    // Insert the button right after the "Watch demo" button
    watchDemoButton.insertAdjacentElement("afterend", button);

    this.log("✅ Successfully inserted button after 'Watch demo' button");
    return true;
  }

  checkScrollableMatchHistory() {
    const div = document.getElementById("scrollable-match-history");
    if (div) {
      this.log("✅ Found scrollable-match-history div");

      // Get the second div inside
      const childDivs = div.querySelectorAll("div");
      if (childDivs.length >= 2) {
        const secondDiv = childDivs[1];
        const anchors = secondDiv.querySelectorAll("a");

        anchors.forEach((anchor) => {
          const innerDiv = anchor.querySelector("div");
          if (innerDiv && !innerDiv.querySelector("button[name='replay2d']")) {
            const button = document.createElement("button");
            button.className = "history-match-btn";
            button.title = "Open CS2 Demo Viewer";
            button.style.marginLeft = "5px"; // Simple styling
            button.textContent = "2D"; // Not empty, but minimal
            button.name = "replay2d";

            // Add click handler similar to other buttons
            button.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();
              // Extract match ID from anchor href or something
              const href = anchor.href || "";
              const matchId = href.split("/").pop();
              if (matchId) {
                await this.handleReplayClick(matchId, button);
              }
            });

            innerDiv.appendChild(button);
            this.log("Inserted button into inner div of anchor:", anchor);
          }
        });
      } else {
        this.log("⚠️ Second div not found in scrollable-match-history");
      }
    } else {
      this.log("❌ scrollable-match-history div not found");
    }
  }

  createReplayButton(matchId) {
    const button = document.createElement("button");
    button.className = `${this.buttonClass}`;
    button.textContent = "2d replay";
    button.title = "Open CS2 Demo Viewer";
    button.dataset.matchId = matchId;

    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleReplayClick(matchId, button);
    });

    return button;
  }

  async handleReplayClick(matchId, button) {
    this.log("handle click on match", matchId);

    const originalContent = button.innerHTML;

    // Show loading state
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
      Opening...
    `;
    button.disabled = true;
    try {
      // Extract match ID from URL if it's a match room button
      let actualMatchId = matchId;
      if (matchId === "match-room-info") {
        const url = window.location.href;
        actualMatchId = url.split("/").pop();
      }

      // First, fetch match details
      fetch(`https://www.faceit.com/api/match/v2/match/${actualMatchId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((matchData) => {
          this.log("Match data:", matchData);
          this.log("Demo download link", matchData.payload.demoURLs[0]);

          // Construct demo URL (assuming pattern from example)
          const demoUrl = matchData.payload.demoURLs[0];

          // Then, make HTTP request to download demo URL
          return fetch(
            "https://www.faceit.com/api/download/v2/demos/download-url",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                resource_url: demoUrl,
              }),
            }
          );
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((downloadData) => {
          this.log("Demo download URL response:", downloadData);
          const downloadUrl = downloadData.payload.download_url;
          this.log("Demo final download link", downloadUrl);

          // Open the player with the demo URL
          const playerUrl = `${
            this.demoViewerUrl
          }/player?demourl=${encodeURIComponent(downloadUrl)}`;
          window.open(playerUrl, "_blank");

          // Reset button to original state
          button.innerHTML = originalContent;
          button.disabled = false;
        })
        .catch((error) => {
          console.error("Error in API calls:", error);

          // Show error feedback
          button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            Error
          `;

          // Reset button after 2 seconds
          setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
          }, 2000);
        });
    } catch (error) {
      console.error("Error opening demo viewer:", error);

      // Show error feedback
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
        Error
      `;

      // Reset button after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }, 2000);
    }
  }
}

// Initialize the extension
new FACEITDemoViewer();
