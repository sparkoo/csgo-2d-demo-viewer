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
    this.turnstileWidgetId = "dsparko-turnstile";
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
    this.addDivBelowTurnstile();
  }

  isMatchRoomPage() {
    // Check if current URL is a match room page
    const url = window.location.href;
    const matchRoomPattern = /\/cs2\/room\/[^\/]+$/;
    return matchRoomPattern.test(url);
  }

  addDivBelowTurnstile() {
    this.log("🔍 Looking for turnstile widget...");
    const turnstileInput = document.querySelector(
      '[name="cf-turnstile-response"]'
    );
    if (turnstileInput) {
      let turnstileDiv = turnstileInput.closest("div");
      if (turnstileDiv) {
        if (!turnstileDiv.id) {
          turnstileDiv.id = this.turnstileWidgetId;
        }
        const newDiv = document.createElement("div");
        turnstileDiv.insertAdjacentElement("afterend", newDiv);
        this.log("✅ Added div below turnstile widget");
      } else {
        this.log("❌ Could not find turnstile div");
      }
    } else {
      this.log("⚠️ Turnstile input not found");
    }
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
          this.addDivBelowTurnstile();
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
          this.addDivBelowTurnstile();
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
    const button = this.createAnalyzeButton("match-room-info");

    // Insert the button right after the "Watch demo" button
    watchDemoButton.insertAdjacentElement("afterend", button);

    // Create an empty div below the button
    const emptyDiv = document.createElement("div");
    emptyDiv.id = "2d_turnstile";
    button.insertAdjacentElement("afterend", emptyDiv);

    this.log("✅ Successfully inserted button after 'Watch demo' button");
    return true;
  }

  createAnalyzeButton(matchId) {
    const button = document.createElement("button");
    button.className = `${this.buttonClass}`;
    button.innerHTML = `
      2d sparko
    `;
    button.title = "Open CS2 Demo Viewer";
    button.dataset.matchId = matchId;

    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleAnalyzeClick(matchId, button);
    });

    return button;
  }

  getToken() {
    // TODO: get the real token
    return "abcd";
  }

  async findSiteKey() {
    const faceitMainScript = [...document.querySelectorAll("script")].find(
      (script) =>
        /https:\/\/cdn-frontend\.faceit-cdn\.net\/web-next\/_next\/static\/chunks\/pages\/_app-[a-z0-9]+\.min\.js/.test(
          script.src
        )
    );

    const faceitChunkScripts = [...document.querySelectorAll("script")].filter(
      (script) =>
        /https:\/\/cdn-frontend\.faceit-cdn\.net\/web-next\/.*\/chunks\/[0-9]+.*\.min\.js/.test(
          script.src
        )
    );

    const searchScript = async (chunkScript) => {
      try {
        const response = await fetch(chunkScript.src);
        if (!response.ok) return null;

        const text = await response.text();

        const patterns = [
          /\("(0x[a-zA-Z0-9]+)"\)/,
          /"(0x[a-zA-Z0-9]{16,})"/,
          /sitekey:\s*"(0x[a-zA-Z0-9]+)"/,
          /'(0x[a-zA-Z0-9]{16,})'/,
        ];

        for (const pattern of patterns) {
          const match = pattern.exec(text);
          if (match) {
            const siteKey = match[1];
            if (
              siteKey !== "0xffffffffffffffff" &&
              !siteKey.match(/^0x[f]+$/)
            ) {
              return siteKey;
            }
          }
        }
        return null;
      } catch (error) {
        return null;
      }
    };

    const searchPromises = faceitChunkScripts.map((script) =>
      searchScript(script)
    );

    const results = await Promise.allSettled(searchPromises);
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        console.log("found?", result.value);
        return result.value;
      }
    }

    throw new Error("Could not find the sitekey");
  }

  async handleAnalyzeClick(matchId, button) {
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

    const siteKey = await this.findSiteKey();
    if (!siteKey) {
      console.log("couldn't find the sitekey");
      return;
    }

    try {
      // Extract match ID from URL
      const url = window.location.href;
      const matchId = url.split("/").pop();

      // First, fetch match details
      fetch(`https://www.faceit.com/api/match/v2/match/${matchId}`)
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

          window.postMessage({
            source: "2dsparko-extenstion-script",
            demourl: demoUrl,
            sitekey: siteKey,
          });
          return 1;

          // Then, make HTTP request to download demo URL
          // return fetch(
          //   "https://www.faceit.com/api/download/v2/demos/download-url",
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json",
          //     },
          //     body: JSON.stringify({
          //       resource_url: demoUrl,
          //       captcha_token: this.getToken(),
          //     }),
          //   }
          // );
        })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((downloadData) => {
          this.log("Demo download URL response:", downloadData);
          const downloadUrl =
            "https://demos-europe-central-faceit-cdn.s3.eu-central-003.backblazeb2.com/cs2/1-307fb563-abc0-45f7-9d2c-d60a4b40a220-1-1.dem.zst?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=0032bdbf06e20000000000001%2F20250924%2F%2Fs3%2Faws4_request&X-Amz-Date=20250924T044918Z&X-Amz-Expires=299&X-Amz-SignedHeaders=host&x-id=GetObject&X-Amz-Signature=8cd0b0647bc7a45fcc54c44d9582c94777e613417281bfb668c7a8dd89eaf641";
          this.log("Demo final download link", downloadUrl);

          // Fetch demo directly with credentials
          this.log("Fetching demo directly with credentials");
          fetch(downloadUrl)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.blob();
            })
            .then((blob) => {
              return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            })
            .then((dataUrl) => {
              this.log("Demo converted to data URL");

              // Open the demo viewer in a new tab
              chrome.tabs.create({ url: this.demoViewerUrl }, (tab) => {
                // Inject the data URL into the viewer
                chrome.tabs.executeScript(
                  tab.id,
                  {
                    code: `window.demoData = '${dataUrl.replace(
                      /'/g,
                      "\\'"
                    )}';`,
                  },
                  () => {
                    // Show success feedback
                    button.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                    </svg>
                    Opened Viewer!
                  `;

                    // Reset button after 2 seconds
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                      button.disabled = false;
                    }, 2000);
                  }
                );
              });
            })
            .catch((error) => {
              console.error("Error downloading demo:", error);

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

// Function to inject the script
function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  node.appendChild(script);
}

// Inject the injector.js script
// NOTE: The path must be relative to the extension's root directory.
// You might need to use chrome.runtime.getURL() or browser.runtime.getURL()
// to get the correct path.
const scriptUrl = chrome.runtime.getURL("injector.js");
injectScript(scriptUrl, "body");

// Listen for the message from the injected script
window.addEventListener("message", function (event) {
  // We must verify the message origin
  if (
    event.source !== window ||
    event.data.source !== "my-extension-injector"
  ) {
    return;
  }

  console.log("blabol", event);

  // Now you have the data in your content script's world!
  if (event.data.turnstileLoaded) {
    console.log("🎉 window.turnstile is accessible and loaded on the page!");
    // Do further processing here...
  }
});
