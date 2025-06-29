// Background service worker for Darker Chrome extension.

// Handle extension installation.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Darker Chrome extension installed");
});

// Handle messages from content scripts and popup.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Pass through messages between popup and content script.
  // Keep message channel open for async responses.
  return true;
});
