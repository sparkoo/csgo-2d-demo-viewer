// Runs in the page's main JS context (not the extension sandbox) so it can
// patch window.fetch / window.open before Faceit's own code uses the signed
// download URL.  Loaded via a <script src> tag injected by content-script.js.
(function () {
  if (window.__cs2DemoInterceptorInstalled) return;
  window.__cs2DemoInterceptorInstalled = true;

  let intercepting = false;

  window.addEventListener("__cs2ActivateIntercept", () => {
    intercepting = true;
  });
  window.addEventListener("__cs2CancelIntercept", () => {
    intercepting = false;
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
