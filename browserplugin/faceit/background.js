import browser from "webextension-polyfill";

// Fetch the signed demo download URL from the Faceit API using the user's
// session cookies. The background service worker can make credentialed
// cross-origin requests to any host listed in host_permissions, so Faceit
// auth cookies are attached automatically when credentials: 'include' is set.
// NOTE: the two-step API call sequence here is intentionally shared with
// fetchDemoUrlDirect in content-script.js and fetchMatchDemo in
// intercept-page.js — all three serve different execution contexts.
async function fetchDemoUrlFromBackground(matchId) {
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

// Inject intercept-page.js into the page's MAIN world so it can patch
// window.fetch / window.open in the same JS context as Faceit's own code.
// Injection happens on demand (user click), not before page load.
// chrome.scripting.executeScript bypasses CSP — unlike a <script src> tag.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "injectInterceptor") {
    const tabId = sender.tab?.id;
    if (typeof tabId !== "number") {
      sendResponse({ ok: false, error: "no tab id" });
      return;
    }

    browser.scripting
      .executeScript({
        target: { tabId },
        files: ["intercept-page.js"],
        world: "MAIN",
      })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));

    return true; // keep message channel open for the async response
  }

  if (message.type === "autoFetchDemoUrl") {
    // Called by viewer-content-script.js when the viewer page is opened with
    // ?faceit_match_id=<id>. Fetches the signed CDN URL from Faceit using the
    // user's session cookies and returns it so the content script can redirect.
    const { matchId } = message;
    fetchDemoUrlFromBackground(matchId)
      .then((dlUrl) => {
        if (new URL(dlUrl).protocol !== "https:")
          throw new Error("invalid protocol");
        sendResponse({ dlUrl });
      })
      .catch((err) => {
        console.warn("[Auto-fetch] Failed:", err.message);
        sendResponse({ error: err.message });
      });

    return true; // keep message channel open for the async response
  }
});
