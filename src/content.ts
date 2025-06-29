// Content script for Darker Chrome extension.
const DARK_MODE_ID = "darker-chrome-styles";

// Dark mode CSS rules.
const DARK_MODE_CSS = `
  html, img, video, iframe {
    filter: invert(1) !important;
  }
`;

// Get current hostname.
const hostname = window.location.hostname;

// Function to apply dark mode.
const applyDarkMode = (): void => {
  if (!document.getElementById(DARK_MODE_ID)) {
    const style = document.createElement("style");
    style.id = DARK_MODE_ID;
    style.textContent = DARK_MODE_CSS;
    (document.head || document.documentElement).appendChild(style);
  }
};

// Function to remove dark mode.
const removeDarkMode = (): void => {
  const existingStyle = document.getElementById(DARK_MODE_ID);
  if (existingStyle) {
    existingStyle.remove();
  }
};

// Function to toggle dark mode.
const toggleDarkMode = (enabled: boolean): void => {
  if (enabled) {
    applyDarkMode();
  } else {
    removeDarkMode();
  }
};

// Check initial state and apply if needed.
chrome.storage.sync.get([hostname], (result) => {
  const isEnabled = result[hostname] ?? false;
  toggleDarkMode(isEnabled);
});

// Listen for messages from popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleDarkMode") {
    toggleDarkMode(message.enabled);
    sendResponse({ success: true });
  }

  if (message.action === "getDarkModeStatus") {
    const isActive = !!document.getElementById(DARK_MODE_ID);
    sendResponse({ enabled: isActive, hostname });
  }
});

// Watch for navigation changes in SPAs.
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    // Re-check dark mode status on navigation.
    chrome.storage.sync.get([hostname], (result) => {
      const isEnabled = result[hostname] ?? false;
      toggleDarkMode(isEnabled);
    });
  }
}).observe(document, { subtree: true, childList: true });
