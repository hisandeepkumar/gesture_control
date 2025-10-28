// Content script to inject gesture control
(function() {
  'use strict';
  
  if (window.youtubeGestureControlInjected) return;
  window.youtubeGestureControlInjected = true;
  
  function injectGestureScript() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
      console.log('🎬 YouTube Camera Gestures: Script injected successfully');
    };
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Inject when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectGestureScript);
  } else {
    injectGestureScript();
  }
  
  // Handle YouTube navigation (SPA)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(injectGestureScript, 1000);
    }
  });
  observer.observe(document, { subtree: true, childList: true });
  
  // Handle popup messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleGestures') {
      window.postMessage({
        type: 'TOGGLE_GESTURES',
        enabled: request.enabled
      }, '*');
      sendResponse({ status: 'success' });
    }
    return true;
  });
})();
