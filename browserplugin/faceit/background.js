// CS2 Demo Viewer - Background Service Worker
// Handles automatic demo URL resolution when viewer page has ?faceit_match_id= parameter
import browser from "webextension-polyfill";

const DEFAULT_DEMO_VIEWER_URL = "https://2d.sparko.cz";

// Match ID pattern (same as in PlayerApp.jsx)
const FACEIT_MATCH_ID_CORE =
  String.raw`\d+-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`;
const FACEIT_MATCH_ID_VALIDATION_PATTERN = new RegExp(
  `^${FACEIT_MATCH_ID_CORE}$`,
  "i"
);

async function getDemoViewerUrl() {
  try {
    const result = await browser.storage.sync.get({
      demoViewerUrl: DEFAULT_DEMO_VIEWER_URL,
    });
    return result.demoViewerUrl || DEFAULT_DEMO_VIEWER_URL;
  } catch {
    return DEFAULT_DEMO_VIEWER_URL;
  }
}

// ---------------------------------------------------------------------------
// Demo URL interception via webRequest
// ---------------------------------------------------------------------------
// When the content script programmatically clicks Faceit's "Watch demo" button,
// we watch for the resulting request to the Backblaze CDN and capture the
// pre-signed URL before the browser downloads the file.

const DEMO_WATCH_TIMEOUT_MS = 30_000;

// { originTabId: number, timestamp: number } | null
let pendingDemoWatch = null;

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "watchForDemoUrl") {
    pendingDemoWatch = {
      originTabId: sender.tab.id,
      timestamp: Date.now(),
    };
    setTimeout(() => {
      // Auto-expire so stale watches don't interfere with later clicks
      if (
        pendingDemoWatch &&
        Date.now() - pendingDemoWatch.timestamp >= DEMO_WATCH_TIMEOUT_MS
      ) {
        pendingDemoWatch = null;
      }
    }, DEMO_WATCH_TIMEOUT_MS);
  }
});

browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    // Only care about actual demo files (.dem.zst / .dem.gz)
    try {
      const pathname = new URL(details.url).pathname;
      if (!/\.dem\.(zst|gz)/.test(pathname)) return;
    } catch {
      return;
    }

    if (!pendingDemoWatch) return;
    if (Date.now() - pendingDemoWatch.timestamp > DEMO_WATCH_TIMEOUT_MS) {
      pendingDemoWatch = null;
      return;
    }

    const watch = pendingDemoWatch;
    pendingDemoWatch = null;

    const demoViewerUrl = await getDemoViewerUrl();
    const viewerUrl = `${demoViewerUrl}/player?demourl=${encodeURIComponent(details.url)}`;
    await browser.tabs.create({ url: viewerUrl });

    // Tell the content script to reset the button state
    try {
      await browser.tabs.sendMessage(watch.originTabId, {
        type: "demoUrlCaptured",
      });
    } catch {
      // Tab may have navigated away — ignore
    }
  },
  { urls: ["*://*.backblazeb2.com/cs2/*"] }
);

// ---------------------------------------------------------------------------
// Auto-resolve ?faceit_match_id= on the viewer page (legacy / fallback path)
// ---------------------------------------------------------------------------

browser.webNavigation.onCommitted.addListener(async (details) => {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  let url;
  try {
    url = new URL(details.url);
  } catch {
    return;
  }

  const matchId = url.searchParams.get("faceit_match_id");
  if (!matchId) return;
  if (!FACEIT_MATCH_ID_VALIDATION_PATTERN.test(matchId)) return;

  // Check if we're on the configured viewer origin
  const demoViewerUrl = await getDemoViewerUrl();
  let viewerOrigin;
  try {
    viewerOrigin = new URL(demoViewerUrl).origin;
  } catch {
    return;
  }

  if (url.origin !== viewerOrigin) return;

  console.log(
    `[CS2 Extension] Detected viewer page with faceit_match_id=${matchId}, showing manual dialog`
  );
  // Leave the page as-is; it will show the manual dialog that directs the
  // user to the Faceit match page.
});
