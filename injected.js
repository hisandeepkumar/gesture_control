(function() {
  'use strict';
  
  // Main gesture control logic - adapted from your original code
  class UniversalGestureControl {
    constructor() {
      this.GESTURES_ENABLED = true;
      this.currentVideo = null;
      this.initialized = false;
      
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
      this.createUI();
      this.findVideoElements();
      this.setupMediaPipe();
      
      // Watch for new video elements (like in SPAs)
      this.observer = new MutationObserver(() => {
        this.findVideoElements();
      });
      
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      this.initialized = true;
    }
    
    createUI() {
      // Remove existing UI if present
      const existingUI = document.getElementById('gesture-control-ui');
      if (existingUI) existingUI.remove();
      
      // Create gesture control UI
      this.ui = document.createElement('div');
      this.ui.id = 'gesture-control-ui';
      this.ui.innerHTML = `
        <style>
          #gesture-control-ui {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            max-width: 200px;
          }
          #gesture-control-ui .status {
            margin-bottom: 5px;
          }
          #gesture-control-ui .toggle {
            background: #4a00e0;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
          }
          #gesture-control-ui .toggle.off {
            background: #ff416c;
          }
        </style>
        <div class="status">Gestures: <span id="gesture-status">ON</span></div>
        <button class="toggle" id="gesture-toggle">Disable</button>
      `;
      
      document.body.appendChild(this.ui);
      
      // Add toggle handler
      this.ui.querySelector('#gesture-toggle').addEventListener('click', () => {
        this.toggleGestures(!this.GESTURES_ENABLED);
      });
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
        
        console.log('Gesture Control: Found video element', this.currentVideo);
      }
    }
    
    toggleGestures(enabled) {
      this.GESTURES_ENABLED = enabled;
      const statusEl = document.getElementById('gesture-status');
      const toggleBtn = document.getElementById('gesture-toggle');
      
      if (statusEl) {
        statusEl.textContent = enabled ? 'ON' : 'OFF';
        statusEl.style.color = enabled ? '#0f0' : '#f00';
      }
      
      if (toggleBtn) {
        toggleBtn.textContent = enabled ? 'Disable' : 'Enable';
        toggleBtn.className = enabled ? 'toggle' : 'toggle off';
      }
      
      // Send status to popup
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: this.GESTURES_ENABLED
      }, '*');
    }
    
    // MediaPipe and gesture detection logic from your original code
    async setupMediaPipe() {
      // Load MediaPipe scripts
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      
      // Create camera and canvas elements
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
      // Create hidden webcam element
      this.webcam = document.createElement('video');
      this.webcam.id = 'gesture-webcam';
      this.webcam.style.cssText = 'width:1px;height:1px;opacity:0;position:absolute;pointer-events:none';
      this.webcam.autoplay = true;
      this.webcam.playsInline = true;
      
      // Create canvas for hand visualization
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'gesture-canvas';
      this.canvas.style.cssText = 'position:fixed;bottom:80px;right:20px;width:160px;height:120px;z-index:10000;border:2px solid white;border-radius:8px;background:#000';
      
      document.body.appendChild(this.webcam);
      document.body.appendChild(this.canvas);
      
      this.ctx = this.canvas.getContext('2d');
    }
    
    // Gesture state variables (from your original code)
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
    
    // Gesture recognition functions (from your original code)
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
    
    // Process MediaPipe results (adapted from your original code)
    onResults(res) {
      if (!this.webcam.videoWidth || !this.currentVideo || !this.GESTURES_ENABLED) return;
      
      this.canvas.width = this.webcam.videoWidth;
      this.canvas.height = this.webcam.videoHeight;
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      // Mirror and draw camera feed
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
      
      // Draw hand landmarks
      for (let i = 0; i < mirroredLandmarks.length; i++) {
        const lm = mirroredLandmarks[i];
        window.drawConnectors(this.ctx, lm, window.HAND_CONNECTIONS, {
          color: '#0f0', lineWidth: 2
        });
        window.drawLandmarks(this.ctx, lm, {
          color: '#ff0', lineWidth: 1
        });
      }
      
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
          if (this.currentVideo.paused) {
            this.currentVideo.play().catch(() => {});
          } else {
            this.currentVideo.pause();
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
          } else {
            this.currentVideo.pause();
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
              } else {
                const seekSec = dx * 0.08;
                const target = Math.max(0, Math.min(
                  this.currentVideo.duration, 
                  st.start.time + seekSec
                ));
                this.currentVideo.currentTime = target;
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
                } else {
                  this.currentVideo.currentTime = Math.min(this.currentVideo.duration,
                    this.currentVideo.currentTime + 10
                  );
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
  window.universalGestureControl = new UniversalGestureControl();
  
  // Listen for toggle messages
  window.addEventListener('message', (event) => {
    if (event.data.type === 'TOGGLE_GESTURES') {
      window.universalGestureControl.toggleGestures(event.data.enabled);
    }
    if (event.data.type === 'GET_STATUS') {
      window.postMessage({
        type: 'GESTURE_STATUS',
        enabled: window.universalGestureControl.GESTURES_ENABLED
      }, '*');
    }
  });
})();
