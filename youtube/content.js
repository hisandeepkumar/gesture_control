// YouTube Gesture Control - Content Script
(function() {
  'use strict';
  
  console.log('🎬 YouTube Gesture Control: Loading content script...');
  
  if (window.gestureControlLoaded) return;
  window.gestureControlLoaded = true;
  
  function injectMainScript() {
    if (document.getElementById('youtube-gesture-script')) return;
    
    const script = document.createElement('script');
    script.id = 'youtube-gesture-script';
    script.src = chrome.runtime.getURL('injected.js');
    
    script.onload = function() {
      console.log('✅ Gesture control script loaded successfully');
      this.remove();
    };
    
    script.onerror = function() {
      console.error('❌ Failed to load gesture control script');
      this.remove();
    };
    
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Inject when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMainScript);
  } else {
    injectMainScript();
  }
  
  // Handle popup messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGestures') {
      window.postMessage({
        type: 'GESTURE_TOGGLE',
        enabled: request.enabled
      }, '*');
      sendResponse({ status: 'success' });
    }
    return true;
  });
  
})();
