// Inject gesture control into the page
(function() {
  'use strict';
  
  // Check if already injected
  if (window.gestureControlInjected) return;
  window.gestureControlInjected = true;
  
  // Create and inject the gesture control UI
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  document.head.appendChild(script);
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGestures') {
      window.postMessage({
        type: 'TOGGLE_GESTURES',
        enabled: request.enabled
      }, '*');
    }
    if (request.action === 'getStatus') {
      // Get status from injected script
      window.postMessage({type: 'GET_STATUS'}, '*');
    }
  });
  
  // Listen for status updates from injected script
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GESTURE_STATUS') {
      chrome.runtime.sendMessage({
        action: 'statusUpdate',
        enabled: event.data.enabled
      });
    }
  });
})();
