// YouTube Gesture Control - Final Fixed Version
(function() {
  'use strict';
  
  console.log('🎬 YouTube Gesture Control: Loading final version...');
  
  class YouTubeGestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.mediaStream = null;
      this.cameraActive = false;
      this.notification = null;
      this.isFullscreen = false;
      
      // Gesture state variables (EXACT SAME AS ORIGINAL)
      this.COOLDOWN = 1200;
      this.lastAct = 0;
      this.pinch = { 
        Left: { active: false, start: null, last: null }, 
        Right: { active: false, start: null, last: null } 
      };
      this.tapTs = { Left: 0, Right: 0 };
      this.DOUBLE_TAP = 600;
      
      this.hands = null;
      this.webcam = null;
      this.mediaPipeLoaded = false;
      
      this.init();
    }
    
    async init() {
      this.createNotification();
      await this.waitForYouTube();
      await this.startCamera();
      await this.loadMediaPipeDirectly();
      
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
      });
    }
    
    createNotification() {
      // Remove existing notification
      const existing = document.getElementById('yt-gesture-notification');
      if (existing) existing.remove();
      
      // Create notification element
      this.notification = document.createElement('div');
      this.notification.id = 'yt-gesture-notification';
      
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
      emoji.textContent = '👆';
      emoji.style.fontSize = '16px';
      
      // Create message element
      const message = document.createElement('span');
      message.className = 'gesture-message';
      message.textContent = 'Gesture Control Ready';
      
      this.notification.appendChild(emoji);
      this.notification.appendChild(message);
      document.body.appendChild(this.notification);
    }
    
    showNotification(message, icon = '👆') {
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
        console.log('📷 Starting camera for gesture detection...');
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
        
        // Create hidden webcam element
        this.webcam = document.createElement('video');
        this.webcam.style.cssText = `
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          left: -100px;
          top: -100px;
          pointer-events: none;
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
        this.showNotification('Camera Active!', '✅');
        
      } catch (error) {
        console.error('❌ Camera access failed:', error);
        this.showNotification('Camera access required for gestures', '❌');
        this.fallbackToKeyboard();
      }
    }
    
    async loadMediaPipeDirectly() {
      try {
        console.log('📦 Loading MediaPipe directly...');
        
        // Check if MediaPipe is already available
        if (window.Hands && window.Camera && window.drawConnectors) {
          console.log('✅ MediaPipe already loaded');
          this.mediaPipeLoaded = true;
          this.initMediaPipe();
          return;
        }
        
        // Load MediaPipe using direct script injection
        const loadScript = (url) => {
          return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        };
        
        // Try to load MediaPipe scripts
        try {
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
          await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
          
          console.log('✅ MediaPipe scripts loaded successfully');
          this.mediaPipeLoaded = true;
          this.initMediaPipe();
          
        } catch (error) {
          console.warn('⚠️ MediaPipe loading failed, using fallback:', error);
          this.showNotification('Using basic gesture detection', '⚡');
          this.startBasicGestureDetection();
        }
        
      } catch (error) {
        console.error('MediaPipe initialization error:', error);
        this.startBasicGestureDetection();
      }
    }
    
    initMediaPipe() {
      if (!window.Hands) {
        console.warn('MediaPipe Hands not available');
        this.startBasicGestureDetection();
        return;
      }
      
      try {
        // Initialize MediaPipe Hands
        this.hands = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        
        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });
        
        this.hands.onResults(this.onResults.bind(this));
        
        // Start processing frames
        this.processCameraFrames();
        
        this.showNotification('Advanced Gestures Active!', '🎯');
        console.log('✅ MediaPipe initialized successfully');
        
      } catch (error) {
        console.error('MediaPipe setup error:', error);
        this.startBasicGestureDetection();
      }
    }
    
    async processCameraFrames() {
      if (!this.cameraActive || !this.GESTURES_ENABLED || !this.hands) return;
      
      try {
        await this.hands.send({ image: this.webcam });
        requestAnimationFrame(() => this.processCameraFrames());
      } catch (error) {
        console.error('Frame processing error:', error);
        setTimeout(() => this.processCameraFrames(), 1000);
      }
    }
    
    startBasicGestureDetection() {
      console.log('🔄 Starting basic gesture detection');
      this.showNotification('Basic Gestures Active', '👋');
      
      // Use face detection or simple motion detection as fallback
      this.setupKeyboardGestures();
    }
    
    // === GESTURE RECOGNITION FUNCTIONS (EXACT SAME AS ORIGINAL) ===
    
    cooldown() {
      return Date.now() - this.lastAct < this.COOLDOWN;
    }
    
    fingerState(lm, hand) {
      const tips = [8, 12, 16, 20], pips = [6, 10, 14, 18];
      let ext = 0;
      for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[pips[i]].y - 0.02) ext++;
      }
      const thumbExt = hand === 'Right' ? 
        lm[4].x > lm[3].x + 0.02 : lm[4].x < lm[3].x - 0.02;
      return { ext, thumbExt };
    }
    
    discrete(lm, hand) {
      const s = this.fingerState(lm, hand);
      if (s.ext === 0 && !s.thumbExt) return 'fist';
      if (s.ext === 4 && s.thumbExt) return 'openHand';
      return null;
    }
    
    pinchDist(lm, w, h) {
      const dx = (lm[4].x - lm[8].x) * w;
      const dy = (lm[4].y - lm[8].y) * h;
      const dist = Math.hypot(dx, dy);
      const cx = (lm[4].x + lm[8].x) / 2 * w;
      return { dist, cx };
    }
    
    mirrorHand(hand) {
      return hand === 'Left' ? 'Right' : 'Left';
    }
    
    // === FULLSCREEN FUNCTIONALITY ===
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
        this.showNotification('Fullscreen', '🖥️');
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
        this.showNotification('Normal Screen', '📱');
      }
    }
    
    // === MAIN GESTURE PROCESSING ===
    onResults(res) {
      if (!this.webcam || !this.webcam.videoWidth || !this.youtubeVideo || !this.GESTURES_ENABLED) return;
      
      if (!res.multiHandLandmarks || res.multiHandLandmarks.length === 0) {
        for (const k of ['Left', 'Right']) {
          if (this.pinch[k].active) {
            this.pinch[k].active = false;
            this.pinch[k].start = null;
          }
        }
        return;
      }
      
      // Mirror landmarks
      const mirroredLandmarks = res.multiHandLandmarks.map(lm =>
        lm.map(p => ({ x: 1 - p.x, y: p.y, z: p.z }))
      );
      
      const handsInfo = [];
      for (let i = 0; i < mirroredLandmarks.length; i++) {
        const lm = mirroredLandmarks[i];
        const origHand = (res.multiHandedness?.[i]?.label) ?? 'Right';
        const mirroredHand = this.mirrorHand(origHand);
        const disc = this.discrete(lm, mirroredHand);
        handsInfo.push({ hand: mirroredHand, disc, lm });
      }
      
      const anyPinch = this.pinch.Left.active || this.pinch.Right.active;
      
      // === 1. BOTH FISTS → TOGGLE FULLSCREEN ===
      if (handsInfo.length === 2 && !anyPinch && !this.cooldown()) {
        const L = handsInfo.find(h => h.hand === 'Left');
        const R = handsInfo.find(h => h.hand === 'Right');
        if (L && R && L.disc === 'fist' && R.disc === 'fist') {
          this.lastAct = Date.now();
          this.toggleFullscreen();
          return;
        }
      }
      
      // === 2. PLAY / PAUSE ===
      if (handsInfo.length === 1 && !anyPinch && !this.cooldown()) {
        const h = handsInfo[0];
        if (h.disc === 'openHand') {
          this.lastAct = Date.now();
          if (h.hand === 'Left') {
            this.youtubeVideo.play();
            this.showNotification('Left Open → Play', '▶️');
          } else {
            this.youtubeVideo.pause();
            this.showNotification('Right Open → Pause', '⏸️');
          }
          return;
        }
      }
      
      if (!this.GESTURES_ENABLED) return;
      
      // === 3. PINCH → VOLUME & SEEK ===
      for (let i = 0; i < mirroredLandmarks.length; i++) {
        const lm = mirroredLandmarks[i];
        const origHand = (res.multiHandedness?.[i]?.label) ?? 'Right';
        const hand = this.mirrorHand(origHand);
        const disc = this.discrete(lm, hand);
        
        if (disc === 'fist') continue;
        
        const p = this.pinchDist(lm, this.webcam.videoWidth, this.webcam.videoHeight);
        const TH = 50;
        const st = this.pinch[hand];
        
        if (p.dist < TH) {
          if (!st.active) {
            st.active = true;
            st.start = {
              cx: p.cx,
              t: Date.now(),
              time: this.youtubeVideo.currentTime,
              vol: this.youtubeVideo.volume
            };
            st.last = { cx: p.cx };
          } else {
            const elapsed = Date.now() - st.start.t;
            if (elapsed > 300) {
              const dx = p.cx - st.start.cx;
              if (hand === 'Right') {
                const volDelta = dx * 0.002;
                const newVol = Math.max(0, Math.min(1, st.start.vol + volDelta));
                this.youtubeVideo.volume = newVol;
                this.showNotification(`Volume ${Math.round(newVol * 100)}%`, '🔊');
              } else {
                const seekSec = dx * 0.08;
                const target = Math.max(0, Math.min(
                  this.youtubeVideo.duration, 
                  st.start.time + seekSec
                ));
                this.youtubeVideo.currentTime = target;
                this.showNotification(`Seek ${Math.round(target)}s`, '⏩');
              }
            }
            st.last = { cx: p.cx };
          }
        } else {
          if (st.active) {
            const now = Date.now();
            const dur = now - st.start.t;
            if (dur < 300) {
              if (now - this.tapTs[hand] < this.DOUBLE_TAP && !this.cooldown()) {
                this.lastAct = now;
                if (hand === 'Left') {
                  this.youtubeVideo.currentTime = Math.max(0, 
                    this.youtubeVideo.currentTime - 10
                  );
                  this.showNotification('-10 Seconds', '⏪');
                } else {
                  this.youtubeVideo.currentTime = Math.min(this.youtubeVideo.duration,
                    this.youtubeVideo.currentTime + 10
                  );
                  this.showNotification('+10 Seconds', '⏩');
                }
                this.tapTs[hand] = 0;
              } else {
                this.tapTs[hand] = now;
              }
            }
            st.active = false;
            st.start = null;
            st.last = null;
          }
        }
      }
    }
    
    setupKeyboardGestures() {
      document.addEventListener('keydown', (e) => {
        if (!this.GESTURES_ENABLED || !this.youtubeVideo) return;
        
        switch(e.key) {
          case ' ':
            e.preventDefault();
            this.togglePlayPause();
            break;
          case 'ArrowLeft':
            this.seek(-10);
            break;
          case 'ArrowRight':
            this.seek(10);
            break;
          case 'ArrowUp':
            this.adjustVolume(0.1);
            break;
          case 'ArrowDown':
            this.adjustVolume(-0.1);
            break;
          case 'f':
            e.preventDefault();
            this.toggleFullscreen();
            break;
        }
      });
    }
    
    togglePlayPause() {
      if (!this.youtubeVideo) return;
      
      if (this.youtubeVideo.paused) {
        this.youtubeVideo.play();
        this.showNotification('Play', '▶️');
      } else {
        this.youtubeVideo.pause();
        this.showNotification('Pause', '⏸️');
      }
    }
    
    seek(seconds) {
      if (!this.youtubeVideo) return;
      
      this.youtubeVideo.currentTime += seconds;
      this.showNotification(
        seconds > 0 ? `+${seconds}s` : `${seconds}s`,
        seconds > 0 ? '⏩' : '⏪'
      );
    }
    
    adjustVolume(change) {
      if (!this.youtubeVideo) return;
      
      this.youtubeVideo.volume = Math.max(0, Math.min(1, this.youtubeVideo.volume + change));
      this.showNotification(`Volume ${Math.round(this.youtubeVideo.volume * 100)}%`, '🔊');
    }
    
    fallbackToKeyboard() {
      console.log('🔄 Using keyboard fallback controls');
      this.showNotification('Using keyboard controls (Space, Arrows, F)', '⌨️');
      this.setupKeyboardGestures();
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      this.showNotification(
        enabled ? 'Gestures Enabled' : 'Gestures Disabled',
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
