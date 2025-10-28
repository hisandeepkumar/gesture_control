// Background script for YouTube Gesture Control
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Gesture Control extension installed');
});

// Handle extension icon click to refresh the page
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('youtube.com')) {
    chrome.tabs.reload(tab.id);
  }
});
