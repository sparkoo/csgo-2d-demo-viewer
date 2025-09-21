// CS2 Demo Viewer - FACEIT Integration Content Script
console.log("🚀 CS2 Demo Viewer extension loaded!");
console.log("📍 Current URL:", window.location.href);
console.log("📄 Document ready state:", document.readyState);
console.log("🌐 User agent:", navigator.userAgent);

class FACEITDemoViewer {
  constructor() {
    this.demoViewerUrl = "http://localhost:3000";
    this.buttonClass = "cs2-demo-viewer-btn";
    this.debugMode = true;
    this.init();
  }

  log(...args) {
    if (this.debugMode) {
      console.log("🔧 [CS2 Extension]", ...args);
    }
  }

  init() {
    this.log("Initializing extension...");

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
    if (!window.location.hostname.includes("faceit.com")) {
      this.log("❌ Not on FACEIT domain, exiting...");
      return;
    }

    this.log("✅ Confirmed on FACEIT domain");

    this.observePageChanges();
    this.injectButtons();
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
        }, 1000);
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

    // Create our button
    const button = this.createAnalyzeButton("match-room-info");

    // Simply append the button to the info div
    infoDiv.appendChild(button);
    this.log("✅ Successfully inserted button into div[name='info']");
    return true;
  }

  createAnalyzeButton(matchId) {
    const button = document.createElement("button");
    button.className = `${this.buttonClass}`;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
      </svg>
      2d sparko
    `;
    button.title = "Open CS2 Demo Viewer";
    button.dataset.matchId = matchId;

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleAnalyzeClick(matchId, button);
    });

    return button;
  }

  handleAnalyzeClick(matchId, button) {
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
      // Open the demo viewer in a new tab
      window.open(this.demoViewerUrl, "_blank");

      // Show success feedback
      button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
        </svg>
        Opened!
      `;

      // Reset button after 2 seconds
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }, 2000);
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
