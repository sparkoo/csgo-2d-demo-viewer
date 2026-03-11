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

// NOTE: MV3 service workers can be terminated by the browser after ~30 s of
// inactivity and restarted fresh on the next event.  These module-level flags
// would reset on restart.  In practice the window between armWatch() and the
// webRequest/downloads event is only a few seconds, so the race is unlikely.
// If it becomes a problem, persist state to chrome.storage.session (Chrome 102+).

// { originTabId: number, timestamp: number } | null
// Used by webRequest.onBeforeRequest (URL capture fallback).
let pendingDemoWatch = null;

// Separate flag used by downloads.onCreated.
// IMPORTANT: webRequest.onBeforeRequest clears pendingDemoWatch before
// downloads.onCreated fires, so they must not share the same variable.
// We also track originTabId separately so the cancel is scoped to the right tab.
let pendingDownloadCancel = false;
let pendingDownloadCancelTabId = null;

function armWatch(originTabId) {
  const entry = { originTabId, timestamp: Date.now() };
  pendingDemoWatch = entry;
  pendingDownloadCancel = true;
  pendingDownloadCancelTabId = originTabId;
  setTimeout(() => {
    if (pendingDemoWatch === entry) pendingDemoWatch = null;
    pendingDownloadCancel = false;
    pendingDownloadCancelTabId = null;
  }, DEMO_WATCH_TIMEOUT_MS);
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "watchForDemoUrl") {
    const tabId = sender?.tab?.id;
    if (typeof tabId === "number") {
      armWatch(tabId);
    }
  } else if (message.type === "cancelDemoWatch") {
    // Fetch intercept in page script already handled it — disarm fallbacks
    pendingDemoWatch = null;
    pendingDownloadCancel = false;
    pendingDownloadCancelTabId = null;
  }
});

// Fallback: cancel any demo file download that slips through the page-script
// window.open intercept (e.g. if Faceit uses window.location.href instead).
browser.downloads.onCreated.addListener(async (downloadItem) => {
  if (!pendingDownloadCancel) return;
  // Scope to the tab that armed the watch (downloadItem.tabId is -1 for
  // non-tab-initiated downloads; treat mismatches as unrelated).
  if (
    pendingDownloadCancelTabId !== null &&
    downloadItem.tabId !== pendingDownloadCancelTabId
  )
    return;
  try {
    const pathname = new URL(downloadItem.url).pathname;
    if (!/\.dem\.(zst|gz)/.test(pathname)) return;
  } catch {
    return;
  }
  pendingDownloadCancel = false;
  pendingDownloadCancelTabId = null;
  await browser.downloads.cancel(downloadItem.id);
  await browser.downloads.erase({ id: downloadItem.id });
});

// Fallback: capture CDN URL via webRequest if the page-script fetch intercept
// didn't fire (e.g. Faceit uses XHR, or CSP blocks the injected script).
// NOTE: MV3 removes webRequestBlocking, so this listener can only observe the
// URL — it cannot cancel the CDN request.  The downloads.onCreated handler
// above races to cancel the resulting file download after the fact.  This
// two-step approach is the only option available in MV3.
browser.webRequest.onBeforeRequest.addListener(
  async (details) => {
    try {
      const pathname = new URL(details.url).pathname;
      if (!/\.dem\.(zst|gz)/.test(pathname)) return;
    } catch {
      return;
    }

    if (!pendingDemoWatch) return;
    // Only handle requests from the tab that armed the watch.
    if (details.tabId !== pendingDemoWatch.originTabId) return;
    if (Date.now() - pendingDemoWatch.timestamp > DEMO_WATCH_TIMEOUT_MS) {
      pendingDemoWatch = null;
      return;
    }

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
