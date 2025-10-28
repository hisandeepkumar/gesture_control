// YouTube Keyboard Gestures - Final Working Version
(function() {
  'use strict';
  
  console.log('🎬 YouTube Keyboard Gestures: Loading final version...');
  
  class YouTubeKeyboardGestures {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.notification = null;
      this.isFullscreen = false;
      
      // Cooldown to prevent multiple rapid actions
      this.lastActionTime = 0;
      this.ACTION_COOLDOWN = 300;
      
      this.init();
    }
    
    async init() {
      this.createNotification();
      await this.waitForYouTube();
      this.setupKeyboardGestures();
      
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
      });
      
      this.showNotification('Keyboard Gestures Ready!', '⌨️');
    }
    
    createNotification() {
      // Remove existing notification
      const existing = document.getElementById('yt-keyboard-gestures');
      if (existing) existing.remove();
      
      // Create notification element
      this.notification = document.createElement('div');
      this.notification.id = 'yt-keyboard-gestures';
      
      // Apply styles directly
      this.notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-100px);
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        color: white;
        padding: 12px 24px;
        border-radius: 25px;
        font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        z-index: 10000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        border: 1px solid rgba(255,255,255,0.3);
      `;
      
      // Create emoji element
      const emoji = document.createElement('span');
      emoji.className = 'gesture-emoji';
      emoji.textContent = '⌨️';
      emoji.style.fontSize = '16px';
      
      // Create message element
      const message = document.createElement('span');
      message.className = 'gesture-message';
      message.textContent = 'Keyboard Gestures Ready';
      
      this.notification.appendChild(emoji);
      this.notification.appendChild(message);
      document.body.appendChild(this.notification);
    }
    
    showNotification(message, icon = '⌨️') {
      if (!this.notification) return;
      
      const messageEl = this.notification.querySelector('.gesture-message');
      const emojiEl = this.notification.querySelector('.gesture-emoji');
      
      if (messageEl) messageEl.textContent = message;
      if (emojiEl) emojiEl.textContent = icon;
      
      this.notification.style.opacity = '1';
      this.notification.style.transform = 'translateX(-50%) translateY(0)';
      
      setTimeout(() => {
        if (this.notification) {
          this.notification.style.opacity = '0';
          this.notification.style.transform = 'translateX(-50%) translateY(-100px)';
        }
      }, 2000);
    }
    
    async waitForYouTube() {
      return new Promise((resolve) => {
        const findVideo = () => {
          this.youtubeVideo = document.querySelector('video');
          if (this.youtubeVideo && this.youtubeVideo.readyState > 0) {
            console.log('✅ YouTube video found');
            resolve();
          } else {
            setTimeout(findVideo, 500);
          }
        };
        findVideo();
      });
    }
    
    setupKeyboardGestures() {
      console.log('⌨️ Setting up keyboard gestures...');
      
      document.addEventListener('keydown', (e) => {
        if (!this.GESTURES_ENABLED || !this.youtubeVideo) return;
        
        const now = Date.now();
        if (now - this.lastActionTime < this.ACTION_COOLDOWN) return;
        
        // Handle our gesture keys
        switch(e.key) {
          case ' ':
            // Space = Play/Pause (Open Hand Gesture)
            e.preventDefault();
            e.stopPropagation();
            this.togglePlayPause();
            this.lastActionTime = now;
            break;
            
          case 'ArrowLeft':
            // Left Arrow = Seek Backward (Left Pinch Gesture)
            e.preventDefault();
            e.stopPropagation();
            this.seekVideo(-10);
            this.showNotification('Left Gesture ← -10s', '⏪');
            this.lastActionTime = now;
            break;
            
          case 'ArrowRight':
            // Right Arrow = Seek Forward (Right Pinch Gesture)
            e.preventDefault();
            e.stopPropagation();
            this.seekVideo(10);
            this.showNotification('Right Gesture → +10s', '⏩');
            this.lastActionTime = now;
            break;
            
          case 'ArrowUp':
            // Up Arrow = Volume Up (Right Pinch Up)
            e.preventDefault();
            e.stopPropagation();
            this.adjustVolume(0.1);
            this.showNotification('Up Gesture ↑ Volume +', '🔊');
            this.lastActionTime = now;
            break;
            
          case 'ArrowDown':
            // Down Arrow = Volume Down (Right Pinch Down)
            e.preventDefault();
            e.stopPropagation();
            this.adjustVolume(-0.1);
            this.showNotification('Down Gesture ↓ Volume -', '🔈');
            this.lastActionTime = now;
            break;
            
          case 'f':
          case 'F':
            // F Key = Toggle Fullscreen (Both Fists Gesture)
            e.preventDefault();
            e.stopPropagation();
            this.toggleFullscreen();
            this.lastActionTime = now;
            break;
            
          case 'm':
          case 'M':
            // M Key = Toggle Mute
            e.preventDefault();
            e.stopPropagation();
            this.toggleMute();
            this.lastActionTime = now;
            break;
        }
      });
      
      console.log('✅ Keyboard gestures setup complete');
    }
    
    // === GESTURE ACTIONS ===
    
    togglePlayPause() {
      if (this.youtubeVideo.paused) {
        this.youtubeVideo.play();
        this.showNotification('Play Gesture (Space)', '▶️');
      } else {
        this.youtubeVideo.pause();
        this.showNotification('Pause Gesture (Space)', '⏸️');
      }
    }
    
    seekVideo(seconds) {
      this.youtubeVideo.currentTime += seconds;
      
      // Show remaining time
      const remaining = Math.floor(this.youtubeVideo.duration - this.youtubeVideo.currentTime);
      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;
      
      this.showNotification(
        `${seconds > 0 ? '+' : ''}${seconds}s (${minutes}:${secs.toString().padStart(2, '0')} left)`,
        seconds > 0 ? '⏩' : '⏪'
      );
    }
    
    adjustVolume(change) {
      this.youtubeVideo.volume = Math.max(0, Math.min(1, this.youtubeVideo.volume + change));
      this.showNotification(`Volume ${Math.round(this.youtubeVideo.volume * 100)}%`, '🔊');
    }
    
    toggleMute() {
      this.youtubeVideo.muted = !this.youtubeVideo.muted;
      this.showNotification(
        this.youtubeVideo.muted ? 'Muted 🔇' : 'Unmuted 🔊',
        this.youtubeVideo.muted ? '🔇' : '🔊'
      );
    }
    
    toggleFullscreen() {
      if (!this.isFullscreen) {
        // Enter fullscreen
        const videoContainer = this.youtubeVideo.closest('.html5-video-container') || this.youtubeVideo;
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.mozRequestFullScreen) {
          videoContainer.mozRequestFullScreen();
        }
        this.showNotification('Fullscreen Gesture (F)', '🖥️');
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
        this.showNotification('Normal Screen (F)', '📱');
      }
    }
    
    // === ADVANCED GESTURES USING KEY COMBINATIONS ===
    
    setupAdvancedGestures() {
      let doubleTapTimeout;
      let lastKeyPress = {};
      
      document.addEventListener('keydown', (e) => {
        if (!this.GESTURES_ENABLED) return;
        
        const key = e.key;
        const now = Date.now();
        
        // Double tap detection (rapid same key press)
        if (lastKeyPress[key] && now - lastKeyPress[key] < 300) {
          // Double tap detected
          clearTimeout(doubleTapTimeout);
          this.handleDoubleTap(key);
        } else {
          lastKeyPress[key] = now;
          doubleTapTimeout = setTimeout(() => {
            lastKeyPress[key] = 0;
          }, 300);
        }
        
        // Key combinations
        if (e.shiftKey) {
          switch(key) {
            case 'ArrowLeft':
              e.preventDefault();
              this.seekVideo(-30);
              this.showNotification('Shift + Left → -30s', '⏪⏪');
              break;
            case 'ArrowRight':
              e.preventDefault();
              this.seekVideo(30);
              this.showNotification('Shift + Right → +30s', '⏩⏩');
              break;
          }
        }
      });
    }
    
    handleDoubleTap(key) {
      switch(key) {
        case 'ArrowLeft':
          this.showNotification('Double Left Tap → -15s', '👈👈');
          this.seekVideo(-15);
          break;
        case 'ArrowRight':
          this.showNotification('Double Right Tap → +15s', '👉👉');
          this.seekVideo(15);
          break;
        case ' ':
          this.showNotification('Double Tap → Mini Player', '🎬');
          // Mini player toggle could be implemented here
          break;
      }
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      this.showNotification(
        enabled ? 'Keyboard Gestures Enabled' : 'Keyboard Gestures Disabled',
        enabled ? '✅' : '❌'
      );
    }
    
    cleanup() {
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
    
    gestureControl = new YouTubeKeyboardGestures();
    window.youtubeGestureControl = gestureControl;
  }
  
  // Message handling
  window.addEventListener('message', (event) => {
    if (event.data.type === 'TOGGLE_GESTURES' && gestureControl) {
      gestureControl.toggleGestures(event.data.enabled);
    }
  });
  
  // Start when page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGestureControl);
  } else {
    setTimeout(initializeGestureControl, 2000);
  }
  
  // Handle page navigation
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
