document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('status-text');
  const toggleBtn = document.getElementById('toggle-btn');
  const webcamBtn = document.getElementById('webcam-btn');
  const webcamStatus = document.getElementById('webcam-status');
  let gesturesEnabled = true;
  
  // Get current status from active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]?.url?.includes('youtube.com')) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getStatus'});
      checkWebcamStatus();
    } else {
      statusText.textContent = 'YouTube Only';
      statusText.style.color = '#FF6B6B';
      toggleBtn.disabled = true;
      webcamBtn.disabled = true;
      toggleBtn.textContent = 'Open YouTube';
      webcamStatus.innerHTML = '📷 Webcam: Open YouTube first';
    }
  });
  
  // Listen for status updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'statusUpdate') {
      gesturesEnabled = request.enabled;
      updateUI();
    }
    if (request.action === 'webcamStatus') {
      updateWebcamStatus(request.status, request.error);
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
  
  // Webcam check button
  webcamBtn.addEventListener('click', () => {
    checkWebcamStatus();
  });
  
  function checkWebcamStatus() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]?.url?.includes('youtube.com')) {
        webcamStatus.innerHTML = '📷 Webcam: Checking...';
        webcamStatus.className = 'webcam-status inactive';
        chrome.tabs.sendMessage(tabs[0].id, {action: 'checkWebcam'});
      }
    });
  }
  
  function updateWebcamStatus(status, error = null) {
    let statusText = 'Unknown';
    let statusClass = 'inactive';
    
    switch(status) {
      case 'active':
        statusText = 'Active ✅';
        statusClass = 'active';
        break;
      case 'inactive':
        statusText = 'Inactive ❌';
        statusClass = 'inactive';
        break;
      case 'error':
        statusText = `Error: ${error || 'Unknown'}`;
        statusClass = 'inactive';
        break;
      default:
        statusText = 'Checking...';
    }
    
    webcamStatus.innerHTML = `📷 Webcam: ${statusText}`;
    webcamStatus.className = `webcam-status ${statusClass}`;
  }
  
  function updateUI() {
    statusText.textContent = gesturesEnabled ? 'ON' : 'OFF';
    statusText.style.color = gesturesEnabled ? '#90EE90' : '#FF6B6B';
    toggleBtn.textContent = gesturesEnabled ? 'Disable Gestures' : 'Enable Gestures';
    toggleBtn.style.background = gesturesEnabled ? 
      'rgba(255, 255, 255, 0.9)' : 'rgba(255, 107, 107, 0.9)';
  }
  
  // Initialize UI
  updateUI();
  checkWebcamStatus();
});
