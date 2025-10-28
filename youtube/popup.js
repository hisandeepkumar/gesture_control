document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');
  
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
    statusEl.textContent = gesturesEnabled ? 'Active' : 'Disabled';
    statusEl.style.color = gesturesEnabled ? '#90ff90' : '#ff9090';
    toggleBtn.textContent = gesturesEnabled ? 'Disable Gestures' : 'Enable Gestures';
    toggleBtn.style.background = gesturesEnabled ? 'white' : '#ff6b6b';
  }
  
  updateUI();
});
