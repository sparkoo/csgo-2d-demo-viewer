// Runs in the page's main JS context (injected via chrome.scripting.executeScript
// with world: "MAIN"). This bypasses CSP because it goes through the extension
// API, not a <script src> tag.
(function () {
  if (window.__cs2InterceptorInstalled) return;
  window.__cs2InterceptorInstalled = true;

  let armed = false;

  // Save original fetch before patching so message handler and interceptor
  // both use the unpatched version.
  const _origFetch = window.fetch;

  // Content script communicates via postMessage (crosses isolated-world boundary).
  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data || e.data.__cs2 !== true) return;
    if (e.data.type === "armIntercept") {
      armed = true;
    } else if (e.data.type === "disarmIntercept") {
      armed = false;
    } else if (e.data.type === "fetchMatchDemo") {
      // Fetch the signed demo URL from page context (has auth cookies) on behalf
      // of the content script. Used by sidebar/stats buttons where there is no
      // "Watch demo" button to trigger Faceit's own flow.
      const { matchId } = e.data;
      try {
        const matchRes = await _origFetch(
          `https://www.faceit.com/api/match/v2/match/${matchId}`
        );
        if (!matchRes.ok) throw new Error(`match API ${matchRes.status}`);
        const matchData = await matchRes.json();
        const demoUrl = matchData?.payload?.demoURLs?.[0];
        if (!demoUrl) throw new Error("no demoURL in match payload");

        const dlRes = await _origFetch(
          "https://www.faceit.com/api/download/v2/demos/download-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resource_url: demoUrl }),
          }
        );
        if (!dlRes.ok) throw new Error(`download API ${dlRes.status}`);
        const dlData = await dlRes.json();
        const dlUrl = dlData?.payload?.download_url;
        if (!dlUrl) throw new Error("no download_url in payload");

        window.postMessage({ __cs2: true, type: "demoUrl", url: dlUrl }, "*");
      } catch (err) {
        window.postMessage({ __cs2: true, type: "demoUrlError", error: String(err) }, "*");
      }
    }
  });

  // Intercept fetch: clone the download-url response to extract the signed CDN URL
  // and post it back to the content script, while letting the real response
  // continue so Faceit's UI doesn't break.

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url;
    const response = await _origFetch.apply(this, arguments);

    if (armed && url && url.includes("/api/download/v2/demos/download-url")) {
      response
        .clone()
        .json()
        .then((data) => {
          const dlUrl = data?.payload?.download_url;
          if (dlUrl) {
            window.postMessage({ __cs2: true, type: "demoUrl", url: dlUrl }, "*");
          } else {
            window.postMessage({ __cs2: true, type: "demoUrlError", error: "no download_url in payload" }, "*");
          }
        })
        .catch(() =>
          window.postMessage({ __cs2: true, type: "demoUrlError", error: "failed to parse response" }, "*")
        );
    }

    return response;
  };

  // Intercept window.open to block Faceit from opening the CDN file download
  // in a new tab when armed. The content script will open the viewer instead.
  const _origOpen = window.open;
  window.open = function (url) {
    if (armed && url && typeof url === "string") {
      try {
        const u = new URL(url, window.location.href);
        // NOTE: this regex is hardcoded to the current Faceit CDN (Backblaze B2).
        // If Faceit changes CDN providers this will silently stop blocking the
        // native download tab and both windows will open.
        if (/backblazeb2\.com/.test(u.hostname) && /\.dem\.(zst|gz)/.test(u.pathname)) {
          return null;
        }
      } catch {
        // not a valid URL, fall through
      }
    }
    return _origOpen.apply(this, arguments);
  };
})();
