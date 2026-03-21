// CS2 Demo Viewer - Viewer Page Auto-Load Content Script
// Runs on the 2D demo viewer page (2d.sparko.cz/player).
// When the page is opened with ?faceit_match_id=<id>, automatically fetches
// the signed demo download URL from the Faceit API (via the background service
// worker which has access to the user's Faceit session cookies) and redirects
// to ?demourl=<url> to start playback immediately.
import browser from "webextension-polyfill";

const MATCH_ID_RE =
  /^\d+-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

(async () => {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get("faceit_match_id");
  if (!matchId || !MATCH_ID_RE.test(matchId)) return;

  console.log("[CS2 Extension] Auto-fetching demo URL for match:", matchId);

  try {
    const result = await browser.runtime.sendMessage({
      type: "autoFetchDemoUrl",
      matchId,
    });

    if (result?.dlUrl) {
      console.log("[CS2 Extension] Got demo URL, redirecting...");
      window.location.replace(
        `/player?demourl=${encodeURIComponent(result.dlUrl)}`
      );
    } else if (result?.error) {
      console.warn("[CS2 Extension] Auto-fetch error:", result.error);
      // Viewer will show its own dialog as fallback
    }
  } catch (err) {
    // Extension context unavailable or background unreachable — fail silently
    // so the viewer's built-in Faceit dialog is shown as a fallback.
    console.log("[CS2 Extension] Auto-fetch unavailable:", err.message);
  }
})();
