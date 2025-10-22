// CS2 Demo Viewer Extension Popup
document.addEventListener("DOMContentLoaded", async () => {
  const openFaceitBtn = document.getElementById("openFaceit");
  const viewerUrlInput = document.getElementById("viewerUrlInput");
  const versionElement = document.getElementById("version");

  // Demo viewer URL (configurable, fallback to default)
  const DEFAULT_DEMO_VIEWER_URL = "https://2d.sparko.cz";
  let demoViewerUrl = DEFAULT_DEMO_VIEWER_URL;

  // Try to load the viewer URL from chrome.storage (sync or local)
  const result = await chrome.storage.sync.get({
    demoViewerUrl: DEFAULT_DEMO_VIEWER_URL,
  });
  demoViewerUrl = result.demoViewerUrl || DEFAULT_DEMO_VIEWER_URL;

  // Update viewer URL display
  viewerUrlInput.textContent = demoViewerUrl;

  // Get extension version from manifest
  const manifest = chrome.runtime.getManifest();
  versionElement.textContent = manifest.version;

  openFaceitBtn.addEventListener("click", async () => {
    try {
      // Add loading state
      openFaceitBtn.classList.add("loading");
      openFaceitBtn.disabled = true;

      // Navigate to FACEIT
      await chrome.tabs.create({
        url: "https://www.faceit.com",
        active: true,
      });
      window.close();
    } catch (error) {
      console.error("Error opening FACEIT:", error);

      // Remove loading state
      openFaceitBtn.classList.remove("loading");
      openFaceitBtn.disabled = false;

      // Show error feedback
      const originalText = openFaceitBtn.innerHTML;
      openFaceitBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
        Error Opening
      `;

      setTimeout(() => {
        openFaceitBtn.innerHTML = originalText;
      }, 2000);
    }
  });

  // Add keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.close();
    }

    if (e.key === "Enter") {
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement.tagName === "BUTTON") {
        focusedElement.click();
      }
    }
  });

  // Focus first button for keyboard navigation
  openFaceitBtn.focus();
});

// Handle messages from content script (if needed in future)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    // Handle status updates from content script
    console.log("Status update:", request.status);
  }

  return true; // Keep message channel open
});
