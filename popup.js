document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');
  let gesturesEnabled = true;
  
  // Get current status
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getStatus'});
  });
  
  // Listen for status updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'statusUpdate') {
      gesturesEnabled = request.enabled;
      updateUI();
    }
  });
  
  // Toggle button handler
  toggleBtn.addEventListener('click', () => {
    gesturesEnabled = !gesturesEnabled;
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'toggleGestures',
        enabled: gesturesEnabled
      });
    });
    
    updateUI();
  });
  
  function updateUI() {
    statusText.textContent = gesturesEnabled ? 'ON' : 'OFF';
    statusText.style.color = gesturesEnabled ? '#90EE90' : '#FF6B6B';
    toggleBtn.textContent = gesturesEnabled ? 'Disable Gestures' : 'Enable Gestures';
  }
  
  // Initialize UI
  updateUI();
});
