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
    this.pendingButton = null;
    this.pendingButtonContent = null;
    this.pendingButtonTimeout = null;

    // Reset button when background confirms the demo URL was captured
    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "demoUrlCaptured") {
        this.resetPendingButton();
      }
    });

    this.init();
  }

  resetPendingButton() {
    if (this.pendingButtonTimeout) {
      clearTimeout(this.pendingButtonTimeout);
      this.pendingButtonTimeout = null;
    }
    if (this.pendingButton) {
      this.pendingButton.innerHTML = this.pendingButtonContent;
      this.pendingButton.disabled = false;
      this.pendingButton = null;
      this.pendingButtonContent = null;
    }
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

    // Detect the auto-trigger flag set by history/stats buttons
    this.autoTrigger2D = new URLSearchParams(window.location.search).has(
      "__cs2_2d"
    );

    this.injectPageScript();
    this.observePageChanges();
    this.injectButtons();
    this.checkScrollableMatchHistory();
    this.checkStatsPageMatches();
  }

  injectPageScript() {
    if (document.getElementById("__cs2-demo-interceptor")) return;
    const script = document.createElement("script");
    script.id = "__cs2-demo-interceptor";
    script.src = browser.runtime.getURL("intercept-page.js");
    (document.head || document.documentElement).appendChild(script);
    this.log("Injected page-context fetch interceptor");
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

    // If this tab was opened by a history/stats button, auto-click to open the viewer
    if (this.autoTrigger2D) {
      this.autoTrigger2D = false;
      setTimeout(() => button.click(), 300);
    }

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

            // Open the match room page with the auto-trigger flag so the
            // reliable fetch-intercept path is used there
            button.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              const href = anchor.href || "";
              const matchId = href.split("/").pop();
              if (matchId) {
                window.open(
                  `https://www.faceit.com/en/cs2/room/${matchId}?__cs2_2d=1`,
                  "_blank"
                );
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

      // Open the match room page with the auto-trigger flag so the
      // reliable fetch-intercept path is used there
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const href = anchor.getAttribute("href") || "";
        const links = href.split("/");
        links.pop();
        const matchId = links.pop();
        if (matchId) {
          window.open(
            `https://www.faceit.com/en/cs2/room/${matchId}?__cs2_2d=1`,
            "_blank"
          );
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
    const loadingSpinner = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    `;

    button.innerHTML = loadingSpinner;
    button.disabled = true;

    // On the match room page we use the reliable interception approach:
    // tell the background to watch for the Backblaze CDN request, then
    // programmatically click Faceit's own "Watch demo" button so the signed
    // URL is generated server-side (no auth issues on our end).
    if (matchId === "match-room-info") {
      try {
        const infoDiv = document.querySelector('div[name="info"]');
        const watchDemoButton = infoDiv
          ? Array.from(infoDiv.querySelectorAll("button")).find((btn) =>
              btn.textContent.trim().toLowerCase().includes("watch demo")
            )
          : null;

        if (!watchDemoButton) {
          throw new Error("Could not find 'Watch demo' button");
        }

        this.pendingButton = button;
        this.pendingButtonContent = originalContent;

        // Handler receives the signed URL from the page-context fetch intercept
        const handleDemoUrl = (e) => {
          const downloadUrl = e.detail;
          this.log("Intercepted signed demo URL:", downloadUrl);
          // Disarm background fallbacks — we already have the URL
          browser.runtime.sendMessage({ type: "cancelDemoWatch" }).catch(() => {});
          const playerUrl = `${this.demoViewerUrl}/player?demourl=${encodeURIComponent(downloadUrl)}`;
          window.open(playerUrl, "_blank");
          this.resetPendingButton();
        };
        window.addEventListener("__cs2DemoUrl", handleDemoUrl, { once: true });

        // Safety timeout — reset button if neither intercept fires
        this.pendingButtonTimeout = setTimeout(() => {
          window.removeEventListener("__cs2DemoUrl", handleDemoUrl);
          this.resetPendingButton();
          this.showPopupError(
            "Timed out waiting for demo URL. Make sure you are logged in to FACEIT and try again."
          );
        }, 15_000);

        // Arm background fallback (webRequest + downloads.cancel) in case the
        // page-script fetch intercept doesn't fire (XHR, CSP block, etc.)
        await browser.runtime.sendMessage({ type: "watchForDemoUrl" });

        // Arm the page-context interceptor, then trigger Faceit's flow
        window.dispatchEvent(new CustomEvent("__cs2ActivateIntercept"));
        watchDemoButton.click();
        this.log("Clicked 'Watch demo', waiting for fetch intercept...");
        return; // Button reset handled by handleDemoUrl / timeout
      } catch (error) {
        console.error("Error using intercept approach:", error);
        button.innerHTML = originalContent;
        button.disabled = false;
        this.showPopupError(
          "Could not trigger demo download. Please click the 'Watch demo' button manually."
        );
        return;
      }
    }

    // For match history / stats pages we fall back to the Faceit internal API.
    // If it returns 403 the user is directed to the match room page where the
    // reliable interception approach above will work.
    try {
      const matchResponse = await fetch(
        `https://www.faceit.com/api/match/v2/match/${matchId}`
      );
      if (!matchResponse.ok) {
        const err = new Error(`HTTP error! status: ${matchResponse.status}`);
        err.status = matchResponse.status;
        throw err;
      }
      const matchData = await matchResponse.json();
      this.log("Match data:", matchData);
      const demoUrl = matchData.payload.demoURLs[0];
      this.log("Demo resource URL:", demoUrl);

      const downloadResponse = await fetch(
        "https://www.faceit.com/api/download/v2/demos/download-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource_url: demoUrl }),
        }
      );
      if (!downloadResponse.ok) {
        const err = new Error(
          `HTTP error! status: ${downloadResponse.status}`
        );
        err.status = downloadResponse.status;
        throw err;
      }
      const downloadData = await downloadResponse.json();
      const downloadUrl = downloadData.payload.download_url;
      this.log("Signed download URL:", downloadUrl);

      const playerUrl = `${this.demoViewerUrl}/player?demourl=${encodeURIComponent(downloadUrl)}`;
      window.open(playerUrl, "_blank");

      button.innerHTML = originalContent;
      button.disabled = false;
    } catch (error) {
      console.error("Error in API calls:", error);

      if (error.status === 403 && matchRoomUrl) {
        // Guide the user to the match room page where the reliable approach works
        this.showPopupError(
          `Could not get demo URL from this page. Go to the <a href="${matchRoomUrl}" target="_blank" style="color:yellow;text-decoration:underline;">match page</a> and use the 2D button there.`
        );
        button.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
          </svg>
          Go to match
        `;
        button.disabled = false;
        button.title = "Click to open match page";
        button.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.open(matchRoomUrl, "_blank");
        };
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.title = "Open CS2 Demo Viewer";
          button.style.removeProperty("cursor");
          button.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleReplayClick(matchId, button, matchRoomUrl);
          };
        }, 5000);
      } else {
        this.showPopupError(
          "An error occurred while fetching the demo. Please try again."
        );
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    }
  }

  showPopupError(htmlMessage) {
    const existing = document.getElementById("faceit-extension-popup");
    if (existing) existing.remove();

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
      <strong>CS2 Demo Viewer</strong><br>
      <span>${htmlMessage}</span><br>
      <button onclick="this.parentElement.remove()" style="margin-top:10px;background:none;border:1px solid white;color:white;padding:5px 10px;cursor:pointer;border-radius:3px;">Close</button>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.parentElement && popup.remove(), 10_000);
  }
}

// Initialize the extension
new FACEITDemoViewer();
