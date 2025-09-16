// CS:GO Demo Viewer for Faceit - Background Service Worker
console.log("CS:GO Demo Viewer background service worker loaded");

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details.reason);

  // Set default viewer URL if not already set
  chrome.storage.sync.get(["viewerUrl"], (result) => {
    if (!result.viewerUrl) {
      chrome.storage.sync.set(
        {
          viewerUrl: "http://localhost:3000",
        },
        () => {
          console.log("Default viewer URL set to localhost:3000");
        }
      );
    }
  });

  // Log welcome message for new installs
  if (details.reason === "install") {
    console.log("CS:GO Demo Viewer Extension installed! Visit a Faceit match page to see the demo viewer button.");
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background received message:", request);

  switch (request.action) {
    case "getDemoViewerUrl":
      chrome.storage.sync.get(["viewerUrl"], (result) => {
        sendResponse({
          viewerUrl: result.viewerUrl || "http://localhost:3000",
        });
      });
      return true; // Keep message channel open for async response

    case "openDemoViewer":
      const { demoUrl, viewerUrl } = request;
      const playerUrl = `${viewerUrl}/player?platform=upload&matchId=${encodeURIComponent(
        demoUrl
      )}`;

      chrome.tabs.create({ url: playerUrl }, (tab) => {
        console.log("Opened demo viewer in new tab:", tab.id);
        sendResponse({ success: true, tabId: tab.id });
      });
      return true;

    case "logActivity":
      console.log("Activity log:", request.message);
      break;

    default:
      console.log("Unknown message action:", request.action);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked on tab:", tab.url);

  // Check if we're on a Faceit page
  if (tab.url && tab.url.includes("faceit.com")) {
    // Send message to content script to try injecting button
    chrome.tabs.sendMessage(tab.id, { action: "injectButton" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log(
          "Could not communicate with content script:",
          chrome.runtime.lastError.message
        );
      }
    });
  }
});

// Monitor tab updates to detect navigation to Faceit pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("faceit.com/")
  ) {
    console.log("Faceit page loaded:", tab.url);

    // Small delay to ensure page is fully loaded
    setTimeout(() => {
      chrome.tabs.sendMessage(tabId, { action: "pageLoaded" }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be ready yet, that's okay
          console.log("Content script not ready yet");
        }
      });
    }, 1000);
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension startup");
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log("Storage changed:", changes, namespace);

  if (changes.viewerUrl) {
    console.log("Viewer URL updated:", changes.viewerUrl.newValue);

    // Notify all content scripts about the URL change
    chrome.tabs.query({ url: "*://*.faceit.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "viewerUrlChanged",
            newUrl: changes.viewerUrl.newValue,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // Tab might not have content script, that's okay
            }
          }
        );
      });
    });
  }
});
