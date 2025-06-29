// Popup script for Darker Chrome extension.

interface DarkModeStatus {
  enabled: boolean;
  hostname: string;
}

// DOM elements.
const darkModeToggle = document.getElementById(
  "darkModeToggle"
) as HTMLInputElement;
const hostnameText = document.getElementById("hostnameText") as HTMLSpanElement;

// Get current tab and check dark mode status.
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab?.id) return;

  // Get current hostname.
  const url = new URL(tab.url || "");
  const hostname = url.hostname;

  // Update UI with hostname.
  hostnameText.textContent = hostname;

  // Check current dark mode status.
  chrome.storage.sync.get([hostname], (result) => {
    const isEnabled = result[hostname] ?? false;
    darkModeToggle.checked = isEnabled;
  });
});

// Handle toggle change.
darkModeToggle.addEventListener("change", async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return;

  const url = new URL(tab.url || "");
  const hostname = url.hostname;

  // Get the new state from the toggle.
  const newState = darkModeToggle.checked;

  // Save new state.
  chrome.storage.sync.set({ [hostname]: newState }, () => {
    // Send message to content script.
    chrome.tabs.sendMessage(
      tab.id!,
      {
        action: "toggleDarkMode",
        enabled: newState,
      },
      () => {
        // Toggle updated successfully.
      }
    );
  });
});
