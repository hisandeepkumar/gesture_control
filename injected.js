(function() {
  'use strict';
  
  class GestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.currentVideo = null;
      this.notificationTimeout = null;
      
      this.initGestureState();
      this.init();
    }
    
    async init() {
      // Wait for page to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }
    
    setup() {
      this.createNotificationElement();
      this.findVideoElements();
      this.setupMediaPipe();
      
      // Watch for new video elements
      this.observer = new MutationObserver(() => {
        this.findVideoElements();
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    
    createNotificationElement() {
      // Remove existing notification if present
      const existing = document.getElementById('gesture-notification');
      if (existing) existing.remove();
      
      // Create notification element
      this.notification = document.createElement('div');
      this.notification.id = 'gesture-notification';
      this.notification.innerHTML = `
        <style>
          #gesture-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            color: #333;
            padding: 12px 24px;
            border-radius: 50px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            z-index: 10000;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 200px;
            justify-content: center;
          }
          #gesture-notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          #gesture-notification .icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          #gesture-notification .gesture-text {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        </style>
        <div class="icon">👆</div>
        <span class="gesture-text" id="gesture-text">Gesture Detected</span>
      `;
      
      document.body.appendChild(this.notification);
    }
    
    showNotification(message, icon = '👆') {
      const textEl = document.getElementById('gesture-text');
      const iconEl = this.notification.querySelector('.icon');
      
      if (textEl) textEl.textContent = message;
      if (iconEl) iconEl.textContent = icon;
      
      this.notification.classList.add('show');
      
      // Clear existing timeout
      if (this.notificationTimeout) {
        clearTimeout(this.notificationTimeout);
      }
      
      // Hide after 2 seconds
      this.notificationTimeout = setTimeout(() => {
        this.notification.classList.remove('show');
      }, 2000);
    }
    
    findVideoElements() {
      // Find all video elements on the page
      const videos = document.querySelectorAll('video');
      
      if (videos.length > 0) {
        // Use the first video that's visible and has controls
        this.currentVideo = Array.from(videos).find(v => 
          v.offsetParent !== null && // Visible
          v.readyState > 0 // Has loaded data
        ) || videos[0];
      }
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      
      // Show status notification
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
    
    // MediaPipe setup
    async setupMediaPipe() {
      // Load MediaPipe scripts
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      
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
      
      try {
        await this.camera.start();
        console.log('Gesture Control: Camera started');
      } catch (err) {
        console.error('Gesture Control: Camera error', err);
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
      this.webcam.id = 'gesture-webcam';
      this.webcam.style.cssText = 'width:1px;height:1px;opacity:0;position:absolute;pointer-events:none;left:-100px';
      this.webcam.autoplay = true;
      this.webcam.playsInline = true;
      
      // Create hidden canvas for processing only
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'display:none';
      
      document.body.appendChild(this.webcam);
      document.body.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
    }
    
    // Gesture state variables
    initGestureState() {
      this.COOLDOWN = 1200;
      this.lastAct = 0;
      this.pinch = {
        Left: {active: false, start: null, last: null},
        Right: {active: false, start: null, last: null}
      };
      this.tapTs = {Left: 0, Right: 0};
      this.DOUBLE_TAP = 600;
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
    
    // Process MediaPipe results
    onResults(res) {
      if (!this.webcam.videoWidth || !this.currentVideo || !this.GESTURES_ENABLED) return;
      
      this.canvas.width = this.webcam.videoWidth;
      this.canvas.height = this.webcam.videoHeight;
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Mirror and process (but don't draw)
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
      
      // Process gestures (no drawing)
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
          if (this.currentVideo.paused) {
            this.currentVideo.play().catch(() => {});
            this.showNotification('Both Fists → Play', '▶️');
          } else {
            this.currentVideo.pause();
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
            this.currentVideo.play().catch(() => {});
            this.showNotification('Left Open → Play', '▶️');
          } else {
            this.currentVideo.pause();
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
              time: this.currentVideo.currentTime,
              vol: this.currentVideo.volume
            };
            st.last = {cx: p.cx};
          } else {
            const elapsed = Date.now() - st.start.t;
            if (elapsed > 300) {
              const dx = p.cx - st.start.cx;
              if (hand === 'Right') {
                const volDelta = dx * 0.002;
                const newVol = Math.max(0, Math.min(1, st.start.vol + volDelta));
                this.currentVideo.volume = newVol;
                this.showNotification(`Volume ${Math.round(newVol*100)}%`, '🔊');
              } else {
                const seekSec = dx * 0.08;
                const target = Math.max(0, Math.min(
                  this.currentVideo.duration, 
                  st.start.time + seekSec
                ));
                this.currentVideo.currentTime = target;
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
                  this.currentVideo.currentTime = Math.max(0, 
                    this.currentVideo.currentTime - 10
                  );
                  this.showNotification('-10 Seconds', '⏪');
                } else {
                  this.currentVideo.currentTime = Math.min(this.currentVideo.duration,
                    this.currentVideo.currentTime + 10
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
  
  // Initialize gesture control
  window.gestureControl = new GestureControl();
  
  // Listen for toggle messages
  window.addEventListener('message', (event) => {
    if (event.data.type === 'TOGGLE_GESTURES') {
      window.gestureControl.toggleGestures(event.data.enabled);
    }
    if (event.data.type === 'GET_STATUS') {
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: window.gestureControl.GESTURES_ENABLED
      }, '*');
    }
  });
})();
