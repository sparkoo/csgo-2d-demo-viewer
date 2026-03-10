// Runs in the page's main JS context (not the extension sandbox) so it can
// patch window.fetch / window.open before Faceit's own code uses the signed
// download URL.  Loaded via a <script src> tag injected by content-script.js.
(function () {
  if (window.__cs2DemoInterceptorInstalled) return;
  window.__cs2DemoInterceptorInstalled = true;
  console.log("[cs2-intercept] interceptor installed on", window.location.href);

  let intercepting = false;

  window.addEventListener("__cs2ActivateIntercept", () => {
    intercepting = true;
  });
  window.addEventListener("__cs2CancelIntercept", () => {
    intercepting = false;
  });

  // ── 3. Fetch match demo URL from the page context ─────────────────────────
  // Content scripts get 403 on Faceit's internal APIs because they lack auth
  // cookies.  Requests from this page-context script use the same session as
  // Faceit's own JS, so they succeed.  We use postMessage (not CustomEvent)
  // because CustomEvent.detail is null when crossing Chrome's isolated worlds.
  window.addEventListener("message", async (e) => {
    if (
      e.source !== window ||
      !e.data ||
      e.data.__cs2 !== true ||
      e.data.type !== "fetchMatchDemo"
    )
      return;
    const matchId = e.data.matchId;
    console.log("[cs2-intercept] fetchMatchDemo received, matchId:", matchId);
    if (!matchId) return;
    try {
      const matchRes = await _origFetch(
        `https://www.faceit.com/api/match/v2/match/${matchId}`
      );
      if (!matchRes.ok) throw new Error(`match API ${matchRes.status}`);
      const matchData = await matchRes.json();
      const demoUrl =
        matchData &&
        matchData.payload &&
        matchData.payload.demoURLs &&
        matchData.payload.demoURLs[0];
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
      const dlUrl =
        dlData && dlData.payload && dlData.payload.download_url;
      if (!dlUrl) throw new Error("no download_url in payload");

      console.log("[cs2-intercept] fetchMatchDemo success, dispatching url");
      window.dispatchEvent(
        new CustomEvent("__cs2DemoUrl", { detail: dlUrl })
      );
    } catch (err) {
      console.log("[cs2-intercept] fetchMatchDemo error:", String(err));
      window.dispatchEvent(
        new CustomEvent("__cs2DemoUrlError", { detail: String(err) })
      );
    }
  });

  // ── 1. Intercept fetch to capture the signed URL ─────────────────────────
  // We let the REAL response go back to Faceit's JS (so their UI doesn't
  // break), but we clone it first to read the signed URL and dispatch it to
  // the content script.
  const _origFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    const response = await _origFetch.apply(this, arguments);

    if (intercepting && url && url.includes("/api/download/v2/demos/download-url")) {
      response
        .clone()
        .json()
        .then((data) => {
          const dlUrl = data && data.payload && data.payload.download_url;
          if (dlUrl) {
            intercepting = false;
            window.dispatchEvent(
              new CustomEvent("__cs2DemoUrl", { detail: dlUrl })
            );
          }
        })
        .catch(() => {
          intercepting = false;
        });
    }

    return response;
  };

  // ── 2. Intercept window.open to block the CDN download from opening ───────
  // After receiving the signed URL Faceit's JS typically calls
  // window.open(signedUrl, '_blank') which would start a file download in a
  // new tab.  We block that tab from opening — the content script will open
  // the 2D viewer instead.
  const _origOpen = window.open;
  window.open = function (url) {
    if (url && typeof url === "string") {
      try {
        const u = new URL(url, window.location.href);
        if (
          /backblazeb2\.com/.test(u.hostname) &&
          /\.dem\.(zst|gz)/.test(u.pathname)
        ) {
          return null; // block — viewer handles it
        }
      } catch {
        // not a valid URL, fall through
      }
    }
    return _origOpen.apply(this, arguments);
  };
})();
