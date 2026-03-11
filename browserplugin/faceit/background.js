// CS2 Demo Viewer - Background Service Worker
import browser from "webextension-polyfill";

const DEFAULT_DEMO_VIEWER_URL = "https://2d.sparko.cz";

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
// Used by webRequest.onBeforeRequest (URL capture fallback).
// NOTE: MV3 service workers may be terminated after ~30 s of inactivity.
// If the worker is killed between armWatch() and the webRequest/downloads event,
// these flags reset silently. Persisting to chrome.storage.session (Chrome 102+)
// would survive restarts, but is not yet implemented.
let pendingDemoWatch = null;

// Separate flag used by downloads.onCreated.
// IMPORTANT: webRequest.onBeforeRequest clears pendingDemoWatch before
// downloads.onCreated fires, so they must not share the same variable.
let pendingDownloadCancel = false;

function armWatch(originTabId) {
  const entry = { originTabId, timestamp: Date.now() };
  pendingDemoWatch = entry;
  pendingDownloadCancel = true;
  setTimeout(() => {
    if (pendingDemoWatch === entry) pendingDemoWatch = null;
    pendingDownloadCancel = false;
  }, DEMO_WATCH_TIMEOUT_MS);
}

browser.runtime.onMessage.addListener((message, sender) => {
  // Messages from contexts without a tab (e.g. popup) have no sender.tab
  const tabId = sender && sender.tab && sender.tab.id;
  if (typeof tabId !== "number") return;

  if (message.type === "watchForDemoUrl") {
    armWatch(tabId);
  } else if (message.type === "cancelDemoWatch") {
    // Fetch intercept in page script already handled it — disarm fallbacks
    pendingDemoWatch = null;
    pendingDownloadCancel = false;
  }
});

// Fallback: cancel any demo file download that slips through the page-script
// window.open intercept (e.g. if Faceit uses window.location.href instead).
// Note: the downloads API does not expose the initiating tab ID, so we scope
// by URL host and pathname to avoid cancelling unrelated downloads.
browser.downloads.onCreated.addListener(async (downloadItem) => {
  if (!pendingDownloadCancel) return;
  try {
    const parsedUrl = new URL(downloadItem.url);
    if (!/backblazeb2\.com$/.test(parsedUrl.hostname)) return;
    if (!/\.dem\.(zst|gz)/.test(parsedUrl.pathname)) return;
  } catch {
    return;
  }
  pendingDownloadCancel = false;
  await browser.downloads.cancel(downloadItem.id);
  await browser.downloads.erase({ id: downloadItem.id });
});

// Fallback: capture CDN URL via webRequest if the page-script fetch intercept
// didn't fire (e.g. Faceit uses XHR, or CSP blocks the injected script).
// NOTE: MV3 restricts webRequestBlocking, so this listener is async but cannot
// return { cancel: true } to block the request. The download is cancelled
// after the fact via downloads.onCreated racing the download start.
browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      const parsedUrl = new URL(details.url);
      if (!/\.dem\.(zst|gz)/.test(parsedUrl.pathname)) return;
    } catch {
      return;
    }

    if (!pendingDemoWatch) return;
    if (Date.now() - pendingDemoWatch.timestamp > DEMO_WATCH_TIMEOUT_MS) {
      pendingDemoWatch = null;
      return;
    }

    // Only handle requests that originated from the tab that armed the watch
    if (details.tabId !== pendingDemoWatch.originTabId) return;

    const watch = pendingDemoWatch;
    pendingDemoWatch = null;
    // leave pendingDownloadCancel = true so downloads.onCreated can still cancel

    const demoViewerUrl = await getDemoViewerUrl();
    const viewerUrl = `${demoViewerUrl}/player?demourl=${encodeURIComponent(details.url)}`;
    await browser.tabs.create({ url: viewerUrl });

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

