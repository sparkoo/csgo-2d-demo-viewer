// CS:GO Demo Viewer Extension Options Script
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Options page loaded");

  // Get DOM elements
  const viewerUrlInput = document.getElementById("viewerUrl");
  const autoInjectCheckbox = document.getElementById("autoInject");
  const showNotificationsCheckbox =
    document.getElementById("showNotifications");
  const buttonPositionSelect = document.getElementById("buttonPosition");
  const buttonTextInput = document.getElementById("buttonText");
  const debugModeCheckbox = document.getElementById("debugMode");
  const customSelectorsTextarea = document.getElementById("customSelectors");
  const versionSpan = document.getElementById("version");
  const saveButton = document.getElementById("saveButton");
  const resetButton = document.getElementById("resetButton");
  const testButton = document.getElementById("testButton");
  const statusDiv = document.getElementById("status");

  // Default settings
  const defaultSettings = {
    viewerUrl: "http://localhost:3000",
    autoInject: true,
    showNotifications: true,
    buttonPosition: "auto",
    buttonText: "View in Demo Viewer",
    debugMode: false,
    customSelectors: "",
  };

  // Load current settings
  await loadSettings();

  // Set version
  const manifest = chrome.runtime.getManifest();
  versionSpan.textContent = manifest.version;

  // Event listeners
  saveButton.addEventListener("click", saveSettings);
  resetButton.addEventListener("click", resetSettings);
  testButton.addEventListener("click", testConfiguration);

  // Auto-save on input changes (with debounce)
  let saveTimeout;
  const inputs = [
    viewerUrlInput,
    autoInjectCheckbox,
    showNotificationsCheckbox,
    buttonPositionSelect,
    buttonTextInput,
    debugModeCheckbox,
    customSelectorsTextarea,
  ];

  inputs.forEach((input) => {
    const eventType = input.type === "checkbox" ? "change" : "input";
    input.addEventListener(eventType, () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveSettings, 1000);
    });
  });

  // Load settings from storage
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(
        Object.keys(defaultSettings)
      );

      // Apply loaded settings or defaults
      viewerUrlInput.value = result.viewerUrl || defaultSettings.viewerUrl;
      autoInjectCheckbox.checked =
        result.autoInject !== undefined
          ? result.autoInject
          : defaultSettings.autoInject;
      showNotificationsCheckbox.checked =
        result.showNotifications !== undefined
          ? result.showNotifications
          : defaultSettings.showNotifications;
      buttonPositionSelect.value =
        result.buttonPosition || defaultSettings.buttonPosition;
      buttonTextInput.value = result.buttonText || defaultSettings.buttonText;
      debugModeCheckbox.checked =
        result.debugMode !== undefined
          ? result.debugMode
          : defaultSettings.debugMode;
      customSelectorsTextarea.value =
        result.customSelectors || defaultSettings.customSelectors;

      console.log("Settings loaded:", result);
      showStatus("Settings loaded", "info");
    } catch (error) {
      console.error("Error loading settings:", error);
      showStatus("Error loading settings", "error");
    }
  }

  // Save settings to storage
  async function saveSettings() {
    const url = viewerUrlInput.value.trim();

    // Validate URL
    if (url && !isValidUrl(url)) {
      showStatus("Please enter a valid URL", "error");
      return;
    }

    // Validate button text
    const buttonText = buttonTextInput.value.trim();
    if (!buttonText) {
      showStatus("Button text cannot be empty", "error");
      return;
    }

    const settings = {
      viewerUrl: url || defaultSettings.viewerUrl,
      autoInject: autoInjectCheckbox.checked,
      showNotifications: showNotificationsCheckbox.checked,
      buttonPosition: buttonPositionSelect.value,
      buttonText: buttonText,
      debugMode: debugModeCheckbox.checked,
      customSelectors: customSelectorsTextarea.value.trim(),
    };

    try {
      saveButton.classList.add("loading");
      saveButton.disabled = true;

      await chrome.storage.sync.set(settings);
      console.log("Settings saved:", settings);
      showStatus("Settings saved successfully!", "success");

      // Notify content scripts about settings change
      notifyContentScripts(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      showStatus("Error saving settings", "error");
    } finally {
      saveButton.classList.remove("loading");
      saveButton.disabled = false;
    }
  }

  // Reset settings to defaults
  async function resetSettings() {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) {
      return;
    }

    try {
      resetButton.disabled = true;

      // Clear storage and set defaults
      await chrome.storage.sync.clear();
      await chrome.storage.sync.set(defaultSettings);

      // Reload settings
      await loadSettings();

      showStatus("Settings reset to defaults", "success");
      console.log("Settings reset to defaults");
    } catch (error) {
      console.error("Error resetting settings:", error);
      showStatus("Error resetting settings", "error");
    } finally {
      resetButton.disabled = false;
    }
  }

  // Test configuration
  async function testConfiguration() {
    const url = viewerUrlInput.value.trim();

    if (!url) {
      showStatus("Please enter a viewer URL first", "error");
      return;
    }

    if (!isValidUrl(url)) {
      showStatus("Please enter a valid URL", "error");
      return;
    }

    try {
      testButton.disabled = true;
      testButton.textContent = "Testing...";
      showStatus("Testing configuration...", "info");

      // Test if the URL is accessible
      const testUrl = `${url}/`;
      const response = await fetch(testUrl, {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-cache",
      });

      showStatus(
        "Configuration test completed. Check browser console for details.",
        "success"
      );
      console.log("Test URL response:", response);

      // Try to open a test tab
      chrome.tabs.create(
        {
          url: testUrl,
          active: false,
        },
        (tab) => {
          setTimeout(() => {
            chrome.tabs.remove(tab.id);
          }, 2000);
        }
      );
    } catch (error) {
      console.log(
        "Test completed (network error expected for localhost):",
        error
      );
      showStatus(
        "Test completed. If using localhost, make sure your demo viewer is running.",
        "info"
      );
    } finally {
      testButton.disabled = false;
      testButton.textContent = "Test Configuration";
    }
  }

  // Validate URL
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Show status message
  function showStatus(message, type = "info") {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;

    // Clear status after 5 seconds for success/error messages
    if (type === "success" || type === "error") {
      setTimeout(() => {
        statusDiv.textContent = "";
        statusDiv.className = "status";
      }, 5000);
    }
  }

  // Notify content scripts about settings changes
  function notifyContentScripts(settings) {
    chrome.tabs.query({ url: "*://*.faceit.com/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "settingsUpdated",
            settings: settings,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // Content script might not be ready, that's okay
              console.log("Could not notify content script on tab:", tab.id);
            }
          }
        );
      });
    });
  }

  // Handle keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          saveSettings();
          break;
        case "r":
          if (e.shiftKey) {
            e.preventDefault();
            resetSettings();
          }
          break;
      }
    }
  });

  // Listen for storage changes from other parts of the extension
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "sync") {
      console.log("Storage changed externally:", changes);
      // Reload settings if changed externally
      setTimeout(loadSettings, 100);
    }
  });

  // Show initial status
  showStatus("Ready", "info");
});

// Handle page unload
window.addEventListener("beforeunload", () => {
  console.log("Options page closing");
});
