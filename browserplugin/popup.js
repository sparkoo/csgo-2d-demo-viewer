// CS:GO Demo Viewer Extension Popup Script
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup loaded");

  // Get DOM elements
  const statusIndicator = document.getElementById("statusIndicator");
  const statusText = document.getElementById("statusText");
  const viewerUrlInput = document.getElementById("viewerUrl");
  const saveUrlButton = document.getElementById("saveUrl");
  const testButton = document.getElementById("testButton");
  const openOptionsButton = document.getElementById("openOptions");

  // Load current settings
  await loadSettings();

  // Check current tab status
  await checkCurrentTab();

  // Event listeners
  saveUrlButton.addEventListener("click", saveViewerUrl);
  testButton.addEventListener("click", testCurrentPage);
  openOptionsButton.addEventListener("click", openOptions);

  // Auto-save on input change (with debounce)
  let saveTimeout;
  viewerUrlInput.addEventListener("input", () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveViewerUrl, 1000);
  });

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(["viewerUrl"]);
      const url = result.viewerUrl || "http://localhost:3000";
      viewerUrlInput.value = url;
      console.log("Loaded viewer URL:", url);
    } catch (error) {
      console.error("Error loading settings:", error);
      showMessage("Error loading settings", "error");
    }
  }

  // Save viewer URL to storage
  async function saveViewerUrl() {
    const url = viewerUrlInput.value.trim();

    if (!url) {
      showMessage("Please enter a valid URL", "error");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      showMessage(
        "Please enter a valid URL (e.g., http://localhost:3000)",
        "error"
      );
      return;
    }

    try {
      await chrome.storage.sync.set({ viewerUrl: url });
      console.log("Saved viewer URL:", url);
      showMessage("Settings saved!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("Error saving settings", "error");
    }
  }

  // Check current tab status
  async function checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) {
        updateStatus("inactive", "No active tab");
        return;
      }

      console.log("Current tab URL:", tab.url);

      if (tab.url && tab.url.includes("faceit.com")) {
        updateStatus("checking", "Checking for demos...");

        // Try to communicate with content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            action: "checkDemoAvailability",
          });

          if (response && response.demoFound) {
            updateStatus("active", "Demo available on this page");
          } else {
            updateStatus("inactive", "No demo found on this page");
          }
        } catch (error) {
          console.log("Content script not ready or no response");
          updateStatus("inactive", "Extension not active on this page");
        }
      } else {
        updateStatus("inactive", "Not on a Faceit page");
      }
    } catch (error) {
      console.error("Error checking current tab:", error);
      updateStatus("inactive", "Error checking page");
    }
  }

  // Test current page functionality
  async function testCurrentPage() {
    testButton.textContent = "Testing...";
    testButton.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.url || !tab.url.includes("faceit.com")) {
        showMessage("Please navigate to a Faceit match page first", "error");
        return;
      }

      // Send message to content script to inject button
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "injectButton",
      });

      if (response && response.success) {
        showMessage("Button injected successfully!", "success");
        updateStatus("active", "Demo viewer button active");
      } else {
        showMessage("Could not inject button on this page", "error");
      }
    } catch (error) {
      console.error("Error testing page:", error);
      showMessage(
        "Error testing page. Make sure you're on a Faceit match page.",
        "error"
      );
    } finally {
      testButton.textContent = "Test Current Page";
      testButton.disabled = false;
    }
  }

  // Open options page
  function openOptions() {
    chrome.runtime.openOptionsPage();
    window.close();
  }

  // Update status indicator
  function updateStatus(status, text) {
    statusIndicator.className = `status-indicator ${status}`;
    statusText.textContent = text;
  }

  // Show message to user
  function showMessage(text, type = "success") {
    // Remove existing messages
    const existingMessages = document.querySelectorAll(".message");
    existingMessages.forEach((msg) => msg.remove());

    // Create new message
    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.textContent = text;

    // Insert after the save button
    saveUrlButton.parentNode.insertBefore(message, saveUrlButton.nextSibling);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.viewerUrl && namespace === "sync") {
      viewerUrlInput.value = changes.viewerUrl.newValue;
      console.log(
        "Viewer URL updated from storage:",
        changes.viewerUrl.newValue
      );
    }
  });

  // Refresh status when popup is focused
  window.addEventListener("focus", checkCurrentTab);

  // Handle tab updates
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
      setTimeout(checkCurrentTab, 500);
    }
  });
});

// Handle popup close
window.addEventListener("beforeunload", () => {
  console.log("Popup closing");
});
