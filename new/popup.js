document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');
  
  let gesturesEnabled = true;
  
  toggleBtn.addEventListener('click', () => {
    gesturesEnabled = !gesturesEnabled;
    
    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('youtube.com')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleGestures',
          enabled: gesturesEnabled
        });
      }
    });
    
    updateUI();
  });
  
  function updateUI() {
    statusText.textContent = gesturesEnabled ? 'ON' : 'OFF';
    statusText.style.color = gesturesEnabled ? '#0f0' : '#f00';
    toggleBtn.textContent = gesturesEnabled ? 'Disable Gestures' : 'Enable Gestures';
    toggleBtn.className = gesturesEnabled ? 'toggle' : 'toggle off';
  }
  
  updateUI();
});
