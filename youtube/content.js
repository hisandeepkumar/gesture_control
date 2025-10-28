// Inject gesture control into YouTube
(function() {
  'use strict';
  
  // Check if already injected
  if (window.gestureControlInjected) return;
  window.gestureControlInjected = true;
  
  // Wait for YouTube player to load
  function waitForPlayer() {
    const video = document.querySelector('video');
    if (video && video.readyState > 0) {
      injectGestureControl();
    } else {
      setTimeout(waitForPlayer, 500);
    }
  }
  
  function injectGestureControl() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    document.head.appendChild(script);
    
    console.log('YouTube Gesture Control: Injected successfully');
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGestures') {
      window.postMessage({
        type: 'TOGGLE_GESTURES',
        enabled: request.enabled
      }, '*');
    }
    if (request.action === 'getStatus') {
      window.postMessage({type: 'GET_STATUS'}, '*');
    }
  });
  
  // Listen for status updates
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GESTURE_STATUS') {
      chrome.runtime.sendMessage({
        action: 'statusUpdate',
        enabled: event.data.enabled
      });
    }
  });
  
  // Start waiting for YouTube player
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForPlayer);
  } else {
    waitForPlayer();
  }
})();
