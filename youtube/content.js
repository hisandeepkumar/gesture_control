// Inject gesture control into YouTube
(function() {
  'use strict';
  
  // Check if already injected
  if (window.gestureControlInjected) return;
  window.gestureControlInjected = true;
  
  let gestureScriptInjected = false;
  
  function waitForPlayer() {
    const video = document.querySelector('video');
    if (video) {
      if (!gestureScriptInjected) {
        injectGestureControl();
        gestureScriptInjected = true;
      }
    } else {
      setTimeout(waitForPlayer, 1000);
    }
  }
  
  function injectGestureControl() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    
    console.log('YouTube Gesture Control: Injected successfully');
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGestures') {
      window.postMessage({
        type: 'TOGGLE_GESTURES',
        enabled: request.enabled
      }, '*');
      sendResponse({status: 'success'});
    }
    if (request.action === 'getStatus') {
      window.postMessage({type: 'GET_STATUS'}, '*');
      sendResponse({status: 'success'});
    }
    if (request.action === 'checkWebcam') {
      window.postMessage({type: 'CHECK_WEBCAM'}, '*');
      sendResponse({status: 'checking'});
    }
    return true;
  });
  
  // Listen for status updates
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GESTURE_STATUS') {
      chrome.runtime.sendMessage({
        action: 'statusUpdate',
        enabled: event.data.enabled
      });
    }
    if (event.data.type === 'WEBCAM_STATUS') {
      chrome.runtime.sendMessage({
        action: 'webcamStatus',
        status: event.data.status,
        error: event.data.error
      });
    }
  });
  
  // Start waiting for YouTube player
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForPlayer);
  } else {
    waitForPlayer();
  }
  
  // Re-inject when YouTube navigates (SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      gestureScriptInjected = false;
      setTimeout(waitForPlayer, 2000);
    }
  }).observe(document, {subtree: true, childList: true});
})();
