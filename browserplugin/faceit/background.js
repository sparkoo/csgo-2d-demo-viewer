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

async function fetchDemoDownloadUrl(matchId) {
  // Fetch match details from Faceit API
  const matchResponse = await fetch(
    `https://www.faceit.com/api/match/v2/match/${matchId}`,
    { credentials: "include" }
  );
  if (!matchResponse.ok) {
    throw new Error(`Match API error: ${matchResponse.status}`);
  }
  const matchData = await matchResponse.json();
  const demoUrl = matchData.payload.demoURLs[0];

  // Fetch the actual download URL
  const downloadResponse = await fetch(
    "https://www.faceit.com/api/download/v2/demos/download-url",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_url: demoUrl }),
      credentials: "include",
    }
  );
  if (!downloadResponse.ok) {
    throw new Error(`Download API error: ${downloadResponse.status}`);
  }
  const downloadData = await downloadResponse.json();
  return downloadData.payload.download_url;
}

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
    `[CS2 Extension] Detected viewer page with faceit_match_id=${matchId}, auto-fetching demo URL...`
  );

  try {
    const downloadUrl = await fetchDemoDownloadUrl(matchId);
    const newUrl = `${demoViewerUrl}/player?demourl=${encodeURIComponent(downloadUrl)}`;
    console.log(`[CS2 Extension] Redirecting to demo URL: ${newUrl}`);
    await browser.tabs.update(details.tabId, { url: newUrl });
  } catch (error) {
    console.error(
      "[CS2 Extension] Failed to auto-fetch demo URL:",
      error.message
    );
    // Leave the page as-is; it will show the manual dialog
  }
});
