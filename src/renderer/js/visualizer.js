/**
 * GlassWave Visualizer Engine
 * 60+ FPS GPU-accelerated Canvas 2D rendering for unclipped full-stage immersion.
 * Supports 6 Modes:
 * 1. 波形 (Wave): Perspective Audio Wave Field (pseudo-3D wireframe ocean field)
 * 2. 环形 (Spectrum): Modern neon radial spectrum with logarithmic distribution, symmetry & tapering
 * 3. 球形 (Sphere): 3D Spherical Acoustic Matrix with frequency symmetry (2x default) & low-frequency diffusion
 * 4. 柱谱 (Bars): Screen-wide HiFi spectrum bars with frequency arrangements, corner radius & peak hold
 * 5. 粒子 (Orb / Particle): Pseudo-3D particle field flowing from horizon to viewer with depth-of-field
 * 6. 流光 (Ambient / Flow): Minimalist audio-reactive flow field (no decorative orbs by default, curl streamlines)
 */

class Visualizer {
  constructor(canvasId, audioEngine, colorEngine = null) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.audioEngine = audioEngine;
    this.colorEngine = colorEngine;

    this.mode = 'wave'; // 'wave' | 'spectrum' | 'sphere' | 'bars' | 'orb' | 'ambient'
    this.isEnabled = true;
    this.intensity = 1.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;

    // Smoothing buffers for liquid audio physics
    this.smoothedWaveform = new Float32Array(128).fill(0);
    this.smoothedSpectrum = new Float32Array(64).fill(0);
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedHigh = 0;

    // Mode-Specific Layout Parameters
    this.visualizerLayouts = {
      wave: { type: 'wave', anchorX: 0.5, baselineRatio: 0.65, fullWidth: true },
      spectrum: { type: 'spectrum', anchorX: 0.5, offsetCoverYRatio: 0.50, barCount: 64 },
      sphere: {
        lightMode: 'beat', lightSensitivity: 3, lightDecay: 120, idleLight: .04, type: 'sphere', anchorX: 0.5, offsetCoverYRatio: 0.50 },
      bars: { type: 'bars', anchorX: 0.5, fullWidth: true },
      orb: { type: 'orb', fullCanvas: true, anchorX: 0.5 },
      ambient: { type: 'ambient', fullCanvas: true },
      reactive: { type: 'reactive', fullCanvas: true },
      curtain: { type: 'curtain', fullCanvas: true }
    };

    // Position & Scale Customization (除了柱谱默认在封面正下方 below 以外，其他波形均默认在屏幕视窗中心 center)
    this.positionPreset = this.getDefaultPositionForMode(this.mode); // 'center'
    this.offsetY = 0; // fine-tuning offset in px
    this.visScale = 1.25; // global size scaling multiplier

    // 3D Spherical Spectrum rotation phases
    this.sphereRotX = 0.2;
    this.sphereRotY = 0.0;

    // Peak hold buffers for horizontal bars mode
    this.peakBars = new Float32Array(256).fill(0);
    this.peakHoldCounter = new Int32Array(256).fill(0);
    this.barSpectrum = new Float32Array(64).fill(0);

    // Continuous time animation phases
    this.wavePhase = 0;
    this.orbPhase = 0;
    this.ambientPhase = 0;
    this.particleWavePhase = 0;
    this.ambientPulse = 0;
    this.smoothedHighRipple = new Float32Array(96).fill(0);

    // Persistent Quantum Stardust Particles (Orb mode legacy fallback)
    this.orbParticles = [];
    for (let i = 0; i < 54; i++) {
      this.orbParticles.push({
        angle: Math.random() * Math.PI * 2,
        distRatio: 0.85 + Math.random() * 0.95,
        baseDist: 0.85 + Math.random() * 0.95,
        size: 1.2 + Math.random() * 2.2,
        speed: (Math.random() > 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.007),
        alpha: 0.25 + Math.random() * 0.65,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // Pseudo-3D Particle Field Pool (Orb / Particle Mode) - Full Screen 3D Frustum
    this.orbFieldParticles = [];
    for (let i = 0; i < 300; i++) {
      this.orbFieldParticles.push({
        x: (Math.random() - 0.5) * 3200,
        y: (Math.random() - 0.5) * 2200,
        z: 80 + Math.random() * 900,
        baseSize: 1.5 + Math.random() * 3.5,
        speedMult: 0.7 + Math.random() * 0.7,
        seed: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.65
      });
    }

    // Persistent Aurora Bokeh Stardust (Ambient mode: only when enableOrbs is true)
    this.ambientParticles = [];
    for (let i = 0; i < 32; i++) {
      this.ambientParticles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.0004,
        vy: -0.0002 - Math.random() * 0.0003,
        radius: 12 + Math.random() * 22,
        alpha: 0.04 + Math.random() * 0.12,
        hue: Math.random() > 0.5 ? 195 + Math.random() * 35 : 265 + Math.random() * 40
      });
    }

    // Persistent Audio-Reactive Flow Streamlines (Ambient / Flow Mode)
    this.flowStreamlines = [];
    for (let i = 0; i < 128; i++) {
      const trail = [];
      const initX = Math.random();
      const initY = Math.random();
      for (let k = 0; k < 12; k++) {
        trail.push({ x: initX, y: initY });
      }
      this.flowStreamlines.push({
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
        trail,
        speed: 0.0015 + Math.random() * 0.0025,
        hue: 185 + Math.random() * 110,
        widthRatio: 0.7 + Math.random() * 0.6,
        seed: Math.random() * 100
      });
    }

    // Unified Audio Response Preprocessor State
    this.audioProcessor = {
      processedFreqs: new Float32Array(128).fill(0),
      lastTime: performance.now(),
      targetBuffer: new Float32Array(128).fill(0),
      softenedBuffer: new Float32Array(128).fill(0)
    };

    // Realtime FPS tracking and wave coordinate buffers
    this.currentFps = 60;
    this._wavePx = new Float32Array(64);
    this._wavePy = new Float32Array(64);

    // Advanced Visual Tuning Parameters
    this.defaultTuning = {
      reactive: { layout: 'ribbon', edgeStability: .85, curveSmooth: .2, separation: .55, flowSeparation: 0, driftSpeed: 1, driftDirection: 'right', idleMotion: .18, density: 8, response: .95, gain: 2.5, detail: .8, divergence: .45, strength: 1.2, smoothing: .35, lineWidth: 3, musicMix: .85, glow: .8, spread: .7 },
      curtain: { strength: 1.5, width: .32, speed: 1 },
      palette: 'original',
      solidColor: '#38bdf8',
      modeColors: Object.fromEntries(['wave','spectrum','sphere','bars','orb','ambient','reactive','curtain'].map(mode => [mode, { palette: 'original', solidColor: '#38bdf8' }])),
      hueShift: 0,
      quality: 'balanced', // 'low' | 'balanced' | 'high' | 'ultra'
      targetFps: 90, // Menu offers 60 or 90; legacy "unlimited" uses the 90 FPS clock.
      audioResponse: {
        smoothFactor: 0.70, // 0% ~ 95%
        attackMs: 35,       // 0 ~ 300ms
        releaseMs: 300,     // 50 ~ 1200ms
        compression: 0.45,  // 0 ~ 100%
        bassScale: 1.0,     // 0 ~ 200%
        midScale: 1.0,      // 0 ~ 200%
        highScale: 1.0,     // 0 ~ 200%
        distribution: 'log',// 'linear' | 'log'
        peakSoftening: 'soft' // 'off' | 'soft' | 'medium' | 'heavy'
      },
      wave: {
        style: 'ribbon', edgeStability: .85, curveSmooth: .2, separation: .55, flowSeparation: 0, driftSpeed: 1, driftDirection: 'right', idleMotion: .18, density: 8, response: .95, gain: 2.5, detail: .8, divergence: .45, musicMix: .85,
        lineWidth: 4.2,
        amplitude: 1.0,
        glowBlur: 18,
        companionAlpha: 0.8,
        perspectivePitch: 35,
        yaw: -12,
        tilt: 8,
        lineCount: 4,
        smoothing: 0.70,
        depthLength: 1.20,
        farFade: 0.70,
        nearLineWidth: 1.40,
        horizontalSpan: 1.20,
        flowSpeed: 1.0,
        antiMoire: true,
        moireDamping: 0.75
      },
      spectrum: {
        innerRadiusRatio: 1.0,
        barLengthRatio: 1.0,
        barWidth: 2.4,
        barCount: 64,
        rotAngle: 0,
        smoothFactor: 0.60,
        radialCompression: 0.35,
        symmetry: 'none', // 'none' | '2x' | '4x' | '8x'
        taper: 0.20
      },
      sphere: {
        radiusRatio: 1.0,
        rotSpeed: 1.0,
        coreGlow: 0.7,
        nodeSize: 1.0,
        symmetry: '2x', // 2重对称 by default!
        rotAngle: 0,
        bassDiffusion: 0.35,
        sphereSmoothing: 0.60,
        backAlpha: 0.45,
        depthRatio: 0.60
      },
      bars: {
        barWidthRatio: 0.65,
        heightRatio: 1.0,
        reflectionAlpha: 0.25,
        peakHold: true,
        freqOrder: 'asc', // 'asc' | 'desc' | 'center_bass' | 'center_treble' | 'mirror'
        barCount: 64,
        barGap: 0.35,
        cornerRadius: 0.50,
        peakHoldMs: 300,
        peakDecaySpeed: 1.0,
        reflectionSoftness: 0.40
      },
      orb: {
        particleCount: 160,
        speed: 1.0,
        size: 1.0,
        depthRatio: 0.85,
        horizonRatio: 0.50,
        perspectiveSpread: 1.25,
        viewDirection: 0,
        fieldRotation: 0,
        fgBlur: 0.30,
        farAlpha: 0.45,
        musicInfluence: 1.0,
        bassThrust: 0.80,
        turbulence: 0.20
      },
      ambient: {
        ribbonCount: 32,
        speed: 1.0,
        trailLength: 1.0,
        ribbonWidth: 1.0,
        curvature: 0.50,
        turbulence: 0.25,
        direction: 15,
        spreadAngle: 35,
        depthRatio: 0.50,
        glowIntensity: 0.80,
        fadeSpeed: 1.0,
        musicInfluence: 1.0,
        inertia: 0.65,
        enableOrbs: false // 光球开关，默认关闭！
      }
    };

    this.tuning = JSON.parse(JSON.stringify(this.defaultTuning));
    this.loadTuning();
    if (this.tuning.wave.lineCount < 3 || this.tuning.wave.lineCount > 5) this.tuning.wave.lineCount = 4;

    this.initCanvas();
    this.startLoop();
  }

  initCanvas() {
    if (!this.canvas) return;

    this.isFrozenForTransition = false;
    this._freezeTimer = null;

    this.freezeTransition = (durationMs = 400) => {
      this.isFrozenForTransition = true;
      if (this._freezeTimer) clearTimeout(this._freezeTimer);
      this._freezeTimer = setTimeout(() => {
        this.unfreezeTransition();
      }, durationMs);
    };

    this.unfreezeTransition = () => {
      if (this._freezeTimer) {
        clearTimeout(this._freezeTimer);
        this._freezeTimer = null;
      }
      this.isFrozenForTransition = false;
      this.performSyncResize();
      if (typeof this.render === 'function') {
        this.render();
      }
    };

    this.performSyncResize = () => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      this.applyVisualColor();
      const q = this.tuning?.quality || 'balanced';
      // Keep wave raster work bounded independently of window size / Windows DPI.
      // CSS layout remains native resolution; only the transparent wave layer is scaled.
      const caps = { low: 1, balanced: 1.5, high: 2, ultra: 2.5 };
      const budgets = { low: 900000, balanced: 1400000, high: 2200000, ultra: 3200000 };
      this.dpr = Math.min(window.devicePixelRatio || 1, caps[q] || 1.5);
      if (['wave', 'reactive', 'curtain'].includes(this.mode)) {
        this.dpr = Math.min(this.dpr, Math.sqrt((budgets[q] || budgets.balanced) / (rect.width * rect.height)));
      }

      if(this._interactionQuality) this.dpr=Math.min(this.dpr,Math.sqrt(900000/(rect.width*rect.height)));
      const targetW = Math.floor(rect.width * this.dpr);
      const targetH = Math.floor(rect.height * this.dpr);
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
      this.width = rect.width;
      this.height = rect.height;
      if (this.ctx) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
      }
      this.invalidateCoverMetrics();
    };

    let resizeTimer = null;
    const debouncedResize = () => {
      if (this.isFrozenForTransition) return;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.performSyncResize();
        resizeTimer = null;
      }, 100);
    };

    window.addEventListener('resize', debouncedResize);
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(debouncedResize);
      this.resizeObserver.observe(this.canvas);
    }
    this.performSyncResize();
  }

  resize() {
    if (this.performSyncResize) {
      this.performSyncResize();
    }
  }

  getDefaultPositionForMode(mode) {
    // 除了柱谱默认在封面正下方 (below) 以外，其他波形均默认在屏幕视窗中心 (center)
    return mode === 'bars' ? 'below' : 'center';
  }

  setMode(mode) {
    if (this.visualizerLayouts[mode]) {
      this.mode = mode;
      this.performSyncResize();
      this.positionPreset = this.getDefaultPositionForMode(mode);
      this.invalidateCoverMetrics();
    }
  }

  applyVisualColor() {
    if (this.canvas) this.canvas.style.filter = 'none';
  }

  setPalette(name) {
    if (!['original','aurora','ocean','sunset','forest','solid'].includes(name)) return;
    this.tuning.modeColors[this.mode].palette = name;
    this.applyVisualColor(); this.saveTuning();
  }

  setSolidColor(color) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    this.tuning.modeColors[this.mode].solidColor = color.toLowerCase(); this.setPalette('solid');
  }

  applyPalette(ctx) {
    const modeColor = this.tuning.modeColors?.[this.mode] || this.defaultTuning.modeColors[this.mode];
    const name = modeColor?.palette || 'original';
    if (name === 'original') return;
    const palettes = { aurora: ['#38bdf8','#a78bfa','#f472b6'], ocean: ['#22d3ee','#3b82f6','#6366f1'], sunset: ['#fbbf24','#fb7185','#c084fc'], forest: ['#a3e635','#34d399','#2dd4bf'] };
    ctx.save(); ctx.globalCompositeOperation = 'source-in';
    if (name === 'solid') ctx.fillStyle = modeColor.solidColor || '#38bdf8';
    else {
      const colors = palettes[name] || palettes.aurora;
      const gradient = ctx.createLinearGradient(0,0,this.width,0);
      colors.forEach((color,index) => gradient.addColorStop(index/(colors.length-1),color));
      ctx.fillStyle = gradient;
    }
    ctx.fillRect(0,0,this.width,this.height); ctx.restore();
  }

  setIntensity(val) {
    this.intensity = Math.max(0.2, Math.min(3.0, val));
  }

  setPositionPreset(preset) {
    if (['behind', 'below', 'center'].includes(preset)) {
      this.positionPreset = preset;
      this.invalidateCoverMetrics();
    }
  }

  setOffsetY(val) {
    this.offsetY = Math.max(-250, Math.min(250, Number(val) || 0));
    this.invalidateCoverMetrics();
  }

  setScale(val) {
    this.visScale = Math.max(0.6, Math.min(3.5, Number(val) || 1.25));
    this.invalidateCoverMetrics();
  }

  getAnchorPoint() {
    const w = this.width;
    const h = this.height;
    const cover = this.getCoverMetrics();

    let cx = cover.cx;
    let cy = cover.cy;

    switch (this.positionPreset) {
      case 'behind':
        cx = cover.cx;
        cy = cover.cy;
        break;
      case 'below':
        cx = cover.cx;
        const metaEl = document.getElementById('track-meta');
        let metaBottom = cover.bottom + 90;
        if (metaEl && this.canvas) {
          const mRect = metaEl.getBoundingClientRect();
          const cRect = this.canvas.getBoundingClientRect();
          if (mRect.height > 0 && cRect.height > 0) {
            metaBottom = mRect.bottom - cRect.top;
          }
        }
        const lowerThirdTarget = Math.max(h * 0.72, metaBottom + 28);
        cy = Math.min(h - 90, lowerThirdTarget);
        break;
      case 'center':
        cx = w * 0.5;
        cy = h * 0.5;
        break;
      default:
        cx = cover.cx;
        cy = cover.cy;
    }

    cy += this.offsetY;
    return { cx, cy };
  }

  setEnabled(enabled) {
    this.isEnabled = !!enabled;
    if (this.canvas) {
      this.canvas.style.display = this.isEnabled ? 'block' : 'none';
    }
    if (!this.isEnabled && this.ctx && this.width && this.height) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  startLoop() {
    window.glasswaveFrameClock?.setRate(this.tuning?.targetFps);
    let lastRenderTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const loop = (currentTime) => {
      const targetFps = this.tuning?.targetFps || 'unlimited';
      let minDelta = 0;
      if (targetFps === 60) minDelta = 1000 / 60;
      else if (targetFps === 90) minDelta = 1000 / 90;
      else if (targetFps === 120) minDelta = 1000 / 120;
      else if (targetFps === 144) minDelta = 1000 / 144;

      const delta = currentTime - lastRenderTime;
      if (minDelta <= 0 || delta + 0.5 >= minDelta) {
        lastRenderTime = minDelta > 0
          ? lastRenderTime + Math.max(1, Math.floor((delta + 0.5) / minDelta)) * minDelta
          : currentTime;
        this.render();

        frameCount++;
        if (currentTime - fpsTimer >= 350) {
          this.currentFps = Math.round((frameCount * 1000) / (currentTime - fpsTimer));
          frameCount = 0;
          fpsTimer = currentTime;
        }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  invalidateCoverMetrics() {
    this._cachedCoverMetrics = null;
  }

  getCoverMetrics() {
    if (this._cachedCoverMetrics) {
      return this._cachedCoverMetrics;
    }

    const defaultMetrics = {
      cx: this.width * 0.5,
      cy: this.height * 0.38,
      width: Math.min(260, this.width * 0.35),
      height: Math.min(260, this.width * 0.35),
      top: this.height * 0.38 - 130,
      bottom: this.height * 0.38 + 130
    };

    if (!this.canvas) return defaultMetrics;

    const coverEl = document.getElementById('album-wrap');
    if (!coverEl) return defaultMetrics;

    const canvasRect = this.canvas.getBoundingClientRect();
    const coverRect = coverEl.getBoundingClientRect();

    if (coverRect.width === 0 || canvasRect.width === 0) return defaultMetrics;

    const cx = (coverRect.left + coverRect.width / 2) - canvasRect.left;
    const cy = (coverRect.top + coverRect.height / 2) - canvasRect.top;
    const top = coverRect.top - canvasRect.top;
    const bottom = coverRect.bottom - canvasRect.top;

    this._cachedCoverMetrics = {
      cx,
      cy,
      width: coverRect.width,
      height: coverRect.height,
      top,
      bottom
    };

    return this._cachedCoverMetrics;
  }

  loadTuning() {
    this.tuning = JSON.parse(JSON.stringify(this.defaultTuning));
    try {
      const saved = localStorage.getItem('glasswave_visual_tuning');
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const mode in parsed) {
          if (this.tuning[mode]) {
            if (typeof this.tuning[mode] === 'object' && !Array.isArray(this.tuning[mode])) {
              Object.assign(this.tuning[mode], parsed[mode]);
            } else {
              this.tuning[mode] = parsed[mode];
            }
          } else {
            this.tuning[mode] = parsed[mode];
          }
        }
        // Migrate the former global color choice without changing the look of existing skins.
        for (const mode of Object.keys(this.defaultTuning.modeColors)) {
          this.tuning.modeColors[mode] = {
            palette: parsed.modeColors?.[mode]?.palette || parsed.palette || 'original',
            solidColor: parsed.modeColors?.[mode]?.solidColor || parsed.solidColor || '#38bdf8'
          };
        }
      }
    } catch (e) {}
    // Earlier builds stored the 90 FPS clock rate as "unlimited".
    if (this.tuning.targetFps === 'unlimited') this.tuning.targetFps = 90;
  }

  saveTuning() {
    try {
      localStorage.setItem('glasswave_visual_tuning', JSON.stringify(this.tuning));
    } catch (e) {}
  }

  setTuningParam(mode, key, val) {
    if (!this.tuning) return;
    if (mode === 'quality') {
      this.tuning.quality = val;
      this.performSyncResize();
      this.saveTuning();
      return;
    }
    if (mode === 'targetFps') {
      this.setTargetFps(val);
      return;
    }
    if (!this.tuning[mode]) {
      this.tuning[mode] = {};
    }
    this.tuning[mode][key] = val;
    this.saveTuning();
  }

  setTargetFps(fps) {
    if (!this.tuning) this.tuning = {};
    this.tuning.targetFps = fps;
    window.glasswaveFrameClock?.setRate(fps);
    this.saveTuning();
  }

  resetModeTuning(mode) {
    if (mode === 'audio' || mode === 'audioResponse') {
      this.tuning.audioResponse = JSON.parse(JSON.stringify(this.defaultTuning.audioResponse));
    } else if (this.defaultTuning[mode]) {
      this.tuning[mode] = JSON.parse(JSON.stringify(this.defaultTuning[mode]));
      this.tuning.modeColors[mode] = { ...this.defaultTuning.modeColors[mode] };
    }
    this.saveTuning();
  }

  resetAllVisualTuning() {
    this.tuning = JSON.parse(JSON.stringify(this.defaultTuning));
    this.saveTuning();
    this.performSyncResize();
  }

  resetTuning() {
    // Retain compatibility with existing Test 76 while resetting visual tuning
    this.resetAllVisualTuning();
  }

  setQuality(quality) {
    if (['low', 'balanced', 'high', 'ultra'].includes(quality)) {
      this.tuning.quality = quality;
      this.saveTuning();
      this.performSyncResize();
    }
  }

  // =========================================================================
  // Unified Visual Audio Response Preprocessor
  // =========================================================================
  processAudioResponse(audioData, isPlaying) {
    const ap = this.audioProcessor;
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0.001, (now - ap.lastTime) * 0.001));
    ap.lastTime = now;

    const cfg = this.tuning?.audioResponse || this.defaultTuning.audioResponse;
    const attackMs = Math.max(2, cfg.attackMs !== undefined ? cfg.attackMs : 35);
    const releaseMs = Math.max(20, cfg.releaseMs !== undefined ? cfg.releaseMs : 300);

    const attackRate = 1.0 - Math.exp(-dt / (attackMs * 0.001));
    const releaseRate = 1.0 - Math.exp(-dt / (releaseMs * 0.001));

    const raw = audioData && isPlaying ? audioData.frequency : null;
    const rawLen = raw ? raw.length : 0;
    const len = ap.processedFreqs.length;

    if (raw && rawLen > 0) {
      const isLog = cfg.distribution !== 'linear';
      const minBin = 1;
      const maxBin = Math.floor(rawLen * 0.72);

      for (let i = 0; i < len; i++) {
        const norm = i / (len - 1);
        let centerBin;
        if (isLog) {
          centerBin = Math.floor(minBin * Math.pow(maxBin / minBin, norm));
        } else {
          centerBin = Math.floor(minBin + norm * (maxBin - minBin));
        }
        centerBin = Math.max(0, Math.min(rawLen - 1, centerBin));

        const win = Math.max(1, Math.floor(centerBin * 0.08));
        let sum = 0, count = 0;
        const bStart = Math.max(0, centerBin - win);
        const bEnd = Math.min(rawLen - 1, centerBin + win);
        for (let k = bStart; k <= bEnd; k++) {
          sum += raw[k];
          count++;
        }
        let energy = ((sum / count) / 255) * this.intensity;

        // Visual frequency band weighting
        if (norm < 0.16) {
          energy *= (cfg.bassScale !== undefined ? cfg.bassScale : 1.0);
        } else if (norm < 0.65) {
          energy *= (cfg.midScale !== undefined ? cfg.midScale : 1.0);
        } else {
          energy *= (cfg.highScale !== undefined ? cfg.highScale : 1.0);
        }

        // Visual spectrum compression
        const comp = cfg.compression !== undefined ? cfg.compression : 0.45;
        if (energy > 0) {
          energy = Math.pow(energy, 1.0 - comp * 0.5);
        }

        ap.targetBuffer[i] = Math.min(1.5, Math.max(0, energy));
      }

      // Peak softening across adjacent bins
      const softMode = cfg.peakSoftening || 'soft';
      if (softMode === 'soft') {
        for (let i = 0; i < len; i++) {
          const p0 = ap.targetBuffer[Math.max(0, i - 1)];
          const p1 = ap.targetBuffer[i];
          const p2 = ap.targetBuffer[Math.min(len - 1, i + 1)];
          ap.softenedBuffer[i] = p0 * 0.25 + p1 * 0.5 + p2 * 0.25;
        }
      } else if (softMode === 'medium') {
        for (let i = 0; i < len; i++) {
          const p0 = ap.targetBuffer[Math.max(0, i - 2)];
          const p1 = ap.targetBuffer[Math.max(0, i - 1)];
          const p2 = ap.targetBuffer[i];
          const p3 = ap.targetBuffer[Math.min(len - 1, i + 1)];
          const p4 = ap.targetBuffer[Math.min(len - 1, i + 2)];
          ap.softenedBuffer[i] = p0 * 0.1 + p1 * 0.2 + p2 * 0.4 + p3 * 0.2 + p4 * 0.1;
        }
      } else if (softMode === 'heavy') {
        for (let i = 0; i < len; i++) {
          let s = 0;
          for (let d = -3; d <= 3; d++) {
            s += ap.targetBuffer[Math.max(0, Math.min(len - 1, i + d))];
          }
          ap.softenedBuffer[i] = s / 7;
        }
      } else {
        for (let i = 0; i < len; i++) {
          ap.softenedBuffer[i] = ap.targetBuffer[i];
        }
      }

      // Attack / Release time-based smoothing
      const smoothFactor = cfg.smoothFactor !== undefined ? cfg.smoothFactor : 0.70;
      for (let i = 0; i < len; i++) {
        const target = ap.softenedBuffer[i];
        const curr = ap.processedFreqs[i];
        const rate = target > curr ? attackRate : releaseRate;
        const effectiveRate = rate * (1.0 - smoothFactor * 0.45);
        ap.processedFreqs[i] += (target - curr) * Math.max(0.01, effectiveRate);
      }
    } else {
      // Resting decay with release rate
      for (let i = 0; i < len; i++) {
        ap.processedFreqs[i] += (0 - ap.processedFreqs[i]) * releaseRate;
      }
    }

    return ap.processedFreqs;
  }

  getFrequencyAt(norm, symmetry = 'none') {
    let t = Math.max(0, Math.min(1, norm));
    if (symmetry === '2x') {
      t = t < 0.5 ? t * 2 : (1.0 - t) * 2;
    } else if (symmetry === '4x') {
      const q = (t * 4) % 1.0;
      t = q < 0.5 ? q * 2 : (1.0 - q) * 2;
    } else if (symmetry === '8x') {
      const o = (t * 8) % 1.0;
      t = o < 0.5 ? o * 2 : (1.0 - o) * 2;
    }
    const len = this.audioProcessor.processedFreqs.length;
    const idxFloat = t * (len - 1);
    const i0 = Math.floor(idxFloat);
    const i1 = Math.min(len - 1, i0 + 1);
    const frac = idxFloat - i0;
    return this.audioProcessor.processedFreqs[i0] * (1 - frac) + this.audioProcessor.processedFreqs[i1] * frac;
  }

  setInteractionQuality(active) {
    clearTimeout(this._interactionRestore);
    if(active) {this._interactionQuality=true;this.performSyncResize();}
    else this._interactionRestore=setTimeout(()=>{this._interactionQuality=false;this.performSyncResize();},100);
  }

  render() {
    if (!this.ctx || !this.width || !this.height) return;
    if (this.isEnabled === false) return;

    if (this.isFrozenForTransition || this.isPaused || document.hidden) {
      this._lastWaveTime = null;
      return;
    }

    const playerView = document.getElementById('view-player');
    if (playerView && playerView.style.display === 'none') {
      this._lastWaveTime = null;
      return;
    }

    const now = performance.now();
    this._waveFrameScale = this._lastWaveTime == null ? 1 : Math.min(3, Math.max(0, (now - this._lastWaveTime) / (1000 / 60)));
    this._lastWaveTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const audioData = this.audioEngine ? this.audioEngine.getAudioData() : null;
    const isPlaying = this.audioEngine ? this.audioEngine.isPlaying : false;

    // Run unified audio preprocessor
    this.processAudioResponse(audioData, isPlaying);

    const targetBass = (audioData && isPlaying ? audioData.bassEnergy : 0.04) * this.intensity;
    const targetMid = (audioData && isPlaying ? audioData.midEnergy : 0.04) * this.intensity;
    const targetHigh = (audioData && isPlaying ? audioData.highEnergy : 0.04) * this.intensity;

    // Transient beat detector
    const bassDelta = Math.max(0, targetBass - this.smoothedBass);
    if (bassDelta > 0.05) {
      this.ambientPulse = Math.min(1.6, (this.ambientPulse || 0) + bassDelta * 3.0);
    }
    if (this.ambientPulse > 0.005) {
      this.ambientPulse *= 0.91;
    } else {
      this.ambientPulse = 0;
    }

    const energyScale = this.mode === 'wave' ? this._waveFrameScale : 1;
    this.smoothedBass += (targetBass - this.smoothedBass) * (1 - Math.pow(0.82, energyScale));
    this.smoothedMid += (targetMid - this.smoothedMid) * (1 - Math.pow(0.82, energyScale));
    this.smoothedHigh += (targetHigh - this.smoothedHigh) * (1 - Math.pow(0.78, energyScale));

    switch (this.mode) {
      case 'reactive':
        this.drawReactiveLines(ctx, audioData, isPlaying);
        break;
      case 'curtain':
        this.drawRhythmCurtain(ctx, audioData, isPlaying);
        break;
      case 'wave':
        this.drawLiquidWave(ctx, audioData, isPlaying);
        break;
      case 'spectrum':
        this.drawCircularSpectrum(ctx, audioData, isPlaying);
        break;
      case 'sphere':
        this.drawSphericalSpectrum(ctx, audioData, isPlaying);
        break;
      case 'bars':
        this.drawHorizontalBars(ctx, audioData, isPlaying);
        break;
      case 'orb':
        this.drawCyberParticleWave(ctx, audioData, isPlaying);
        break;
      case 'ambient':
        this.drawAuroraFluid(ctx, audioData, isPlaying);
        break;
      default:
        this.drawLiquidWave(ctx, audioData, isPlaying);
        break;
    }
    this.applyPalette(ctx);
  }

  // Broad, separated curves: no perspective mesh or sub-pixel distant lines.
  // High-response curves driven by separate FFT bands, or one full-band PCM curve.
  // Independent depth layers: a vivid front wave, pale companion, quiet distant wave.
  drawNeonRibbon(ctx,audioData,isPlaying,t,count,key) {
    const w=this.width,h=this.height,dt=Math.min(3,this._waveFrameScale??1),points=128;
    const state=(this._ribbonStates ||= {})[key] ||= {};
    if(state.values?.length!==points*3)state.values=new Float32Array(points*3);
    const raw=isPlaying?audioData?.timeDomain:null;
    const span=Math.max(.04,Math.min(1,(t.density??8)/12));
    const gain=2.5; // Overall amplitude is the single strength control.
    const detail=1-Math.max(0,Math.min(1,t.curveSmooth??(1-(t.detail??.8))));
    const edgeStability=Math.max(0,Math.min(1,t.edgeStability??.85));
    const divergence=0;
    const mix=0; // One detail filter, shared by all traces.
    const follow=1-Math.exp(-(dt*1000/60)/(12+Math.pow(1-(t.response??.85),2)*250));
    const amplitude=Math.min(h*.46,h*.18*(t.amplitude??t.strength??1)*this.intensity);
    const separation=Math.max(0,Math.min(2,t.separation??.55));
    const idleMotion=Math.max(0,Math.min(2,t.idleMotion??.18));
    const flowSeparation=Math.max(0,Math.min(2,t.flowSeparation??0));
    const driftSpeed=Math.max(0,Math.min(4,t.driftSpeed??1));
    const direction=t.driftDirection??'right';
    state.drift=(state.drift||0)+dt*.018*driftSpeed*(direction==='left'?-1:direction==='right'?1:0);
    state.breath=(state.breath||0)+dt*.015*driftSpeed;
    const breath=.72+.28*Math.sin(state.breath);
    const glow=key==='wave'?Math.min(3,(t.glowBlur??18)/25):Math.min(3,t.glow??.8);
    const lineWidth=t.lineWidth??3,cy=Math.max(h*.33,Math.min(h*.67,this.getAnchorPoint().cy));
    const gradients=[['#4777ac','#8060c1','#684184'],['#c8e5f1','#dae6ff','#b6c6e5'],['#40a9de','#ab85fb','#c45395']].map(colors=>{
      const g=ctx.createLinearGradient(0,0,w,0);colors.forEach((c,i)=>g.addColorStop(i/2,c));return g;
    });
    // Back-to-front: each layer has its own curvature, amplitude and brightness.
    const layers=[{amp:.72,width:.38,alpha:.46,shift:.65,rate:.91},
      {amp:.78,width:.43,alpha:.78,shift:.10,rate:1.03},
      {amp:1,width:1,alpha:.94,shift:0,rate:1}];
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let row=0;row<3;row++){
      const layer=layers[row],p=new Path2D();let lx=0,ly=cy;
      for(let i=0;i<points;i++){
        const u=i/(points-1);let value=0,local=0;
        if(raw?.length){
          // All three traces come directly from the same live PCM buffer, like Single/Full-band.
          // Neighbouring sample windows and filter widths create depth without synthetic waves.
          const length=raw.length-1,windowLength=length*span;
          const offset=(1-span)*length*(.5);
          const at=Math.max(0,Math.min(length,offset+u*windowLength));
          const left=Math.floor(at),right=Math.min(length,left+1);
          const direct=((raw[left]*(1-(at-left))+raw[right]*(at-left))-128)/128;
          const radius=Math.round((1-detail)*24);
          for(let j=-radius;j<=radius;j++)local+=(raw[Math.max(0,Math.min(length,Math.round(at)+j))]-128)/128;
          local/=(radius*2+1);
          value=direct*mix+local*(1-mix);
          // Detail slider also suppresses fine oscillations when raw mix is high.
          value=value*detail+local*(1-detail);
        }
        const idx=row*points+i,target=Math.tanh(value*gain);
        state.values[idx]+=(target-state.values[idx])*Math.min(1,follow*(row===2?1:row===1?.95:.90));
        const position=u-state.drift/(Math.PI*3);
        const gentle=(Math.sin(position*Math.PI*3)*.6+Math.sin(position*Math.PI*5)*.25)*(direction==='still'?breath:1);
        const audio=state.values[idx];
        const audioScale=1+(row-1)*separation*.45;
        const audioExtension=(row-1)*separation*.12*Math.abs(audio);
        const flowScale=1+(row-1)*flowSeparation*.45;
        const flowExtension=(row-1)*flowSeparation*.12;
        // Independent controls: background travel never increases the audio trace separation.
        const flowAmplitude=Math.min(h*.42,h*.18*idleMotion*this.intensity);
        // Taper only audio transients near the outer 18%; retain each trace's flowing endpoints.
        const edgePosition=Math.min(1,Math.min(u,1-u)/.18);
        const edgeEnvelope=edgePosition*edgePosition*(3-2*edgePosition);
        const audioWeight=1-edgeStability*(1-edgeEnvelope);
        const displacement=amplitude*(audio*audioScale+audioExtension)*audioWeight+flowAmplitude*(gentle*flowScale+flowExtension);
        const y=Math.max(4,Math.min(h-4,cy+displacement)),x=u*w;
        if(!i)p.moveTo(x,y);else p.quadraticCurveTo(lx,ly,(lx+x)/2,(ly+y)/2);lx=x;ly=y;
      }
      p.lineTo(lx,ly);
      const width=Math.max(1,lineWidth*layer.width),alpha=layer.alpha;
      ctx.strokeStyle=gradients[row];
      if(glow>0)for(const [scale,opacity] of [[4,.05],[2,.10]]){ctx.lineWidth=width*scale;ctx.globalAlpha=alpha*opacity*glow;ctx.stroke(p);}
      ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke(p);
      if(glow>0&&row===1){ctx.strokeStyle='#effcff';ctx.lineWidth=Math.max(.65,width*.45);ctx.globalAlpha=glow*.45;ctx.stroke(p);}
    }
    ctx.restore();
  }

  drawReactiveLines(ctx, audioData, isPlaying) {
    const t = this.tuning.reactive;
    if(t.layout==='ribbon')return this.drawNeonRibbon(ctx,audioData,isPlaying,t,3,'reactive');
    const dt = this._waveFrameScale ?? 1;
    this._reactivePhase = (this._reactivePhase || 0) + dt * 0.055;
    const count = t.layout === 'single' ? 1 : 3;
    const points = 96;
    const values = this._reactiveY || (this._reactiveY = new Float32Array(points * 3));
    const bands = this._reactiveBands || (this._reactiveBands = new Float32Array(3));
    const freq = isPlaying && audioData ? audioData.frequency : null;
    const pcm = isPlaying && audioData ? audioData.timeDomain : null;
    const energies = isPlaying && audioData ? [audioData.bassEnergy, audioData.midEnergy, audioData.highEnergy] : [0,0,0];
    const alpha = 1 - Math.exp(-(dt * 1000 / 60) / (12 + (t.smoothing ?? .2) * 130));
    const w = this.width, h = this.height;
    const cy = Math.max(h * .36, Math.min(h * .64, this.getAnchorPoint().cy));
    const strength = (t.strength ?? 1.8) * this.intensity;
    const colors = ['#38bdf8','#c084fc','#fb7185'];
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(let row=0;row<count;row++) {
      const targetEnergy = count === 1 ? Math.max(...energies) : energies[row];
      bands[row] += (Math.min(1, Math.sqrt(targetEnergy || 0) * strength) - bands[row]) * alpha;
      const baseline = cy + (row - (count-1)/2) * h * .22;
      const path = new Path2D();let lastX=0,lastY=baseline;
      const ranges = [0,.08,.4,1];
      for(let i=0;i<points;i++) {
        const u=i/(points-1);let displacement=0;
        if(count===1 && pcm && pcm.length) {
          const at=Math.min(pcm.length-1,Math.floor(u*(pcm.length-1)));
          displacement=Math.tanh((pcm[at]-128)/128 * strength * 1.6) * h*.23;
        } else if(freq && freq.length) {
          const at=Math.min(freq.length-1,Math.floor((ranges[row]+u*(ranges[row+1]-ranges[row]))*(freq.length-1)));
          const local=freq[at]/255;
          const carrier=Math.sin(u*Math.PI*(6+row*8)-this._reactivePhase*(1+row*.6));
          displacement=carrier*(.3+local*.7)*bands[row]*h*.14;
        }
        const idx=row*points+i;values[idx]+=(displacement-values[idx])*alpha;
        const x=u*w,y=baseline+values[idx];
        if(i===0)path.moveTo(x,y);else path.quadraticCurveTo(lastX,lastY,(lastX+x)/2,(lastY+y)/2);
        lastX=x;lastY=y;
      }
      path.lineTo(lastX,lastY);
      ctx.strokeStyle=colors[row];ctx.globalAlpha=.12;ctx.lineWidth=(t.lineWidth||3)*3;ctx.stroke(path);
      ctx.globalAlpha=.85;ctx.lineWidth=t.lineWidth||3;ctx.stroke(path);
    }
    ctx.restore();
  }

  // Broad translucent light columns. No fine lines, shadows or per-pixel reads.
  drawRhythmCurtain(ctx, audioData, isPlaying) {
    const t=this.tuning.curtain, dt=this._waveFrameScale??1;
    this._curtainPhase=(this._curtainPhase||0)+.008*dt*(t.speed??1);
    const bands=this._curtainBands||(this._curtainBands=new Float32Array(3));
    const energy=isPlaying&&audioData?[audioData.bassEnergy,audioData.midEnergy,audioData.highEnergy]:[0,0,0];
    const w=this.width,h=this.height;
    const colors=[[56,189,248],[167,139,250],[244,114,182]];
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<3;i++) {
      const target=Math.min(1,Math.sqrt(energy[i]||0)*(t.strength??1.5)*this.intensity);
      const a=1-Math.exp(-(dt*1000/60)/(target>bands[i]?25:240));bands[i]+=(target-bands[i])*a;
      const center=w*((i+.5)/3+Math.sin(this._curtainPhase+i*1.8)*.08);
      const half=w*(t.width??.32)*(1+bands[i]*.3);
      const rgb=colors[i].join(',');
      const opacity=.025+bands[i]*.38;
      const grad=ctx.createLinearGradient(center-half,0,center+half,0);
      grad.addColorStop(0,'rgba('+rgb+',0)');
      grad.addColorStop(.25,'rgba('+rgb+','+opacity*.3+')');
      grad.addColorStop(.5,'rgba('+rgb+','+opacity+')');
      grad.addColorStop(.75,'rgba('+rgb+','+opacity*.3+')');
      grad.addColorStop(1,'rgba('+rgb+',0)');
      ctx.fillStyle=grad;ctx.fillRect(center-half,0,half*2,h);
    }
    ctx.restore();
  }

  drawLiquidWave(ctx, audioData, isPlaying) {
    const w = this.width, h = this.height;
    const t = this.tuning.wave;
    if(t.style==='ribbon')return this.drawNeonRibbon(ctx,audioData,isPlaying,t,Math.max(3,Math.min(5,Math.round(t.lineCount||3))),'wave');
    const count = Math.max(3, Math.min(5, Math.round(t.lineCount || 4)));
    const dt = this._waveFrameScale ?? 1;
    this.wavePhase += (0.012 + this.smoothedBass * 0.02) * (t.flowSpeed ?? 1) * dt;
    const phase = this.wavePhase;
    const samples = this.smoothedWaveform;
    const raw = isPlaying && audioData ? audioData.timeDomain : null;
    const smoothing = Math.max(0, Math.min(1, t.smoothing ?? 0.70));
    // 25–240ms response time, independent of the display refresh rate.
    const follow = 1 - Math.exp(-(dt * 1000 / 60) / (25 + smoothing * 215));
    // Average audio bins instead of point-sampling high-frequency oscillations.
    for (let i = 0; i < samples.length; i++) {
      let value = 0;
      if (raw && raw.length) {
        const from = Math.floor(i * raw.length / samples.length);
        const to = Math.min(raw.length, Math.max(from + 1, Math.floor((i + 1) * raw.length / samples.length)));
        for (let j = from; j < to; j++) value += (raw[j] - 128) / 128;
        value = Math.tanh(value / (to - from) * this.intensity);
      }
      samples[i] += (value - samples[i]) * follow;
    }
    const points = 64;
    const shared = this._simpleWaveY || (this._simpleWaveY = new Float32Array(points));
    const amplitude = Math.min(h * 0.16, h * 0.07 * (t.amplitude ?? 1) * this.visScale);
    for (let i = 0; i < points; i++) {
      const u = i / (points - 1);
      const at = Math.round(u * (samples.length - 1));
      let smooth = 0;
      for (let j = -4; j <= 4; j++) smooth += samples[Math.max(0, Math.min(samples.length - 1, at + j))];
      shared[i] = amplitude * (Math.sin(u * Math.PI * 2.2 - phase) * 0.6 + Math.sin(u * Math.PI * 3.8 + phase * 0.7) * 0.2 + smooth / 9 * 0.55);
    }
    const lineWidth = Math.max(2, t.lineWidth ?? 4.2);
    const gap = Math.max(lineWidth * 5, Math.min(h * 0.12, h * 0.065 * (t.depthLength ?? 1.2)));
    const margin = gap * (count - 1) / 2 + amplitude * 1.4 + 12;
    const center = Math.max(Math.min(margin, h / 2), Math.min(h - margin, this.getAnchorPoint().cy));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#38bdf8'); grad.addColorStop(0.5, '#a5b4fc'); grad.addColorStop(1, '#e879f9');
    for (let row = 0; row < count; row++) {
      const path = new Path2D();
      let lastX = 0, lastY = 0;
      for (let i = 0; i < points; i++) {
        const x = i * w / (points - 1);
        // Common displacement plus a bounded ripple: adjacent curves cannot cross.
        const y = center + (row - (count - 1) / 2) * gap + shared[i] + Math.sin(i * 0.055 + phase * 0.6 + row) * gap * 0.12;
        if (i === 0) path.moveTo(x, y);
        else path.quadraticCurveTo(lastX, lastY, (lastX + x) / 2, (lastY + y) / 2);
        lastX = x; lastY = y;
      }
      path.lineTo(lastX, lastY);
      const alpha = row === Math.floor(count / 2) ? 1 : Math.max(0.15, t.companionAlpha ?? 0.8) * 0.72;
      if ((t.glowBlur ?? 18) > 0) {
        ctx.globalAlpha = alpha * 0.12;
        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth * (1.5 + Math.min(40, t.glowBlur ?? 18) / 20);
        ctx.stroke(path);
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = grad;
      ctx.lineWidth = lineWidth;
      ctx.stroke(path);
    }
    ctx.restore();
  }


  // =========================================================================
  // 2. Circular Neon Spectrum Halo ("环形" - 结构保留，对数映射/对称/旋转/渐细优化)
  // =========================================================================
  drawCircularSpectrum(ctx, audioData, isPlaying) {
    const w = this.width;
    const h = this.height;
    const tSpec = this.tuning?.spectrum || this.defaultTuning.spectrum;
    const targetBarCount = Math.max(32, Math.min(128, tSpec.barCount || 64));

    if (!this.smoothedSpectrum || this.smoothedSpectrum.length !== targetBarCount) {
      this.smoothedSpectrum = new Float32Array(targetBarCount).fill(0);
    }
    const barCount = this.smoothedSpectrum.length;
    const { cx, cy } = this.getAnchorPoint();
    const stageMin = Math.min(w, h);
    const isFullscreen = document.body.classList.contains('visualizer-fullscreen-active') || !!window.isStageFullscreen;

    const baseInnerRatio = (isFullscreen ? 0.22 : 0.16) * this.visScale * (tSpec.innerRadiusRatio || 1.0);
    const innerR = Math.max(50, Math.min(stageMin * baseInnerRatio, isFullscreen ? 480 : 250)) + this.smoothedBass * 14;
    const maxBarLen = Math.max(70, Math.min(stageMin * (isFullscreen ? 0.40 : 0.28), isFullscreen ? 680 : 360)) * this.visScale * (tSpec.barLengthRatio || 1.0);

    const symmetry = tSpec.symmetry || 'none';
    const smoothFactor = tSpec.smoothFactor !== undefined ? tSpec.smoothFactor : 0.60;
    const radialComp = tSpec.radialCompression !== undefined ? tSpec.radialCompression : 0.35;
    const rotOffset = ((tSpec.rotAngle || 0) * Math.PI) / 180;
    const taper = tSpec.taper !== undefined ? tSpec.taper : 0.20;

    // Update spectrum values from preprocessed audio layer
    if (audioData && isPlaying) {
      for (let i = 0; i < barCount; i++) {
        const norm = i / barCount;
        let val = this.getFrequencyAt(norm, symmetry);
        // Radial compression
        val = Math.pow(val, 1.0 - radialComp * 0.4);
        const speed = (1.0 - smoothFactor * 0.65) * 0.45;
        this.smoothedSpectrum[i] += (val - this.smoothedSpectrum[i]) * Math.max(0.08, speed);
      }
    } else {
      for (let i = 0; i < barCount; i++) {
        this.smoothedSpectrum[i] *= 0.91;
      }
    }

    ctx.save();

    // 1. Inner Neon Ring
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(138, 196, 255, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = 'rgba(138, 196, 255, 0.7)';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // Inner Concentric Dashed Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.72, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 6]);
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.restore();

    // 2. Radiant Spectrum Needles with Tapering
    const baseWidth = Math.max(1.2, (stageMin / 500) * (tSpec.barWidth || 2.4));
    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2 + rotOffset;
      const val = this.smoothedSpectrum[i];
      const barLen = Math.max(4, val * maxBarLen);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const x1 = cx + cos * (innerR + 3);
      const y1 = cy + sin * (innerR + 3);
      const x2 = cx + cos * (innerR + 3 + barLen);
      const y2 = cy + sin * (innerR + 3 + barLen);

      const hue = 195 + (i / barCount) * 120;
      ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${0.45 + val * 0.55})`;
      const tipWidth = Math.max(0.8, baseWidth * (1.0 - taper * 0.75));
      ctx.lineWidth = tipWidth;
      ctx.lineCap = 'round';
      ctx.shadowColor = `hsla(${hue}, 90%, 65%, 0.8)`;
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Glowing tip highlight
      if (barLen > 10) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x2, y2, Math.max(1.2, tipWidth * 0.65), 0, Math.PI * 2);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // 3. Spherical 3D Pulse Spectrum ("球形" - 重点：多重频谱对称/低频扩散/空间纵深)
  // 默认：2重对称 (LOW -> MID -> HIGH -> MID -> LOW)，彻底解决单侧失衡偏斜问题
  // =========================================================================
  updateSphereLights(audioData,isPlaying) {
    const t=this.tuning.sphere,dt=Math.max(0,(this._waveFrameScale??1)*1000/60);
    const state=this._sphereLights ||= {values:new Float32Array(64),average:new Float32Array(64)};
    const freq=isPlaying?audioData?.frequency:null,mode=t.lightMode??'beat';
    for(let i=0;i<64;i++){
      const u=(i%32)/31,at=freq?.length?Math.min(freq.length-1,Math.floor(Math.pow(u,2)*freq.length*.7)):0;
      const level=freq?.length?freq[at]/255:0;
      const onset=Math.max(0,level-state.average[i]);
      state.average[i]+=(level-state.average[i])*(1-Math.exp(-dt/350));
      const target=mode==='steady'?1:Math.min(1,Math.max(0,(mode==='energy'?level-.08:onset-.018))*(t.lightSensitivity??3));
      const ms=target>state.values[i]?12:Math.max(30,t.lightDecay??120);
      state.values[i]+=(target-state.values[i])*(1-Math.exp(-dt/ms));
    }
    return state.values;
  }

  drawSphericalSpectrum(ctx, audioData, isPlaying) {
    const w = this.width;
    const h = this.height;
    const { cx, cy } = this.getAnchorPoint();
    const stageMin = Math.min(w, h);
    const isFullscreen = document.body.classList.contains('visualizer-fullscreen-active') || !!window.isStageFullscreen;
    const tSphere = this.tuning?.sphere || this.defaultTuning.sphere;
    const lights=this.updateSphereLights(audioData,isPlaying);

    const baseSphereRatio = (isFullscreen ? 0.28 : 0.18) * this.visScale * (tSphere.radiusRatio || 1.0);
    const maxSphereRadius = (isFullscreen ? 560 : 260) * this.visScale * (tSphere.radiusRatio || 1.0);
    const baseR = Math.max(50, Math.min(stageMin * baseSphereRatio, maxSphereRadius));
    const sphereRadius = baseR * (1 + this.smoothedBass * 0.20);

    const rotSpeed = tSphere.rotSpeed !== undefined ? tSphere.rotSpeed : 1.0;
    this.sphereRotX += (0.007 + this.smoothedBass * 0.008) * rotSpeed;
    this.sphereRotY += (0.012 + this.smoothedHigh * 0.012) * rotSpeed;

    const rotX = this.sphereRotX;
    const rotY = this.sphereRotY + ((tSphere.rotAngle || 0) * Math.PI) / 180;

    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);

    const depthRatio = tSphere.depthRatio !== undefined ? tSphere.depthRatio : 0.60;
    const fov = Math.max(420, stageMin * (1.1 + (1.0 - depthRatio) * 0.8));

    ctx.save();

    // 1. Draw 3D Latitude Rings
    const latSteps = 5;
    for (let l = 1; l < latSteps; l++) {
      const latAngle = (l / latSteps) * Math.PI - Math.PI / 2;
      const latR = sphereRadius * Math.cos(latAngle);
      const latY = sphereRadius * Math.sin(latAngle);

      ctx.beginPath();
      const ringSegments = 36;
      for (let s = 0; s <= ringSegments; s++) {
        const segAngle = (s / ringSegments) * Math.PI * 2;
        const x = latR * Math.cos(segAngle);
        const y = latY;
        const z = latR * Math.sin(segAngle);

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const proj = fov / (fov + z2);
        const px = cx + x1 * proj;
        const py = cy + y2 * proj;

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(138, 196, 255, ${0.15 + this.smoothedMid * 0.16})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 2. Draw 3D Longitude Meridian Rings
    const lonSteps = 6;
    for (let m = 0; m < lonSteps; m++) {
      const lonAngle = (m / lonSteps) * Math.PI;
      ctx.beginPath();
      const ringSegments = 36;
      for (let s = 0; s <= ringSegments; s++) {
        const segAngle = (s / ringSegments) * Math.PI * 2;
        const x = sphereRadius * Math.cos(segAngle) * Math.cos(lonAngle);
        const y = sphereRadius * Math.sin(segAngle);
        const z = sphereRadius * Math.cos(segAngle) * Math.sin(lonAngle);

        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const proj = fov / (fov + z2);
        const px = cx + x1 * proj;
        const py = cy + y2 * proj;

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.13 + this.smoothedMid * 0.15})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }

    // 3. Central Luminous Plasma Core
    const coreGlow = (tSphere.coreGlow ?? .7)*(.15+.85*lights.reduce((a,b)=>a+b,0)/lights.length);
    if (coreGlow > 0.02) {
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sphereRadius * 1.05);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.45 * coreGlow})`);
      coreGrad.addColorStop(0.35, `rgba(138, 196, 255, ${(0.15 + this.smoothedBass * 0.22) * coreGlow})`);
      coreGrad.addColorStop(0.75, `rgba(168, 85, 247, ${(0.08 + this.smoothedMid * 0.15) * coreGlow})`);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius * 1.05, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Surface Starlight Nodes with Frequency Symmetry
    const nodeCount = 64;
    const nodes = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const symmetry = tSphere.symmetry || '2x'; // 2重对称 by default!
    const bassDiffusion = tSphere.bassDiffusion !== undefined ? tSphere.bassDiffusion : 0.35;
    const backAlpha = tSphere.backAlpha !== undefined ? tSphere.backAlpha : 0.45;

    for (let i = 0; i < nodeCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / nodeCount);

      // Symmetrical frequency sampling
      const normAngle = (theta / (Math.PI * 2) + 1.0) % 1.0;
      let rawVal = this.getFrequencyAt(normAngle, symmetry);

      // Low-frequency spatial diffusion to prevent single-spot bulging
      rawVal = rawVal * (1.0 - bassDiffusion * 0.5) + this.smoothedBass * (bassDiffusion * 0.65);

      const nx = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      const nz = Math.sin(phi) * Math.sin(theta);

      const rBase = sphereRadius * (1.0 + rawVal * 0.22);
      const bx = nx * rBase;
      const by = ny * rBase;
      const bz = nz * rBase;

      const bx1 = bx * cosY + bz * sinY;
      const bz1 = -bx * sinY + bz * cosY;
      const by2 = by * cosX - bz1 * sinX;
      const bz2 = by * sinX + bz1 * cosX;

      const proj = fov / (fov + bz2);
      nodes.push({
        z: bz2,
        val: rawVal,
        light: lights[i],
        proj,
        x: cx + bx1 * proj,
        y: cy + by2 * proj,
        hue: 195 + (i / nodeCount) * 125
      });
    }

    // Depth sort from back to front
    nodes.sort((a, b) => a.z - b.z);

    const nodeSize = tSphere.nodeSize || 1.0;
    nodes.forEach(n => {
      // Back transparency attenuation for nodes behind sphere center
      const isBehind = n.z > 0;
      const illumination=(tSphere.idleLight??.04)+(1-(tSphere.idleLight??.04))*n.light;
      const baseAlpha = (isBehind ? backAlpha : 1.0)*illumination;
      const nodeR = Math.max(1.2, (1.5 + n.light * 4.2) * n.proj * nodeSize);

      ctx.fillStyle = `rgba(255, 255, 255, ${baseAlpha})`;
      ctx.shadowColor = `hsla(${n.hue}, 90%, 65%, ${baseAlpha * 0.9})`;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(n.x, n.y, nodeR, 0, Math.PI * 2);
      ctx.fill();

      if (n.light > 0.08 && !isBehind) {
        ctx.fillStyle = `hsla(${n.hue}, 90%, 65%, ${0.45 * baseAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeR * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  // =========================================================================
  // 4. Horizontal HiFi Spectrum Bars ("柱谱" - 频率排列/间距/圆角/峰值停留时间及衰减)
  // =========================================================================
  drawHorizontalBars(ctx, audioData, isPlaying) {
    const w = this.width;
    const h = this.height;
    const { cx, cy } = this.getAnchorPoint();
    const isFullscreen = document.body.classList.contains('visualizer-fullscreen-active') || !!window.isStageFullscreen;
    const time = Date.now() * 0.002;
    const tBars = this.tuning?.bars || this.defaultTuning.bars;

    const barCount = Math.max(16, Math.min(256, tBars.barCount || 64));
    const slotWidth = w / barCount;
    const barGapRatio = tBars.barGap !== undefined ? tBars.barGap : 0.35;
    const barWidthRatio = tBars.barWidthRatio !== undefined ? tBars.barWidthRatio : (1.0 - barGapRatio);
    const barWidth = Math.max(2, slotWidth * Math.max(0.15, Math.min(0.95, barWidthRatio)));
    const gap = slotWidth - barWidth;
    const startX = gap / 2;

    if (!this.barSpectrum || this.barSpectrum.length !== barCount) {
      this.barSpectrum = new Float32Array(barCount);
      this.peakBars = new Float32Array(barCount);
      this.peakHoldCounter = new Int32Array(barCount);
    }

    const freqOrder = tBars.freqOrder || 'asc';
    const peakHoldMs = tBars.peakHoldMs !== undefined ? tBars.peakHoldMs : 300;
    const peakDecaySpeed = tBars.peakDecaySpeed !== undefined ? tBars.peakDecaySpeed : 1.0;
    const maxHoldFrames = Math.max(1, Math.round(peakHoldMs / 16.6));

    if (audioData && isPlaying) {
      for (let i = 0; i < barCount; i++) {
        let norm;
        if (freqOrder === 'desc') {
          norm = 1.0 - i / (barCount - 1);
        } else if (freqOrder === 'center_bass') {
          // HIGH MID LOW | LOW MID HIGH
          norm = Math.abs((i - barCount * 0.5) / (barCount * 0.5));
        } else if (freqOrder === 'center_treble') {
          // LOW MID HIGH | HIGH MID LOW
          norm = 1.0 - Math.abs((i - barCount * 0.5) / (barCount * 0.5));
        } else if (freqOrder === 'mirror') {
          norm = i < barCount * 0.5 ? (i / (barCount * 0.5)) : (1.0 - (i - barCount * 0.5) / (barCount * 0.5));
        } else {
          norm = i / (barCount - 1); // 'asc' default
        }

        const val = this.getFrequencyAt(norm);
        const speed = val > this.barSpectrum[i] ? 0.40 : 0.14;
        this.barSpectrum[i] += (val - this.barSpectrum[i]) * speed;
      }
    } else {
      for (let i = 0; i < barCount; i++) {
        this.barSpectrum[i] *= 0.90;
      }
    }

    // Keep smoothedSpectrum updated for tests
    if (this.smoothedSpectrum && this.smoothedSpectrum.length >= 64) {
      for (let k = 0; k < 64; k++) {
        const idx = Math.min(barCount - 1, Math.floor((k / 64) * barCount));
        this.smoothedSpectrum[k] = this.barSpectrum[idx];
      }
    }

    const baselineY = this.positionPreset === 'behind' ? cy + 60 : cy;
    let maxAllowedH = Math.min(h * (isFullscreen ? 0.42 : 0.30), isFullscreen ? 460 : 260);
    if (this.positionPreset === 'below') {
      const metaEl = document.getElementById('track-meta');
      let metaBottom = cy - 80;
      if (metaEl && this.canvas) {
        const mRect = metaEl.getBoundingClientRect();
        const cRect = this.canvas.getBoundingClientRect();
        if (mRect.height > 0 && cRect.height > 0) {
          metaBottom = mRect.bottom - cRect.top;
        }
      }
      const safeClearance = Math.max(30, baselineY - metaBottom - 16);
      maxAllowedH = Math.min(maxAllowedH, safeClearance);
    }
    const heightRatio = typeof tBars.heightRatio === 'number' ? tBars.heightRatio : 1.0;
    const maxBarHeight = maxAllowedH * this.visScale * heightRatio;
    const cornerRadiusFactor = tBars.cornerRadius !== undefined ? tBars.cornerRadius : 0.50;
    const cornerR = (barWidth / 2) * cornerRadiusFactor;

    ctx.save();

    for (let i = 0; i < barCount; i++) {
      const val = this.barSpectrum[i];
      const barHeight = Math.max(4, val * maxBarHeight);
      const x = startX + i * slotWidth;
      const y = baselineY - barHeight;

      // Peak hold logic with configurable hold ms & decay speed
      if (barHeight >= this.peakBars[i]) {
        this.peakBars[i] = barHeight;
        this.peakHoldCounter[i] = maxHoldFrames;
      } else {
        if (this.peakHoldCounter[i] > 0) {
          this.peakHoldCounter[i]--;
        } else {
          this.peakBars[i] -= 2.2 * peakDecaySpeed;
          if (this.peakBars[i] < 4) this.peakBars[i] = 4;
        }
      }

      // Upright Main Bar
      const barGrad = ctx.createLinearGradient(0, y, 0, baselineY);
      barGrad.addColorStop(0, '#ffffff');
      barGrad.addColorStop(0.18, 'rgba(138, 196, 255, 0.98)');
      barGrad.addColorStop(0.65, 'rgba(168, 85, 247, 0.88)');
      barGrad.addColorStop(1, 'rgba(56, 189, 248, 0.38)');

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [cornerR, cornerR, 2, 2]);
      ctx.fill();

      // Peak Hold Cap
      if (tBars.peakHold !== false) {
        const peakY = baselineY - this.peakBars[i];
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(138, 196, 255, 0.95)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(x, peakY - 3, barWidth, 3, [1.5, 1.5, 1.5, 1.5]);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Frosted Glass Water Reflection
      const refAlpha = typeof tBars.reflectionAlpha === 'number' ? tBars.reflectionAlpha : 0.25;
      const refSoftness = tBars.reflectionSoftness !== undefined ? tBars.reflectionSoftness : 0.40;
      if (refAlpha > 0.01) {
        const reflectH = barHeight * (refAlpha / 0.25 * 0.48);
        if (reflectH > 3) {
          const refX = x; // Stable mirror: no water displacement.
          const refY = baselineY + 3;

          const reflectGrad = ctx.createLinearGradient(0, refY, 0, refY + reflectH);
          reflectGrad.addColorStop(0, `rgba(138, 196, 255, ${refAlpha * 1.28})`);
          reflectGrad.addColorStop(.15 + Math.max(0,Math.min(1,refSoftness))*.6, `rgba(168, 85, 247, ${refAlpha * 0.72})`);
          reflectGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

          ctx.fillStyle = reflectGrad;
          ctx.beginPath();
          ctx.roundRect(refX, refY, barWidth, reflectH, [2, 2, cornerR, cornerR]);
          ctx.fill();
        }
      }
    }

    // Luminous Baseline
    const lineGrad = ctx.createLinearGradient(0, 0, w, 0);
    lineGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    lineGrad.addColorStop(0.12, 'rgba(138, 196, 255, 0.55)');
    lineGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
    lineGrad.addColorStop(0.88, 'rgba(192, 132, 252, 0.55)');
    lineGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');

    ctx.beginPath();
    ctx.moveTo(0, baselineY);
    ctx.lineTo(w, baselineY);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = 'rgba(138, 196, 255, 0.8)';
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
  }

  // =========================================================================
  // 5. Cyber Spatial Particle Field ("粒子" - 伪3D纵深粒子场，由地平线涌向镜头)
  // 中下半屏覆盖、近大远小、轻量假景深(焦平面锐利/前景柔化/远景微尘)、无DOM开销
  // =========================================================================
  drawCyberParticleWave(ctx, audioData, isPlaying) {
    const w = this.width;
    const h = this.height;
    const tOrb = this.tuning?.orb || this.defaultTuning.orb;

    this.particleWavePhase += 0.014 + this.smoothedBass * 0.026;
    const time = this.particleWavePhase;

    const count = Math.max(20, Math.min(300, tOrb.particleCount || 160));
    const speedMult = (tOrb.speed !== undefined ? tOrb.speed : 1.0);
    const sizeMult = (tOrb.size !== undefined ? tOrb.size : 1.0) * this.visScale;
    const depthRatio = tOrb.depthRatio !== undefined ? tOrb.depthRatio : 0.85;
    const horizonRatio = tOrb.horizonRatio !== undefined ? tOrb.horizonRatio : 0.50;
    const perspectiveSpread = tOrb.perspectiveSpread !== undefined ? tOrb.perspectiveSpread : 1.25;
    const viewDir = ((tOrb.viewDirection || 0) * Math.PI) / 180;
    const fieldRot = ((tOrb.fieldRotation || 0) * Math.PI) / 180;
    const fgBlur = tOrb.fgBlur !== undefined ? tOrb.fgBlur : 0.30;
    const farAlpha = tOrb.farAlpha !== undefined ? tOrb.farAlpha : 0.45;
    const musicInf = tOrb.musicInfluence !== undefined ? tOrb.musicInfluence : 1.0;
    const bassThrust = tOrb.bassThrust !== undefined ? tOrb.bassThrust : 0.80;
    const turbulence = tOrb.turbulence !== undefined ? tOrb.turbulence : 0.20;

    const nearZ = 40;
    const farZ = 950 * depthRatio;
    const fov = 500;
    const cx = w * 0.5;
    const cy = h * horizonRatio + this.offsetY;
    const focusZ = 280;

    const cosView = Math.cos(viewDir);
    const sinView = Math.sin(viewDir);
    const cosField = Math.cos(fieldRot);
    const sinField = Math.sin(fieldRot);

    // Audio-driven flow speed advancing toward camera
    const frameSpeed = (2.2 * speedMult + this.smoothedBass * 5.5 * bassThrust * musicInf);

    // Full-screen field dimensions based on current resolution
    const fieldSpanX = Math.max(2800, w * 2.4);
    const fieldSpanY = Math.max(2000, h * 2.2);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < count; i++) {
      const p = this.orbFieldParticles[i];
      if (!p) continue;
      p.z -= frameSpeed * p.speedMult;

      // Recycle when passing near plane or behind camera
      if (p.z < nearZ) {
        p.z = farZ + Math.random() * 100;
        p.x = (Math.random() - 0.5) * fieldSpanX;
        p.y = (Math.random() - 0.5) * fieldSpanY;
      }

      // Harmonic turbulence
      const turbX = Math.sin(time * 1.5 + p.seed) * (20 * turbulence);
      const turbY = Math.cos(time * 1.2 + p.seed * 2) * (15 * turbulence);

      const curX = p.x + turbX;
      const curY = p.y + turbY;

      // Field rotation around space Z
      const rx = curX * cosField - curY * sinField;
      const ry = curX * sinField + curY * cosField;

      // Camera yaw
      const camX = rx * cosView + p.z * sinView;
      const camZ = -rx * sinView + p.z * cosView;

      const safeZ = Math.max(40, camZ);
      const scale = fov / (fov + safeZ);
      const px = cx + camX * perspectiveSpread * scale;
      const py = cy + ry * perspectiveSpread * scale;

      // Skip particles outside viewport bounds with safe margin
      if (px < -80 || px > w + 80 || py < -80 || py > h + 80) continue;

      // Lightweight Depth-of-Field (DoF)
      const distFromFocus = camZ - focusZ;
      const isForeground = camZ < focusZ - 60;
      const isBackground = camZ > focusZ + 120;

      let radius = p.baseSize * scale * sizeMult * 1.6;
      let alpha = p.alpha;

      if (isForeground) {
        // Foreground: expanded, soft alpha aura
        radius *= (1.0 + fgBlur * 1.5);
        alpha *= Math.max(0.15, 1.0 - fgBlur * 0.5);
        ctx.fillStyle = `rgba(210, 235, 255, ${alpha * 0.55})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.5, radius), 0, Math.PI * 2);
        ctx.fill();
      } else if (isBackground) {
        // Background: distant stardust with farAlpha
        alpha *= farAlpha;
        ctx.fillStyle = `rgba(168, 205, 245, ${alpha * 0.65})`;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.8, radius), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // In-Focus: crisp radiant silver starlight core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.2, radius), 0, Math.PI * 2);
        ctx.fill();

        // 4-point sparkle on higher energy particles
        if (p.speedMult > 1.1 && this.smoothedMid > 0.12) {
          const flare = Math.min(6, radius * 1.8);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(px - flare, py);
          ctx.lineTo(px + flare, py);
          ctx.moveTo(px, py - flare);
          ctx.lineTo(px, py + flare);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  drawCelestialCore(ctx, audioData, isPlaying) {
    this.drawCyberParticleWave(ctx, audioData, isPlaying);
  }

  // =========================================================================
  // 6. Minimalist Audio-Reactive Flow Field ("流光" - 极简流场，默认彻底关闭装饰光球)
  // 平滑向量场、曲率/惯性/散布/拖尾、光线连续优雅律动
  // =========================================================================
  drawAuroraFluid(ctx, audioData, isPlaying) {
    const w = this.width;
    const h = this.height;
    const tAmbient = this.tuning?.ambient || this.defaultTuning.ambient;

    const pulse = this.ambientPulse || 0;
    const speedMult = tAmbient.speed !== undefined ? tAmbient.speed : 1.0;
    this.ambientPhase += (0.012 + this.smoothedBass * 0.03 + pulse * 0.02) * speedMult;
    const time = this.ambientPhase;

    // 1. Decorative Bokeh Orbs: ONLY if user explicitly checked enableOrbs (DEFAULT: OFF)
    if (tAmbient.enableOrbs === true) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const orbSpeed = 1 + this.smoothedBass * 2.0;
      this.ambientParticles.forEach(p => {
        p.x += p.vx * orbSpeed;
        p.y += p.vy * orbSpeed;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const px = p.x * w;
        const py = p.y * h;
        const r = p.radius * (1 + this.smoothedBass * 0.4) * this.visScale;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        grad.addColorStop(0, `hsla(${p.hue}, 90%, 72%, ${p.alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Minimalist Audio-Reactive Flow Field Streamlines
    const count = Math.max(4, Math.min(128, tAmbient.ribbonCount || 32));
    const widthMult = (tAmbient.ribbonWidth !== undefined ? tAmbient.ribbonWidth : 1.0) * this.visScale;
    const trailLenMult = tAmbient.trailLength !== undefined ? tAmbient.trailLength : 1.0;
    const curvature = tAmbient.curvature !== undefined ? tAmbient.curvature : 0.50;
    const turbulence = tAmbient.turbulence !== undefined ? tAmbient.turbulence : 0.25;
    const baseDir = ((tAmbient.direction !== undefined ? tAmbient.direction : 15) * Math.PI) / 180;
    const spreadAngle = ((tAmbient.spreadAngle !== undefined ? tAmbient.spreadAngle : 35) * Math.PI) / 180;
    const inertia = Math.max(0.1, Math.min(0.95, tAmbient.inertia !== undefined ? tAmbient.inertia : 0.65));
    const glowIntensity = tAmbient.glowIntensity !== undefined ? tAmbient.glowIntensity : 0.80;
    const musicInf = tAmbient.musicInfluence !== undefined ? tAmbient.musicInfluence : 1.0;

    const maxHistory = Math.max(4, Math.min(36, Math.round(14 * trailLenMult)));

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let i = 0; i < count; i++) {
      const s = this.flowStreamlines[i];

      // Audio reactive angle perturbation
      const normFreq = (i / count);
      const audioEnergy = this.getFrequencyAt(normFreq) * musicInf;

      const spreadOffset = ((i / count) - 0.5) * spreadAngle;
      const curl = Math.sin(s.x * 3.8 + time + s.seed) * curvature * 1.5 +
                   Math.cos(s.y * 4.2 - time * 0.8 + s.seed) * turbulence * 2.0;

      const targetAngle = baseDir + spreadOffset + curl + (audioEnergy * 0.8);
      const targetVx = Math.cos(targetAngle) * s.speed * speedMult * (1.0 + audioEnergy * 1.2);
      const targetVy = Math.sin(targetAngle) * s.speed * speedMult * (1.0 + audioEnergy * 1.2);

      // Inertial smoothing
      s.vx = s.vx * inertia + targetVx * (1.0 - inertia);
      s.vy = s.vy * inertia + targetVy * (1.0 - inertia);

      s.x += s.vx;
      s.y += s.vy;

      // Seamless screen wrapping
      if (s.x > 1.08) { s.x = -0.05; s.trail.length = 0; }
      if (s.x < -0.08) { s.x = 1.05; s.trail.length = 0; }
      if (s.y > 1.08) { s.y = -0.05; s.trail.length = 0; }
      if (s.y < -0.08) { s.y = 1.05; s.trail.length = 0; }

      // Update trail history
      s.trail.unshift({ x: s.x * w, y: s.y * h });
      while (s.trail.length > maxHistory) {
        s.trail.pop();
      }

      if (s.trail.length < 2) continue;

      // Render smooth ribbon trail
      ctx.beginPath();
      ctx.moveTo(s.trail[0].x, s.trail[0].y);
      for (let t = 0; t < s.trail.length - 1; t++) {
        const xc = (s.trail[t].x + s.trail[t + 1].x) * 0.5;
        const yc = (s.trail[t].y + s.trail[t + 1].y) * 0.5;
        ctx.quadraticCurveTo(s.trail[t].x, s.trail[t].y, xc, yc);
      }

      const alpha = Math.min(1.0, (0.35 + audioEnergy * 0.6) * (glowIntensity * 1.1));
      ctx.strokeStyle = `hsla(${s.hue}, 88%, 68%, ${alpha})`;
      ctx.lineWidth = Math.max(1.0, 2.2 * s.widthRatio * widthMult);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Shimmering leading head particle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.trail[0].x, s.trail[0].y, Math.max(1.2, ctx.lineWidth * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.Visualizer = Visualizer;
