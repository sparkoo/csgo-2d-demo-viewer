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
    this.checkStatsPageMatches();
  }

  // Fetch the signed demo download URL directly from the content-script
  // context.  Content scripts share the page origin so same-origin Faceit
  // API calls include auth cookies automatically — no CORS, no 403.
  // NOTE: the two-step API call sequence here is intentionally duplicated in
  // intercept-page.js (fetchMatchDemo handler) — that copy runs in MAIN world
  // using the unpatched window.fetch; this copy is the direct/final fallback.
  async fetchDemoUrlDirect(matchId) {
    const matchRes = await fetch(
      `https://www.faceit.com/api/match/v2/match/${matchId}`,
      { credentials: "include" }
    );
    if (!matchRes.ok) throw new Error(`match API ${matchRes.status}`);
    const matchData = await matchRes.json();
    const demoUrl = matchData?.payload?.demoURLs?.[0];
    if (!demoUrl) throw new Error("no demoURL in match payload");

    const dlRes = await fetch(
      "https://www.faceit.com/api/download/v2/demos/download-url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_url: demoUrl }),
        credentials: "include",
      }
    );
    if (!dlRes.ok) throw new Error(`download API ${dlRes.status}`);
    const dlData = await dlRes.json();
    const dlUrl = dlData?.payload?.download_url;
    if (!dlUrl) throw new Error("no download_url in payload");
    return dlUrl;
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

    // Extract the matchId from the URL (same path used by match-history buttons).
    const matchIdFromUrl = window.location.pathname.split("/").pop();
    if (!matchIdFromUrl) {
      this.log("❌ Could not extract matchId from URL");
      return false;
    }
    const button = this.createReplayButton(matchIdFromUrl, watchDemoButton);

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
              const href = anchor.href || "";
              const matchId = href.split("/").pop();
              if (matchId) {
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
          const matchRoomUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;
          await this.handleReplayClick(matchId, button, matchRoomUrl);
        }
      });

      targetElement.appendChild(button);
      this.log("Inserted 2D button into stats page match link:", anchor);
    });
  }

  createReplayButton(matchId, watchDemoButton = null) {
    const button = document.createElement("button");
    button.className = `${this.buttonClass}`;
    button.textContent = "2d replay";
    button.title = "Open CS2 Demo Viewer";
    button.dataset.matchId = matchId;

    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleReplayClick(matchId, button, null, watchDemoButton);
    });

    return button;
  }

  async handleReplayClick(matchId, button, matchRoomUrl = null, watchDemoButton = null) {
    this.log("handle click on match", matchId);

    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z">
          <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    `;
    button.disabled = true;

    try {
      let dlUrl = null;

      if (watchDemoButton) {
        dlUrl = await this.fetchDemoUrlViaIntercept(watchDemoButton);
        if (!dlUrl) {
          this.log("Intercept failed or timed out, falling back to page-context fetch");
          dlUrl = await this.fetchDemoUrlViaPageContext(matchId);
          if (!dlUrl) {
            this.log("Page-context fetch failed, falling back to direct fetch");
          }
        }
      }

      // For buttons without a "Watch demo" button (stats/history pages), skip
      // the intercept tiers and fetch directly from the content-script context —
      // same origin, same cookies, no 5 s timeout overhead.
      if (!dlUrl) {
        dlUrl = await this.fetchDemoUrlDirect(matchId);
      }

      // Validate the URL before use — guards against postMessage spoofing where
      // a script on faceit.com forges a demoUrl message with a malicious URL.
      try {
        if (new URL(dlUrl).protocol !== "https:") throw new Error();
      } catch {
        throw new Error("demo URL failed validation — unexpected scheme or format");
      }
      this.log("Got demo URL, downloading demo and transferring to viewer");
      window.postMessage({ __cs2: true, type: "disarmIntercept" }, "*");

      const expectedViewerOrigin = new URL(this.demoViewerUrl).origin;
      const viewerWindow = window.open(`${this.demoViewerUrl}/player?ext_demo=1`, "_blank");

      // Set up abort in case the viewer tab is closed before download finishes
      const abortController = new AbortController();
      const closedInterval = setInterval(() => {
        if (viewerWindow.closed) {
          clearInterval(closedInterval);
          abortController.abort();
        }
      }, 1000);

      // Run download and viewer-ready wait concurrently
      const viewerReadyPromise = this.waitForViewerReady(viewerWindow, expectedViewerOrigin);

      // Track progress so we can forward it once viewer is ready
      let lastProgress = null;
      const downloadPromise = this.fetchDemoBuffer(
        dlUrl,
        (loaded, total) => { lastProgress = { loaded, total }; },
        abortController.signal
      );

      const [{ filename, buffer }] = await Promise.all([downloadPromise, viewerReadyPromise]);
      clearInterval(closedInterval);

      // Send start + data in sequence (viewer is already listening)
      viewerWindow.postMessage(
        { __cs2ext: true, type: "downloadStart", filename, totalBytes: buffer.byteLength },
        expectedViewerOrigin
      );
      viewerWindow.postMessage(
        { __cs2ext: true, type: "demoData", filename, buffer },
        expectedViewerOrigin,
        [buffer]
      );
    } catch (err) {
      this.log("Failed to get demo URL:", String(err));
      window.postMessage({ __cs2: true, type: "disarmIntercept" }, "*");
      const link = matchRoomUrl
        ? { href: matchRoomUrl, text: "match page" }
        : null;
      this.showPopupError(`Could not get demo URL (${err?.message ?? String(err)}).`, link);
    } finally {
      button.innerHTML = originalContent;
      button.disabled = false;
    }
  }

  // Inject intercept-page.js into the page's MAIN world via the background
  // service worker (which uses chrome.scripting.executeScript — CSP-proof),
  // then arm it and programmatically click Faceit's "Watch demo" button.
  // Returns the signed CDN URL, or null if injection fails or times out.
  async fetchDemoUrlViaIntercept(watchDemoButton) {
    let injected;
    try {
      injected = await browser.runtime.sendMessage({ type: "injectInterceptor" });
    } catch (err) {
      this.log("injectInterceptor message failed:", err);
      return null;
    }
    if (!injected?.ok) {
      this.log("Interceptor injection failed:", injected?.error);
      return null;
    }

    return new Promise((resolve) => {
      const TIMEOUT_MS = 5000;
      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        window.postMessage({ __cs2: true, type: "disarmIntercept" }, "*");
        this.log("Intercept timed out after", TIMEOUT_MS, "ms");
        resolve(null);
      }, TIMEOUT_MS);

      const handler = (e) => {
        if (e.source !== window || !e.data || e.data.__cs2 !== true) return;
        if (e.data.type !== "demoUrl" && e.data.type !== "demoUrlError") return;
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        if (e.data.type === "demoUrl") {
          this.log("Intercept captured URL");
          resolve(e.data.url);
        } else {
          this.log("Intercept error:", e.data.error);
          resolve(null);
        }
      };
      window.addEventListener("message", handler);

      // Arm the interceptor, then trigger Faceit's flow.
      window.postMessage({ __cs2: true, type: "armIntercept" }, "*");
      watchDemoButton.click();
    });
  }

  // Ask the page-context interceptor to fetch the signed URL using Faceit's
  // auth cookies via _origFetch (unpatched window.fetch in MAIN world). Used as
  // a fallback when the fetch-intercept tier timed out but a "Watch demo" button
  // was present. Returns null if injection fails or times out.
  // NOTE: the two-step API call sequence here is intentionally duplicated from
  // fetchDemoUrlDirect — that runs in the content-script isolated world; this
  // runs in the page's MAIN world via intercept-page.js using the unpatched fetch.
  async fetchDemoUrlViaPageContext(matchId) {
    let injected;
    try {
      injected = await browser.runtime.sendMessage({ type: "injectInterceptor" });
    } catch (err) {
      this.log("injectInterceptor message failed:", err);
      return null;
    }
    if (!injected?.ok) {
      this.log("Interceptor injection failed:", injected?.error);
      return null;
    }

    return new Promise((resolve) => {
      const TIMEOUT_MS = 5000;
      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        window.postMessage({ __cs2: true, type: "disarmIntercept" }, "*");
        this.log("Page-context fetch timed out");
        resolve(null);
      }, TIMEOUT_MS);

      const handler = (e) => {
        if (e.source !== window || !e.data || e.data.__cs2 !== true) return;
        if (e.data.type !== "demoUrl" && e.data.type !== "demoUrlError") return;
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        if (e.data.type === "demoUrl") {
          resolve(e.data.url);
        } else {
          this.log("Page-context fetch error:", e.data.error);
          resolve(null);
        }
      };
      window.addEventListener("message", handler);

      window.postMessage({ __cs2: true, type: "fetchMatchDemo", matchId }, "*");
    });
  }

  // Waits for the viewer page (opened via window.open) to signal it is ready
  // to receive demo data. Resolves when the viewer sends a viewerReady message,
  // rejects after TIMEOUT_MS if no signal arrives.
  waitForViewerReady(viewerWindow, expectedViewerOrigin) {
    return new Promise((resolve, reject) => {
      const TIMEOUT_MS = 30_000;
      const timer = setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error("viewer did not signal ready within 30s"));
      }, TIMEOUT_MS);

      const handler = (e) => {
        if (e.source !== viewerWindow) return;
        if (e.origin !== expectedViewerOrigin) return;
        if (!e.data?.__cs2ext || e.data.type !== "viewerReady") return;
        clearTimeout(timer);
        window.removeEventListener("message", handler);
        resolve();
      };
      window.addEventListener("message", handler);
    });
  }

  // Downloads a demo binary directly from the CDN URL. Extension host_permissions
  // for *.backblazeb2.com bypass CORS so no server proxy is needed.
  // onProgress(loaded, total) is called after each received chunk; total is 0
  // when Content-Length is unavailable.
  // Returns Promise<{ filename: string, buffer: ArrayBuffer }>.
  async fetchDemoBuffer(dlUrl, onProgress, signal) {
    const response = await fetch(dlUrl, { signal });
    if (!response.ok) throw new Error(`CDN fetch failed: ${response.status}`);

    const filename = new URL(dlUrl).pathname.split("/").pop() || "demo.dem.zst";
    const totalBytes = parseInt(response.headers.get("content-length") || "0", 10);

    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      onProgress?.(loaded, totalBytes);
    }

    // Concatenate all chunks into a single ArrayBuffer
    const total = chunks.reduce((acc, c) => acc + c.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    return { filename, buffer: merged.buffer };
  }

  showPopupError(message, link = null) {
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

    const title = document.createElement("strong");
    title.textContent = "CS2 Demo Viewer";
    const msg = document.createElement("span");
    msg.textContent = message;
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText = "margin-top:10px;background:none;border:1px solid white;color:white;padding:5px 10px;cursor:pointer;border-radius:3px;";
    closeBtn.addEventListener("click", () => popup.remove());

    popup.appendChild(title);
    popup.appendChild(document.createElement("br"));
    popup.appendChild(msg);
    if (link) {
      const a = document.createElement("a");
      a.href = link.href;
      a.textContent = link.text;
      a.target = "_blank";
      a.style.cssText = "color:yellow;text-decoration:underline;";
      msg.appendChild(document.createTextNode(" Try the "));
      msg.appendChild(a);
      msg.appendChild(document.createTextNode(" directly."));
    }
    popup.appendChild(document.createElement("br"));
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);
    setTimeout(() => popup.parentElement && popup.remove(), 10_000);
  }
}

// Initialize the extension
new FACEITDemoViewer();
