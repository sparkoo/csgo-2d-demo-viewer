// Runs in the page's main JS context (not the extension sandbox) so it can
// patch window.fetch before Faceit's own code uses the signed download URL.
// Loaded via a <script src> tag injected by content-script.js.
(function () {
  if (window.__cs2DemoInterceptorInstalled) return;
  window.__cs2DemoInterceptorInstalled = true;

  let intercepting = false;

  // Content script signals us to arm/disarm interception
  window.addEventListener("__cs2ActivateIntercept", () => {
    intercepting = true;
  });
  window.addEventListener("__cs2CancelIntercept", () => {
    intercepting = false;
  });

  const _origFetch = window.fetch;

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;

    if (
      intercepting &&
      url &&
      url.includes("/api/download/v2/demos/download-url")
    ) {
      let response;
      try {
        response = await _origFetch.apply(this, arguments);
      } catch (e) {
        intercepting = false;
        throw e;
      }

      // Clone before consuming so we can still parse it
      response
        .clone()
        .json()
        .then((data) => {
          const dlUrl = data && data.payload && data.payload.download_url;
          if (dlUrl) {
            intercepting = false;
            // Pass the real signed URL to the content script via custom event
            window.dispatchEvent(
              new CustomEvent("__cs2DemoUrl", { detail: dlUrl })
            );
          }
        })
        .catch(() => {
          intercepting = false;
        });

      // Return a harmless fake response so Faceit's JS navigates to '#'
      // (just scrolls to top) instead of the CDN URL (which triggers a download)
      return new Response(
        JSON.stringify({ payload: { download_url: "#" } }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return _origFetch.apply(this, arguments);
  };
})();
