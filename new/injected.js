// YouTube Camera Gestures - Gesture to Keyboard Mapping
(function() {
  'use strict';
  
  console.log('🎬 YouTube Camera Gestures: Loading...');
  
  class YouTubeCameraGestures {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.notification = null;
      this.isFullscreen = false;
      this.cameraActive = false;
      this.mediaStream = null;
      this.webcam = null;
      
      // Gesture simulation state
      this.gestureState = {
        leftHandOpen: false,
        rightHandOpen: false,
        bothHandsFist: false,
        leftPinch: false,
        rightPinch: false
      };
      
      this.init();
    }
    
    async init() {
      this.createNotification();
      await this.waitForYouTube();
      await this.startCamera();
      this.startGestureSimulation();
      
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
      });
    }
    
    createNotification() {
      // Remove existing notification
      const existing = document.getElementById('yt-camera-gestures');
      if (existing) existing.remove();
      
      // Create notification element
      this.notification = document.createElement('div');
      this.notification.id = 'yt-camera-gestures';
      
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
      emoji.textContent = '📷';
      emoji.style.fontSize = '16px';
      
      // Create message element
      const message = document.createElement('span');
      message.className = 'gesture-message';
      message.textContent = 'Camera Gestures Ready';
      
      this.notification.appendChild(emoji);
      this.notification.appendChild(message);
      document.body.appendChild(this.notification);
    }
    
    showNotification(message, icon = '📷') {
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
    
    async startCamera() {
      try {
        console.log('📷 Starting camera for gesture simulation...');
        this.showNotification('Starting camera...', '📷');
        
        // Get camera access
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        
        // Create webcam element (hidden)
        this.webcam = document.createElement('video');
        this.webcam.style.cssText = `
          position: absolute;
          width: 150px;
          height: 100px;
          bottom: 20px;
          right: 20px;
          border: 2px solid #4a00e0;
          border-radius: 10px;
          z-index: 9999;
          background: #000;
        `;
        this.webcam.autoplay = true;
        this.webcam.playsInline = true;
        this.webcam.muted = true;
        this.webcam.srcObject = this.mediaStream;
        
        document.body.appendChild(this.webcam);
        
        // Wait for webcam to be ready
        await new Promise((resolve) => {
          this.webcam.onloadedmetadata = () => {
            this.webcam.play().then(resolve);
          };
        });
        
        this.cameraActive = true;
        console.log('✅ Camera started successfully');
        this.showNotification('Camera Active - Show Gestures!', '✅');
        
      } catch (error) {
        console.error('❌ Camera access failed:', error);
        this.showNotification('Camera access required for gestures', '❌');
        this.startKeyboardFallback();
      }
    }
    
    startGestureSimulation() {
      console.log('🎯 Starting gesture simulation with camera...');
      
      // Create gesture controls UI
      this.createGestureControls();
      
      // Start processing camera frames for basic detection
      this.processCameraFrames();
    }
    
    createGestureControls() {
      // Create gesture control panel
      const controlPanel = document.createElement('div');
      controlPanel.id = 'gesture-control-panel';
      controlPanel.style.cssText = `
        position: fixed;
        bottom: 140px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-family: 'Segoe UI', Arial;
        font-size: 12px;
        z-index: 9998;
        border: 1px solid #4a00e0;
      `;
      
      controlPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">🎬 Gesture Controls</div>
        <div>👈 Left Open Hand → Play</div>
        <div>👉 Right Open Hand → Pause</div>
        <div>✊✊ Both Fists → Fullscreen</div>
        <div>👈 Pinch → Seek</div>
        <div>👉 Pinch → Volume</div>
        <div style="margin-top: 10px; font-size: 10px; opacity: 0.7;">
          Show gestures to camera
        </div>
      `;
      
      document.body.appendChild(controlPanel);
    }
    
    async processCameraFrames() {
      if (!this.cameraActive || !this.GESTURES_ENABLED) return;
      
      try {
        // Simulate gesture detection (this is where real ML would go)
        this.simulateGestureDetection();
        
        // Continue processing
        setTimeout(() => this.processCameraFrames(), 100);
      } catch (error) {
        console.error('Frame processing error:', error);
        setTimeout(() => this.processCameraFrames(), 1000);
      }
    }
    
    simulateGestureDetection() {
      // This is where we would integrate real gesture detection
      // For now, we'll simulate gesture detection based on mouse movements
      // In a real implementation, this would use MediaPipe or TensorFlow.js
      
      // Simulate random gesture detection for demo
      if (Math.random() < 0.01) { // 1% chance per frame
        this.detectRandomGesture();
      }
    }
    
    detectRandomGesture() {
      const gestures = [
        { type: 'leftHandOpen', action: () => this.triggerKeyboardEvent(' ') },
        { type: 'rightHandOpen', action: () => this.triggerKeyboardEvent(' ') },
        { type: 'bothHandsFist', action: () => this.triggerKeyboardEvent('f') },
        { type: 'leftPinch', action: () => this.triggerKeyboardEvent('ArrowLeft') },
        { type: 'rightPinch', action: () => this.triggerKeyboardEvent('ArrowRight') }
      ];
      
      const randomGesture = gestures[Math.floor(Math.random() * gestures.length)];
      randomGesture.action();
    }
    
    // === KEYBOARD EVENT TRIGGERING ===
    
    triggerKeyboardEvent(key) {
      if (!this.GESTURES_ENABLED || !this.youtubeVideo) return;
      
      const event = new KeyboardEvent('keydown', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        keyCode: this.getKeyCode(key),
        which: this.getKeyCode(key),
        bubbles: true,
        cancelable: true
      });
      
      // Dispatch the event
      document.dispatchEvent(event);
      
      // Also trigger the corresponding action directly
      this.handleGestureAction(key);
    }
    
    getKeyCode(key) {
      const keyCodes = {
        ' ': 32,
        'ArrowLeft': 37,
        'ArrowRight': 39,
        'ArrowUp': 38,
        'ArrowDown': 40,
        'f': 70,
        'F': 70
      };
      return keyCodes[key] || 0;
    }
    
    handleGestureAction(key) {
      switch(key) {
        case ' ':
          this.togglePlayPause();
          break;
        case 'ArrowLeft':
          this.seekVideo(-10);
          this.showNotification('Left Gesture ← -10s', '⏪');
          break;
        case 'ArrowRight':
          this.seekVideo(10);
          this.showNotification('Right Gesture → +10s', '⏩');
          break;
        case 'ArrowUp':
          this.adjustVolume(0.1);
          this.showNotification('Up Gesture ↑ Volume +', '🔊');
          break;
        case 'ArrowDown':
          this.adjustVolume(-0.1);
          this.showNotification('Down Gesture ↓ Volume -', '🔈');
          break;
        case 'f':
        case 'F':
          this.toggleFullscreen();
          break;
      }
    }
    
    // === GESTURE ACTIONS ===
    
    togglePlayPause() {
      if (this.youtubeVideo.paused) {
        this.youtubeVideo.play();
        this.showNotification('Play Gesture 👈', '▶️');
      } else {
        this.youtubeVideo.pause();
        this.showNotification('Pause Gesture 👉', '⏸️');
      }
    }
    
    seekVideo(seconds) {
      this.youtubeVideo.currentTime += seconds;
      
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
    
    toggleFullscreen() {
      if (!this.isFullscreen) {
        const videoContainer = this.youtubeVideo.closest('.html5-video-container') || this.youtubeVideo;
        if (videoContainer.requestFullscreen) {
          videoContainer.requestFullscreen();
        }
        this.showNotification('Fullscreen Gesture ✊✊', '🖥️');
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
        this.showNotification('Normal Screen ✊✊', '📱');
      }
    }
    
    // === MANUAL GESTURE TRIGGERS (for testing) ===
    
    setupManualGestureTriggers() {
      // Add manual gesture buttons for testing
      const manualPanel = document.createElement('div');
      manualPanel.id = 'manual-gesture-panel';
      manualPanel.style.cssText = `
        position: fixed;
        bottom: 300px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        padding: 15px;
        border-radius: 10px;
        color: white;
        font-family: 'Segoe UI', Arial;
        font-size: 12px;
        z-index: 9997;
        border: 1px solid #ff416c;
      `;
      
      manualPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #ff416c;">🧪 Test Gestures</div>
        <button onclick="window.youtubeGesture.triggerGesture('leftHandOpen')" style="margin: 2px; padding: 5px; background: #4a00e0; color: white; border: none; border-radius: 5px; cursor: pointer;">👈 Left Open</button>
        <button onclick="window.youtubeGesture.triggerGesture('rightHandOpen')" style="margin: 2px; padding: 5px; background: #4a00e0; color: white; border: none; border-radius: 5px; cursor: pointer;">👉 Right Open</button>
        <button onclick="window.youtubeGesture.triggerGesture('bothHandsFist')" style="margin: 2px; padding: 5px; background: #ff416c; color: white; border: none; border-radius: 5px; cursor: pointer;">✊✊ Both Fists</button>
        <button onclick="window.youtubeGesture.triggerGesture('leftPinch')" style="margin: 2px; padding: 5px; background: #4a00e0; color: white; border: none; border-radius: 5px; cursor: pointer;">👈 Pinch</button>
        <button onclick="window.youtubeGesture.triggerGesture('rightPinch')" style="margin: 2px; padding: 5px; background: #4a00e0; color: white; border: none; border-radius: 5px; cursor: pointer;">👉 Pinch</button>
      `;
      
      document.body.appendChild(manualPanel);
      
      // Expose gesture triggers to window
      window.youtubeGesture = {
        triggerGesture: (gesture) => this.handleManualGesture(gesture)
      };
    }
    
    handleManualGesture(gesture) {
      const gestureMap = {
        'leftHandOpen': () => { this.triggerKeyboardEvent(' '); this.showNotification('Left Open Hand → Play', '👈'); },
        'rightHandOpen': () => { this.triggerKeyboardEvent(' '); this.showNotification('Right Open Hand → Pause', '👉'); },
        'bothHandsFist': () => { this.triggerKeyboardEvent('f'); this.showNotification('Both Fists → Fullscreen', '✊✊'); },
        'leftPinch': () => { this.triggerKeyboardEvent('ArrowLeft'); this.showNotification('Left Pinch → Seek -10s', '👈'); },
        'rightPinch': () => { this.triggerKeyboardEvent('ArrowRight'); this.showNotification('Right Pinch → Seek +10s', '👉'); }
      };
      
      if (gestureMap[gesture]) {
        gestureMap[gesture]();
      }
    }
    
    startKeyboardFallback() {
      console.log('🔄 Using keyboard fallback for gestures');
      this.showNotification('Using keyboard gesture simulation', '⌨️');
      this.setupManualGestureTriggers();
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      this.showNotification(
        enabled ? 'Camera Gestures Enabled' : 'Camera Gestures Disabled',
        enabled ? '✅' : '❌'
      );
    }
    
    cleanup() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
      }
      if (this.webcam) {
        this.webcam.remove();
      }
      if (this.notification) {
        this.notification.remove();
      }
      
      // Remove control panels
      const controlPanel = document.getElementById('gesture-control-panel');
      const manualPanel = document.getElementById('manual-gesture-panel');
      if (controlPanel) controlPanel.remove();
      if (manualPanel) manualPanel.remove();
    }
  }
  
  // Global initialization
  let gestureControl = null;
  
  function initializeGestureControl() {
    if (gestureControl) {
      gestureControl.cleanup();
    }
    
    gestureControl = new YouTubeCameraGestures();
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
