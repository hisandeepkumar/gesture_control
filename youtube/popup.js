document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');
  let gesturesEnabled = true;
  
  // Get current status from active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]?.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getStatus'});
    } else {
      statusText.textContent = 'YouTube Only';
      statusText.style.color = '#FF6B6B';
      toggleBtn.disabled = true;
      toggleBtn.textContent = 'Open YouTube';
    }
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
    if (toggleBtn.disabled) {
      chrome.tabs.create({url: 'https://youtube.com'});
      return;
    }
    
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
    toggleBtn.style.background = gesturesEnabled ? 
      'rgba(255, 255, 255, 0.9)' : 'rgba(255, 107, 107, 0.9)';
  }
  
  // Initialize UI
  updateUI();
});
