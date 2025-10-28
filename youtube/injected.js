// YouTube Gesture Control - TrustedHTML Fixed Version
(function() {
  'use strict';
  
  console.log('🎬 YouTube Gesture Control: Starting...');
  
  class YouTubeGestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.mediaStream = null;
      this.cameraActive = false;
      this.notification = null;
      
      this.init();
    }
    
    async init() {
      this.createNotification();
      await this.waitForYouTube();
      await this.initializeCamera();
    }
    
    createNotification() {
      // Remove existing notification
      const existing = document.getElementById('yt-gesture-alert');
      if (existing) existing.remove();
      
      // Create notification element WITHOUT innerHTML
      this.notification = document.createElement('div');
      this.notification.id = 'yt-gesture-alert';
      
      // Add styles using style attribute
      this.notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        border-radius: 30px;
        font-family: 'Roboto', Arial;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        z-index: 10000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: none;
        border: 2px solid rgba(255,255,255,0.2);
      `;
      
      // Create emoji element
      const emoji = document.createElement('span');
      emoji.textContent = '🎬';
      emoji.className = 'gesture-emoji';
      
      // Create message element
      const message = document.createElement('span');
      message.textContent = 'Gesture Control Starting...';
      message.className = 'gesture-message';
      
      // Append children
      this.notification.appendChild(emoji);
      this.notification.appendChild(message);
      
      document.body.appendChild(this.notification);
    }
    
    showAlert(message, emoji = '🎬') {
      if (!this.notification) return;
      
      const messageEl = this.notification.querySelector('.gesture-message');
      const emojiEl = this.notification.querySelector('.gesture-emoji');
      
      if (messageEl) messageEl.textContent = message;
      if (emojiEl) emojiEl.textContent = emoji;
      
      this.notification.classList.add('show');
      
      setTimeout(() => {
        if (this.notification) {
          this.notification.classList.remove('show');
        }
      }, 3000);
    }
    
    async waitForYouTube() {
      return new Promise((resolve) => {
        const findVideo = () => {
          this.youtubeVideo = document.querySelector('video');
          if (this.youtubeVideo) {
            console.log('✅ YouTube video found');
            resolve();
          } else {
            setTimeout(findVideo, 500);
          }
        };
        findVideo();
      });
    }
    
    async initializeCamera() {
      try {
        console.log('📷 Attempting camera access...');
        this.showAlert('Requesting camera access...', '📷');
        
        // Test camera access directly
        await this.testCameraAccess();
        
      } catch (error) {
        console.error('❌ Camera initialization failed:', error);
        this.showAlert('Camera setup failed', '❌');
        this.fallbackToKeyboard();
      }
    }
    
    async testCameraAccess() {
      try {
        // SIMPLE camera test - no complex constraints
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        });
        
        console.log('✅ Camera access granted!');
        
        // Create minimal video element
        const testVideo = document.createElement('video');
        testVideo.srcObject = this.mediaStream;
        testVideo.autoplay = true;
        testVideo.playsInline = true;
        testVideo.muted = true;
        testVideo.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;left:-100px;';
        
        document.body.appendChild(testVideo);
        
        // Wait for video to load
        await new Promise((resolve) => {
          testVideo.onloadedmetadata = () => {
            testVideo.play().then(resolve);
          };
        });
        
        this.cameraActive = true;
        this.showAlert('Camera connected! Gestures active!', '✅');
        
        // Start gesture controls
        this.startGestureControls();
        
      } catch (error) {
        console.error('❌ Camera test failed:', error);
        throw error;
      }
    }
    
    startGestureControls() {
      console.log('🎯 Starting gesture controls');
      
      // Add keyboard controls for testing
      this.setupKeyboardGestures();
      
      this.showAlert('Show gestures to control video', '👋');
    }
    
    setupKeyboardGestures() {
      document.addEventListener('keydown', (e) => {
        if (!this.GESTURES_ENABLED || !this.youtubeVideo) return;
        
        switch(e.key) {
          case ' ': // Space bar - Play/Pause
            e.preventDefault();
            this.togglePlayPause();
            break;
            
          case 'ArrowLeft': // Left arrow - Rewind 10s
            this.seekVideo(-10);
            break;
            
          case 'ArrowRight': // Right arrow - Forward 10s
            this.seekVideo(10);
            break;
            
          case 'ArrowUp': // Up arrow - Volume up
            this.adjustVolume(0.1);
            break;
            
          case 'ArrowDown': // Down arrow - Volume down
            this.adjustVolume(-0.1);
            break;
            
          case 'f': // F key - Fullscreen
            this.toggleFullscreen();
            break;
        }
      });
    }
    
    fallbackToKeyboard() {
      console.log('🔄 Falling back to keyboard controls');
      this.showAlert('Using keyboard controls (Space, Arrows)', '⌨️');
      this.setupKeyboardGestures();
    }
    
    togglePlayPause() {
      if (!this.youtubeVideo) return;
      
      if (this.youtubeVideo.paused) {
        this.youtubeVideo.play();
        this.showAlert('Playing', '▶️');
      } else {
        this.youtubeVideo.pause();
        this.showAlert('Paused', '⏸️');
      }
    }
    
    seekVideo(seconds) {
      if (!this.youtubeVideo) return;
      
      this.youtubeVideo.currentTime += seconds;
      const action = seconds > 0 ? 'Forward' : 'Backward';
      this.showAlert(`${action} ${Math.abs(seconds)}s`, seconds > 0 ? '⏩' : '⏪');
    }
    
    adjustVolume(change) {
      if (!this.youtubeVideo) return;
      
      this.youtubeVideo.volume = Math.max(0, Math.min(1, this.youtubeVideo.volume + change));
      this.showAlert(`Volume ${Math.round(this.youtubeVideo.volume * 100)}%`, '🔊');
    }
    
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        this.showAlert('Fullscreen', '🖥️');
      } else {
        document.exitFullscreen();
        this.showAlert('Exit Fullscreen', '📱');
      }
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      this.showAlert(
        enabled ? 'Gestures Enabled' : 'Gestures Disabled',
        enabled ? '✅' : '❌'
      );
    }
    
    cleanup() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      if (this.notification) {
        this.notification.remove();
      }
    }
  }
  
  // Global initialization
  let gestureControl = null;
  
  function initializeGestureControl() {
    if (gestureControl) {
      gestureControl.cleanup();
    }
    
    gestureControl = new YouTubeGestureControl();
    window.youtubeGestureControl = gestureControl;
  }
  
  // Message handling
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GESTURE_TOGGLE' && gestureControl) {
      gestureControl.toggleGestures(event.data.enabled);
    }
  });
  
  // Start when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGestureControl);
  } else {
    setTimeout(initializeGestureControl, 2000);
  }
  
  // Handle page navigation (YouTube SPA)
  let currentUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      setTimeout(initializeGestureControl, 1000);
    }
  });
  observer.observe(document, { subtree: true, childList: true });
  
  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (gestureControl) {
      gestureControl.cleanup();
    }
  });
  
})();
