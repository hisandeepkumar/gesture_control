(function() {
  'use strict';
  
  class YouTubeGestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.youtubeVideo = null;
      this.notificationTimeout = null;
      this.isFullscreen = false;
      this.cameraStarted = false;
      this.webcamStream = null;
      
      this.initGestureState();
      this.setupYouTube();
    }
    
    setupYouTube() {
      this.createNotificationElement();
      this.findYouTubeVideo();
      this.setupMediaPipe();
      
      this.observer = new MutationObserver(() => {
        this.findYouTubeVideo();
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      document.addEventListener('fullscreenchange', () => {
        this.isFullscreen = !!document.fullscreenElement;
      });
    }
    
    createNotificationElement() {
      const existing = document.getElementById('yt-gesture-notification');
      if (existing) existing.remove();
      
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
      
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      this.notificationTimeout = setTimeout(() => {
        this.notification.classList.remove('show');
      }, 1500);
    }
    
    findYouTubeVideo() {
      const video = document.querySelector('video');
      if (video && video !== this.youtubeVideo) {
        this.youtubeVideo = video;
        console.log('YouTube Gesture Control: Video element found');
        
        this.setupYouTubeEvents();
      }
    }
    
    setupYouTubeEvents() {
      if (!this.youtubeVideo) return;
      
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
    
    async setupMediaPipe() {
      try {
        // Load MediaPipe scripts
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
        
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
        
        // Start webcam with proper error handling
        await this.startWebcam();
        
      } catch (err) {
        console.error('YouTube Gesture Control: Setup error', err);
        this.showNotification('Camera Setup Failed', '❌');
      }
    }
    
    async startWebcam() {
      try {
        // Create webcam element
        this.webcam = document.createElement('video');
        this.webcam.id = 'yt-gesture-webcam';
        this.webcam.style.cssText = 'width:1px;height:1px;opacity:0;position:absolute;pointer-events:none;left:-100px;top:-100px';
        this.webcam.autoplay = true;
        this.webcam.playsInline = true;
        this.webcam.muted = true;
        
        document.body.appendChild(this.webcam);
        
        // Get webcam stream
        this.webcamStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        });
        
        this.webcam.srcObject = this.webcamStream;
        
        // Wait for webcam to be ready
        await new Promise((resolve) => {
          this.webcam.onloadedmetadata = () => {
            this.webcam.play().then(resolve);
          };
        });
        
        this.cameraStarted = true;
        this.showNotification('Camera Active - Gestures Ready', '📷');
        
        console.log('YouTube Gesture Control: Webcam started successfully');
        
        // Start processing frames
        this.processFrames();
        
      } catch (err) {
        console.error('YouTube Gesture Control: Webcam error', err);
        this.showNotification('Camera Access Denied', '❌');
        this.sendWebcamStatus('error', err.message);
      }
    }
    
    async processFrames() {
      if (!this.cameraStarted || !this.GESTURES_ENABLED) return;
      
      try {
        await this.hands.send({image: this.webcam});
        // Continue processing
        requestAnimationFrame(() => this.processFrames());
      } catch (err) {
        console.error('YouTube Gesture Control: Frame processing error', err);
        // Retry after a delay
        setTimeout(() => this.processFrames(), 1000);
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
    
    initGestureState() {
      this.COOLDOWN = 1000;
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
    
    sendWebcamStatus(status, error = null) {
      window.postMessage({
        type: 'WEBCAM_STATUS',
        status: status,
        error: error
      }, '*');
    }
    
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
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      
      this.showNotification(
        enabled ? 'Gestures Enabled' : 'Gestures Disabled',
        enabled ? '✅' : '❌'
      );
      
      if (enabled && !this.cameraStarted) {
        this.startWebcam();
      }
      
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: this.GESTURES_ENABLED
      }, '*');
    }
    
    cleanup() {
      if (this.webcamStream) {
        this.webcamStream.getTracks().forEach(track => track.stop());
      }
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  }
  
  // Initialize gesture control
  let gestureControl = null;
  
  function initializeGestureControl() {
    if (gestureControl) {
      gestureControl.cleanup();
    }
    
    gestureControl = new YouTubeGestureControl();
    window.youtubeGestureControl = gestureControl;
    
    console.log('YouTube Gesture Control: Initialized');
  }
  
  // Listen for messages
  window.addEventListener('message', (event) => {
    if (!gestureControl) return;
    
    if (event.data.type === 'TOGGLE_GESTURES') {
      gestureControl.toggleGestures(event.data.enabled);
    }
    if (event.data.type === 'GET_STATUS') {
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: gestureControl.GESTURES_ENABLED
      }, '*');
    }
    if (event.data.type === 'CHECK_WEBCAM') {
      gestureControl.sendWebcamStatus(
        gestureControl.cameraStarted ? 'active' : 'inactive'
      );
    }
  });
  
  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGestureControl);
  } else {
    setTimeout(initializeGestureControl, 1000);
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (gestureControl) {
      gestureControl.cleanup();
    }
  });
})();
