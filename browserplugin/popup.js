// CS2 Demo Viewer Extension Popup
document.addEventListener("DOMContentLoaded", async () => {
  const statusIndicator = document.getElementById("statusIndicator");
  const statusTitle = document.getElementById("statusTitle");
  const statusDescription = document.getElementById("statusDescription");
  const openViewerBtn = document.getElementById("openViewer");
  const openFaceitBtn = document.getElementById("openFaceit");
  const viewerUrl = document.getElementById("viewerUrl");

  // Demo viewer URL
  const demoViewerUrl = "http://localhost:3000";

  // Update viewer URL display
  viewerUrl.textContent = demoViewerUrl.replace("http://", "");

  // Check current tab and update status
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (tab.url.includes("faceit.com")) {
      statusIndicator.className = "status-indicator";
      statusTitle.textContent = "Ready on FACEIT";
      statusDescription.textContent =
        'Look for "Analyze Demo" buttons on match pages';
    } else {
      statusIndicator.className = "status-indicator warning";
      statusTitle.textContent = "Not on FACEIT";
      statusDescription.textContent = "Navigate to FACEIT.com to analyze demos";
    }
  } catch (error) {
    console.error("Error checking current tab:", error);
    statusIndicator.className = "status-indicator error";
    statusTitle.textContent = "Extension Error";
    statusDescription.textContent = "Unable to check current page";
  }

  // Button event listeners
  openViewerBtn.addEventListener("click", async () => {
    try {
      // Add loading state
      openViewerBtn.classList.add("loading");
      openViewerBtn.disabled = true;

      // Open demo viewer in new tab
      await chrome.tabs.create({
        url: demoViewerUrl,
        active: true,
      });

      // Close popup after opening
      window.close();
    } catch (error) {
      console.error("Error opening demo viewer:", error);

      // Remove loading state
      openViewerBtn.classList.remove("loading");
      openViewerBtn.disabled = false;

      // Show error feedback
      const originalText = openViewerBtn.innerHTML;
      openViewerBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
        Error Opening
      `;

      setTimeout(() => {
        openViewerBtn.innerHTML = originalText;
      }, 2000);
    }
  });

  openFaceitBtn.addEventListener("click", async () => {
    try {
      // Add loading state
      openFaceitBtn.classList.add("loading");
      openFaceitBtn.disabled = true;

      // Check if already on FACEIT
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab.url.includes("faceit.com")) {
        // Already on FACEIT, just close popup
        window.close();
      } else {
        // Navigate to FACEIT
        await chrome.tabs.create({
          url: "https://www.faceit.com",
          active: true,
        });
        window.close();
      }
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
  openViewerBtn.focus();
});

// Handle messages from content script (if needed in future)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateStatus") {
    // Handle status updates from content script
    console.log("Status update:", request.status);
  }

  return true; // Keep message channel open
});
