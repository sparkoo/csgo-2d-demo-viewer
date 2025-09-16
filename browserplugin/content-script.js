// CS:GO Demo Viewer for Faceit - Content Script
console.log("CS:GO Demo Viewer extension loaded on Faceit page");

// Configuration
const DEFAULT_VIEWER_URL = "http://localhost:3000";
let settings = {
  viewerUrl: DEFAULT_VIEWER_URL,
  autoInject: true,
  buttonText: "View in Demo Viewer",
  debugMode: false,
  customSelectors: "",
};

// Load settings from storage
chrome.storage.sync.get(Object.keys(settings), (result) => {
  settings = { ...settings, ...result };
  if (settings.debugMode) {
    console.log("CS:GO Demo Viewer settings loaded:", settings);
  }
});

// Listen for messages from popup and background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (settings.debugMode) {
    console.log("Content script received message:", request);
  }

  switch (request.action) {
    case "checkDemoAvailability":
      const demoUrl = findDemoUrl();
      sendResponse({ demoFound: !!demoUrl, demoUrl: demoUrl });
      break;

    case "injectButton":
      const injected = injectDemoViewerButton();
      sendResponse({ success: injected });
      break;

    case "settingsUpdated":
      settings = { ...settings, ...request.settings };
      if (settings.debugMode) {
        console.log("Settings updated:", settings);
      }
      // Re-inject button with new settings
      setTimeout(injectDemoViewerButton, 500);
      break;

    case "viewerUrlChanged":
      settings.viewerUrl = request.newUrl;
      break;

    case "pageLoaded":
      if (settings.autoInject) {
        setTimeout(injectDemoViewerButton, 1000);
      }
      break;
  }
});

// Function to find demo download links on the page
function findDemoUrl() {
  // Use custom selectors if provided
  let selectors = [
    'a[href*=".dem.gz"]',
    'a[href*="demo"]',
    'button[data-testid*="demo"]',
    ".demo-download",
    '[class*="demo"]',
  ];

  if (settings.customSelectors) {
    const customSels = settings.customSelectors
      .split("\n")
      .filter((s) => s.trim());
    selectors = [...customSels, ...selectors];
  }

  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        const href =
          element.href ||
          element.getAttribute("data-url") ||
          element.getAttribute("data-demo-url");
        if (href && href.includes(".dem.gz")) {
          if (settings.debugMode) {
            console.log("Found demo URL:", href, "using selector:", selector);
          }
          return href;
        }
      }
    } catch (error) {
      if (settings.debugMode) {
        console.warn("Invalid selector:", selector, error);
      }
    }
  }

  // Fallback: look for any link containing .dem.gz in the page
  const allLinks = document.querySelectorAll('a[href*=".dem.gz"]');
  if (allLinks.length > 0) {
    if (settings.debugMode) {
      console.log("Found demo URL via fallback:", allLinks[0].href);
    }
    return allLinks[0].href;
  }

  return null;
}

// Function to create and inject the demo viewer button
function createDemoViewerButton(demoUrl) {
  // Check if button already exists
  const existingButton = document.getElementById("csgo-demo-viewer-btn");
  if (existingButton) {
    existingButton.remove(); // Remove old button to recreate with new settings
  }

  const button = document.createElement("button");
  button.id = "csgo-demo-viewer-btn";
  button.className = "csgo-demo-viewer-button";
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z"/>
    </svg>
    ${settings.buttonText}
  `;

  button.addEventListener("click", () => {
    const playerUrl = `${
      settings.viewerUrl
    }/player?platform=upload&matchId=${encodeURIComponent(demoUrl)}`;
    if (settings.debugMode) {
      console.log("Opening demo viewer:", playerUrl);
    }
    window.open(playerUrl, "_blank");
  });

  return button;
}

// Function to find the best place to inject the button
function findButtonContainer() {
  // Try to find common container elements on Faceit match pages
  const containerSelectors = [
    ".match-header-actions",
    ".room-header-actions",
    ".match-actions",
    ".room-actions",
    '[class*="header"]',
    '[class*="action"]',
    ".room-overview-header",
    ".match-overview-header",
  ];

  for (const selector of containerSelectors) {
    const container = document.querySelector(selector);
    if (container) {
      console.log("Found button container:", selector);
      return container;
    }
  }

  // Fallback: create our own container
  const fallbackContainer = document.createElement("div");
  fallbackContainer.className = "csgo-demo-viewer-container";
  fallbackContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.8);
    padding: 10px;
    border-radius: 5px;
  `;

  document.body.appendChild(fallbackContainer);
  console.log("Created fallback container");
  return fallbackContainer;
}

// Main function to inject the demo viewer button
function injectDemoViewerButton() {
  const demoUrl = findDemoUrl();

  if (!demoUrl) {
    if (settings.debugMode) {
      console.log("No demo URL found on this page");
    }
    return false;
  }

  const button = createDemoViewerButton(demoUrl);
  const container = findButtonContainer();

  if (button && container) {
    container.appendChild(button);
    if (settings.debugMode) {
      console.log("Demo viewer button injected successfully");
    }
    return true;
  }

  return false;
}

// Function to observe page changes (for SPA navigation)
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldReinject = false;

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        shouldReinject = true;
      }
    });

    if (shouldReinject) {
      setTimeout(injectDemoViewerButton, 1000); // Delay to let page load
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize the extension
function init() {
  if (settings.debugMode) {
    console.log("Initializing CS:GO Demo Viewer extension");
  }

  // Initial injection if auto-inject is enabled
  if (settings.autoInject) {
    setTimeout(injectDemoViewerButton, 2000); // Wait for page to load
  }

  // Set up observer for SPA navigation
  observePageChanges();

  // Re-inject on URL changes (for SPA)
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      if (settings.debugMode) {
        console.log("URL changed, re-injecting button");
      }
      if (settings.autoInject) {
        setTimeout(injectDemoViewerButton, 2000);
      }
    }
  }, 1000);
}

// Start the extension when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
