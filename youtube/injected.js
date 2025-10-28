(function() {
  'use strict';
  
  class YouTubeGestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.notificationTimeout = null;
      this.isFullscreen = false;
      
      this.initGestureState();
      this.setupYouTube();
    }
    
    setupYouTube() {
      this.createNotificationElement();
      this.findYouTubeVideo();
      this.setupMediaPipe();
      
      // Watch for YouTube navigation (SPA)
      this.observer = new MutationObserver(() => {
        this.findYouTubeVideo();
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Listen for fullscreen changes
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
      });
    }
    
    createNotificationElement() {
      // Remove existing notification
      const existing = document.getElementById('yt-gesture-notification');
      if (existing) existing.remove();
      
      // Create YouTube-styled notification
      this.notification = document.createElement('div');
      this.notification.id = 'yt-gesture-notification';
      this.notification.innerHTML = `
        <style>
          #yt-gesture-notification {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            color: #0f0f0f;
            padding: 12px 24px;
            border-radius: 24px;
            font-family: 'YouTube Sans', 'Roboto', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.8);
            z-index: 9999;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 220px;
            justify-content: center;
            pointer-events: none;
          }
          #yt-gesture-notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          #yt-gesture-notification .icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          }
          #yt-gesture-notification .gesture-text {
            background: linear-gradient(135deg, #FF0000, #FF0000);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 600;
          }
        </style>
        <div class="icon">👆</div>
        <span class="gesture-text" id="yt-gesture-text">Gesture Ready</span>
      `;
      
      document.body.appendChild(this.notification);
    }
    
    showNotification(message, icon = '👆') {
      const textEl = document.getElementById('yt-gesture-text');
      const iconEl = this.notification.querySelector('.icon');
      
      if (textEl) textEl.textContent = message;
      if (iconEl) iconEl.textContent = icon;
      
      this.notification.classList.add('show');
      
      // Clear existing timeout
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      // Hide after 1.5 seconds (shorter for YouTube)
      this.notificationTimeout = setTimeout(() => {
        this.notification.classList.remove('show');
      }, 1500);
    }
    
    findYouTubeVideo() {
      // Find YouTube video element
      const video = document.querySelector('video');
      if (video && video !== this.youtubeVideo) {
        this.youtubeVideo = video;
        console.log('YouTube Gesture Control: Video element found');
        
        // Add event listeners for YouTube-specific features
        this.setupYouTubeEvents();
      }
    }
    
    setupYouTubeEvents() {
      if (!this.youtubeVideo) return;
      
      // Listen for YouTube player state changes
      this.youtubeVideo.addEventListener('play', () => {
        if (this.GESTURES_ENABLED) {
          this.showNotification('Playing', '▶️');
        }
      });
      
      this.youtubeVideo.addEventListener('pause', () => {
        if (this.GESTURES_ENABLED) {
          this.showNotification('Paused', '⏸️');
        }
      });
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      
      this.showNotification(
        enabled ? 'Gestures Enabled' : 'Gestures Disabled',
        enabled ? '✅' : '❌'
      );
      
      // Send status to popup
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: this.GESTURES_ENABLED
      }, '*');
    }
    
    // YouTube-specific fullscreen toggle
    toggleFullscreen() {
      if (this.isFullscreen) {
        document.exitFullscreen?.();
      } else {
        document.documentElement.requestFullscreen?.();
      }
    }
    
    // MediaPipe setup
    async setupMediaPipe() {
      try {
        // Load MediaPipe scripts
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        
        // Create hidden camera elements
        this.createCameraElements();
        
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
        
        // Start camera
        this.camera = new window.Camera(this.webcam, {
          onFrame: async () => {
            await this.hands.send({image: this.webcam});
          },
          width: 320,
          height: 240
        });
        
        await this.camera.start();
        this.showNotification('Gesture Control Active', '👋');
        
      } catch (err) {
        console.error('YouTube Gesture Control: Camera error', err);
        this.showNotification('Camera Access Required', '📷');
      }
    }
    
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    createCameraElements() {
      // Create completely hidden webcam element
      this.webcam = document.createElement('video');
      this.webcam.id = 'yt-gesture-webcam';
      this.webcam.style.cssText = 'width:1px;height:1px;opacity:0;position:absolute;pointer-events:none;left:-100px;top:-100px';
      this.webcam.autoplay = true;
      this.webcam.playsInline = true;
      
      // Create hidden canvas for processing
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'display:none';
      
      document.body.appendChild(this.webcam);
      document.body.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
    }
    
    // Gesture state variables
    initGestureState() {
      this.COOLDOWN = 1000; // Shorter cooldown for YouTube
      this.lastAct = 0;
      this.pinch = {
        Left: {active: false, start: null, last: null},
        Right: {active: false, start: null, last: null}
      };
      this.tapTs = {Left: 0, Right: 0};
      this.DOUBLE_TAP = 500;
    }
    
    cooldown() {
      return Date.now() - this.lastAct < this.COOLDOWN;
    }
    
    // Gesture recognition functions
    fingerState(lm, hand) {
      const tips = [8, 12, 16, 20], pips = [6, 10, 14, 18];
      let ext = 0;
      for (let i = 0; i < 4; i++) {
        if (lm[tips[i]].y < lm[pips[i]].y - 0.02) ext++;
      }
      const thumbExt = hand === 'Right' ? 
        lm[4].x > lm[3].x + 0.02 : lm[4].x < lm[3].x - 0.02;
      return {ext, thumbExt};
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
      return {dist, cx};
    }
    
    mirrorHand(hand) {
      return hand === 'Left' ? 'Right' : 'Left';
    }
    
    // Process MediaPipe results for YouTube
    onResults(res) {
      if (!this.webcam.videoWidth || !this.youtubeVideo || !this.GESTURES_ENABLED) return;
      
      this.canvas.width = this.webcam.videoWidth;
      this.canvas.height = this.webcam.videoHeight;
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Mirror and process
      this.ctx.scale(-1, 1);
      this.ctx.translate(-this.canvas.width, 0);
      this.ctx.drawImage(res.image, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      
      if (!res.multiHandLandmarks || res.multiHandLandmarks.length === 0) {
        for (const k of ['Left', 'Right']) {
          if (this.pinch[k].active) {
            this.pinch[k].active = false;
            this.pinch[k].start = null;
          }
        }
        this.ctx.restore();
        return;
      }
      
      // Mirror landmarks
      const mirroredLandmarks = res.multiHandLandmarks.map(lm =>
        lm.map(p => ({x: 1 - p.x, y: p.y, z: p.z}))
      );
      
      // Process gestures
      const handsInfo = [];
      for (let i = 0; i < mirroredLandmarks.length; i++) {
        const lm = mirroredLandmarks[i];
        const origHand = (res.multiHandedness?.[i]?.label) ?? 'Right';
        const mirroredHand = this.mirrorHand(origHand);
        const disc = this.discrete(lm, mirroredHand);
        handsInfo.push({hand: mirroredHand, disc, lm});
      }
      
      const anyPinch = this.pinch.Left.active || this.pinch.Right.active;
      
      // === 1. BOTH FISTS → TOGGLE PLAY/PAUSE ===
      if (handsInfo.length === 2 && !anyPinch && !this.cooldown()) {
        const L = handsInfo.find(h => h.hand === 'Left');
        const R = handsInfo.find(h => h.hand === 'Right');
        if (L && R && L.disc === 'fist' && R.disc === 'fist') {
          this.lastAct = Date.now();
          if (this.youtubeVideo.paused) {
            this.youtubeVideo.play();
            this.showNotification('Both Fists → Play', '▶️');
          } else {
            this.youtubeVideo.pause();
            this.showNotification('Both Fists → Pause', '⏸️');
          }
          this.ctx.restore();
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
          this.ctx.restore();
          return;
        }
      }
      
      // === 3. PINCH → VOLUME & SEEK ===
      for (let i = 0; i < mirroredLandmarks.length; i++) {
        const lm = mirroredLandmarks[i];
        const origHand = (res.multiHandedness?.[i]?.label) ?? 'Right';
        const hand = this.mirrorHand(origHand);
        const disc = this.discrete(lm, hand);
        
        // Block pinch in fist
        if (disc === 'fist') continue;
        
        const p = this.pinchDist(lm, this.canvas.width, this.canvas.height);
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
            st.last = {cx: p.cx};
          } else {
            const elapsed = Date.now() - st.start.t;
            if (elapsed > 300) {
              const dx = p.cx - st.start.cx;
              if (hand === 'Right') {
                const volDelta = dx * 0.002;
                const newVol = Math.max(0, Math.min(1, st.start.vol + volDelta));
                this.youtubeVideo.volume = newVol;
                this.showNotification(`Volume ${Math.round(newVol*100)}%`, '🔊');
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
            st.last = {cx: p.cx};
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
      
      this.ctx.restore();
    }
  }
  
  // Initialize when YouTube is ready
  function initializeGestureControl() {
    if (window.youtubeGestureControl) return;
    
    window.youtubeGestureControl = new YouTubeGestureControl();
    console.log('YouTube Gesture Control: Initialized');
    
    // Listen for toggle messages
    window.addEventListener('message', (event) => {
      if (event.data.type === 'TOGGLE_GESTURES') {
        window.youtubeGestureControl.toggleGestures(event.data.enabled);
      }
      if (event.data.type === 'GET_STATUS') {
        window.postMessage({
          type: 'GESTURE_STATUS',
          enabled: window.youtubeGestureControl.GESTURES_ENABLED
        }, '*');
      }
    });
  }
  
  // Wait for YouTube to fully load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGestureControl);
  } else {
    setTimeout(initializeGestureControl, 1000);
  }
})();
