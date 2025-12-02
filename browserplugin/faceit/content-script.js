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

  // Extract CSRF token from page if it exists
  getCSRFToken() {
    // Try to find CSRF token in meta tags
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    if (csrfMeta) {
      return csrfMeta.getAttribute("content");
    }

    // Try to find it in cookies
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "csrf_token" || name === "XSRF-TOKEN") {
        return decodeURIComponent(value);
      }
    }

    return null;
  }

  // Get common headers for FACEIT API requests
  getFaceitApiHeaders(includeContentType = false) {
    const headers = {
      "Accept": "application/json",
      "Referer": window.location.href,
      "Origin": window.location.origin,
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    // Add CSRF token if available
    const csrfToken = this.getCSRFToken();
    if (csrfToken) {
      headers["X-CSRF-Token"] = csrfToken;
    }

    return headers;
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
    this.checkStatsPageMatches();
  }

  isMatchRoomPage() {
    // Check if current URL is a match room page
    const url = window.location.href;
    const matchRoomPattern = /\/cs2\/room\/[^\/]+$/;
    return matchRoomPattern.test(url);
  }

  isStatsPage() {
    // Check if current URL is a player stats page
    const url = window.location.href;
    const statsPattern = /\/players\/[^\/]+\/stats\/cs2/;
    return statsPattern.test(url);
  }

  observePageChanges() {
    // FACEIT uses SPA navigation, so we need to observe DOM changes
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;

      // Always check for scrollable-match-history on DOM changes (separate from button injection)
      clearTimeout(this.historyCheckTimeout);
      this.historyCheckTimeout = setTimeout(() => {
        this.checkScrollableMatchHistory();
        this.checkStatsPageMatches();
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
          this.checkStatsPageMatches();
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
                // Pass match room URL for 403 error handling
                const matchRoomUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;
                await this.handleReplayClick(matchId, button, matchRoomUrl);
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

  checkStatsPageMatches() {
    if (!this.isStatsPage()) {
      this.log("❌ Not on stats page, skipping stats page match check");
      return;
    }

    this.log("🔍 Checking stats page for matches...");

    // Find all links that point to match room pages
    const matchLinks = Array.from(document.querySelectorAll("a")).filter(
      (a) => {
        const href = a.getAttribute("href") || "";
        // Match URLs ending with cs2/room/{matchId} pattern
        return /\/cs2\/room\/[^\/]+\/scoreboard$/.test(href);
      }
    );

    this.log(`✅ Found ${matchLinks.length} match links on stats page`);

    matchLinks.forEach((anchor) => {
      // Check if button already exists
      if (anchor.querySelector("button[name='replay2d']")) {
        return;
      }

      // Try to find a suitable place to insert the button
      // Add a new td before the last td, or fall back to first div or anchor
      const lastTd = anchor.querySelector("td:last-child");
      let targetElement;

      if (lastTd) {
        // Create a new td and insert it before the last td
        const newTd = document.createElement("td");
        newTd.className = lastTd.className; // Copy the class from the last td
        newTd.style.textAlign = "center";
        lastTd.parentNode.insertBefore(newTd, lastTd);
        targetElement = newTd;
      } else {
        targetElement = anchor.querySelector("div");

        if (!targetElement) {
          targetElement = anchor;
        }
      }

      const button = document.createElement("button");
      button.className = "history-match-btn stats-match-btn";
      button.title = "Open CS2 Demo Viewer";
      button.textContent = "2D";
      button.name = "replay2d";

      // Add click handler
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = anchor.getAttribute("href") || "";
        const links = href.split("/");
        links.pop();
        const matchId = links.pop();
        if (matchId) {
          // Pass match room URL for 403 error handling
          const matchRoomUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;
          await this.handleReplayClick(matchId, button, matchRoomUrl);
        }
      });

      targetElement.appendChild(button);
      this.log("Inserted 2D button into stats page match link:", anchor);
    });
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
      // No match room URL passed - we're already on the match room page
      await this.handleReplayClick(matchId, button, null);
    });

    return button;
  }

  async handleReplayClick(matchId, button, matchRoomUrl = null) {
    this.log("handle click on match", matchId);

    const originalContent = button.innerHTML;

    // Show loading state
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
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
      this.log(`Fetching match details for match ID: ${actualMatchId}`);
      fetch(`https://www.faceit.com/api/match/v2/match/${actualMatchId}`, {
        credentials: "include", // Explicitly include cookies
        headers: this.getFaceitApiHeaders(),
      })
        .then((response) => {
          if (!response.ok) {
            // Create error object with status code
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            throw error;
          }
          return response.json();
        })
        .then((matchData) => {
          this.log("Match data:", matchData);
          this.log("Demo download link", matchData.payload.demoURLs[0]);

          // Construct demo URL (assuming pattern from example)
          const demoUrl = matchData.payload.demoURLs[0];

          // Then, make HTTP request to download demo URL
          this.log(`Requesting download URL for demo: ${demoUrl}`);
          return fetch(
            "https://www.faceit.com/api/download/v2/demos/download-url",
            {
              method: "POST",
              credentials: "include", // Explicitly include cookies
              headers: this.getFaceitApiHeaders(true), // Include Content-Type
              body: JSON.stringify({
                resource_url: demoUrl,
              }),
            }
          );
        })
        .then((response) => {
          if (!response.ok) {
            // Create error object with status code
            const error = new Error(`HTTP error! status: ${response.status}`);
            error.status = response.status;
            throw error;
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

          // Create a nice popup for the suggestion message
          const popup = document.createElement("div");
          popup.id = "faceit-extension-popup";
          popup.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            font-size: 14px;
          `;
          popup.innerHTML = `
            <strong>CS2 Demo Viewer Extension</strong><br>
            <span id="popup-message"></span>
            <br>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; background: none; border: 1px solid white; color: white; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Close</button>
          `;
          document.body.appendChild(popup);

          // Auto-remove popup after 10 seconds
          setTimeout(() => {
            if (popup.parentElement) {
              popup.remove();
            }
          }, 10000);

          // Check if this is a 403 error (FACEIT blocked our request)
          if (error.status === 403) {
            // Set popup message for 403 error with link if available
            let message =
              "FACEIT API blocked. Click the 'Watch demo' button on FACEIT first to unblock, then try again.";
            if (matchRoomUrl) {
              message = `FACEIT API blocked. Go to the <a href="${matchRoomUrl}" target="_blank" style="color: yellow; text-decoration: underline;">match page</a> and click 'Watch demo' to unblock, then try again.`;
            }
            document.getElementById("popup-message").innerHTML = message;

            // Show helpful message for 403 errors
            button.innerHTML = `
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              Blocked
            `;

            // If we have a match room URL and we're not on the match room page, provide a link
            if (matchRoomUrl && !this.isMatchRoomPage()) {
              button.title =
                "FACEIT API blocked. Click here to go to match page, then click 'Watch demo' to unblock.";

              // Make the button clickable to navigate to match room
              button.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(matchRoomUrl, "_blank");
              };
              button.disabled = false;
              button.style.cursor = "pointer";

              // Log the helpful message with link
              this.log(
                `⚠️ FACEIT API returned 403 (blocked). User needs to go to match page: ${matchRoomUrl}`
              );
              console.warn(
                `🔧 [CS2 Extension] FACEIT API blocked (403). Go to the match page (${matchRoomUrl}) and click 'Watch demo' to unblock, then try again.`
              );
            } else {
              button.title =
                "FACEIT API blocked. Click the 'Watch demo' button on FACEIT first to unblock, then try again.";

              // Log the helpful message
              this.log(
                "⚠️ FACEIT API returned 403 (blocked). User needs to click 'Watch demo' button on FACEIT to unblock."
              );
              console.warn(
                "🔧 [CS2 Extension] FACEIT API blocked (403). To fix this, click the 'Watch demo' button on the FACEIT page, then try the 2D replay button again."
              );
            }

            // Reset button after 4 seconds (longer for 403 to let user read the tooltip)
            setTimeout(() => {
              button.innerHTML = originalContent;
              button.disabled = false;
              button.title = "Open CS2 Demo Viewer";
              button.style.removeProperty("cursor");
              // Restore original click handler with proper context binding
              button.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.handleReplayClick(matchId, button, matchRoomUrl);
              };
            }, 4000);
          } else {
            // Set popup message for other errors
            document.getElementById("popup-message").textContent =
              "An error occurred while fetching the demo. Please try again.";

            // Show generic error feedback for other errors
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
              button.title = "Open CS2 Demo Viewer";
            }, 2000);
          }
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
