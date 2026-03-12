import browser from "webextension-polyfill";

// Inject intercept-page.js into the page's MAIN world so it can patch
// window.fetch / window.open in the same JS context as Faceit's own code.
// Injection happens on demand (user click), not before page load.
// chrome.scripting.executeScript bypasses CSP — unlike a <script src> tag.
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "injectInterceptor") return;

  const tabId = sender.tab?.id;
  if (!tabId) {
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
});
