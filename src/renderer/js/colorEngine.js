/**
 * GlassWave Color Engine
 * Extracts dominant palette (Primary, Secondary, Accent) from album art
 * Performs smooth RGB interpolation (1-3s lerp) to prevent sudden jumps
 * Drives dynamic fluid gradient mesh onto the ambient canvas
 */

class ColorEngine {
  // Rich Luxury Glass Theme Presets - Redesigned with distinct, bright luminous orbs
  static THEMES = {
    aurora: {
      name: '极光琉光',
      subtitle: '深冷青蓝与柔光紫 (默认)',
      p: [56, 189, 248],   // 亮青天蓝 (#38bdf8)
      s: [168, 85, 247],   // 鲜亮霓虹柔光紫 (#a855f7)
      a: [52, 211, 153],   // 清透极光薄荷绿 (#34d399)
      preview: 'linear-gradient(135deg, #0b1f3a 0%, #38bdf8 50%, #a855f7 100%)',
      pureHex: '#0b1f3a'   // 深邃墨蓝底色
    },
    twilight: {
      name: '霓虹暮光',
      subtitle: '落日晚霞与珊瑚绯红',
      p: [251, 113, 133],  // 明亮珊瑚绯红 / 玫瑰粉 (#fb7185)
      s: [251, 146, 60],   // 暖色落日亮橘 (#fb923c)
      a: [244, 63, 94],    // 电光玫红 (#f43f5e)
      preview: 'linear-gradient(135deg, #450a0a 0%, #fb7185 50%, #fb923c 100%)',
      pureHex: '#450a0a'   // 勃艮第红底色
    },
    emerald: {
      name: '曜石翠境',
      subtitle: '深邃苍林与赛博薄荷',
      p: [52, 211, 153],   // 鲜亮极光浅翠绿 (#34d399)
      s: [45, 212, 191],   // 明亮赛博薄荷青 (#2dd4bf)
      a: [110, 231, 183],  // 柔光嫩翠 (#6ee7b7)
      preview: 'linear-gradient(135deg, #064e3b 0%, #34d399 50%, #2dd4bf 100%)',
      pureHex: '#064e3b'   // 深海苍碧底色
    },
    glacier: {
      name: '深空冰蓝',
      subtitle: '极寒冰晶与高贵藏蓝',
      p: [125, 211, 252],  // 清透亮冰蓝 (#7dd3fc)
      s: [56, 189, 248],   // 极地明亮蔚蓝 (#38bdf8)
      a: [186, 230, 253],  // 皓霜极光白蓝 (#bae6fd)
      preview: 'linear-gradient(135deg, #172554 0%, #7dd3fc 50%, #38bdf8 100%)',
      pureHex: '#172554'   // 普鲁士蓝底色
    },
    amethyst: {
      name: '暗夜幻紫',
      subtitle: '电光魅影与神秘紫晶',
      p: [192, 132, 252],  // 明显电光浅紫光球 (#c084fc)
      s: [216, 180, 254],  // 梦幻亮薰衣草光球 (#d8b4fe)
      a: [232, 121, 249],  // 荧光粉紫高亮 (#e879f9)
      preview: 'linear-gradient(135deg, #2e1065 0%, #c084fc 50%, #d8b4fe 100%)',
      pureHex: '#2e1065'   // 暗夜紫晶底色
    },
    amber: {
      name: '炽焰琥珀',
      subtitle: '温暖麦浪与流金烈焰',
      p: [251, 191, 36],   // 灿烂浅流金 (#fbbf24)
      s: [251, 146, 60],   // 温暖烈焰亮橘 (#fb923c)
      a: [254, 215, 170],  // 辉光暖香槟 (#fed7aa)
      preview: 'linear-gradient(135deg, #422006 0%, #fbbf24 50%, #fb923c 100%)',
      pureHex: '#422006'   // 琥珀金棕底色
    },
    moonlight: {
      name: '月曜深银',
      subtitle: '低调石板与皓月冷白',
      p: [226, 232, 240],  // 清辉冷白光球 (#e2e8f0)
      s: [203, 213, 225],  // 柔和亮银光球 (#cbd5e1)
      a: [241, 245, 249],  // 月华皓白高亮 (#f1f5f9)
      preview: 'linear-gradient(135deg, #1e293b 0%, #e2e8f0 50%, #cbd5e1 100%)',
      pureHex: '#1e293b'   // 银青冷板底色
    },
    adaptive: {
      name: '唱片自适应',
      subtitle: '跟随正在播放的专辑封面实时律动',
      p: [56, 189, 248],   // 初始默认亮青
      s: [168, 85, 247],   // 初始默认亮紫
      a: [236, 72, 153],   // 初始默认亮粉
      preview: 'linear-gradient(135deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%)',
      pureHex: '#0c0d10'   // 曜石玄黑底色
    }
  };

  getThemeMatchingPureColor(themeKey) {
    const theme = ColorEngine.THEMES[themeKey];
    if (!theme || !theme.pureHex) return null;
    return ColorEngine.PURE_COLORS.find(c => c.hex.toLowerCase() === theme.pureHex.toLowerCase()) || null;
  }

  // 24 Minimalist Pure Color Palette (小巧密集排列极简纯色)
  static PURE_COLORS = [
    { name: '曜石玄黑', hex: '#0c0d10', rgb: [12, 13, 16] },
    { name: '钛金冷灰', hex: '#181a20', rgb: [24, 26, 32] },
    { name: '石板暗青', hex: '#0f172a', rgb: [15, 23, 42] },
    { name: '极夜深蓝', hex: '#0a1526', rgb: [10, 21, 38] },
    { name: '深邃墨蓝', hex: '#0b1f3a', rgb: [11, 31, 58] },
    { name: '普鲁士蓝', hex: '#172554', rgb: [23, 37, 84] },
    { name: '冰川冷翠', hex: '#042f2e', rgb: [4, 47, 46] },
    { name: '深海苍碧', hex: '#064e3b', rgb: [6, 78, 59] },
    { name: '松石苍青', hex: '#064e43', rgb: [6, 78, 67] },
    { name: '幽谧森绿', hex: '#142e1f', rgb: [20, 46, 31] },
    { name: '墨玉深绿', hex: '#063b2a', rgb: [6, 59, 42] },
    { name: '幻夜暮紫', hex: '#1e1b4b', rgb: [30, 27, 75] },
    { name: '暗夜紫晶', hex: '#2e1065', rgb: [46, 16, 101] },
    { name: '赛博魅紫', hex: '#3b0764', rgb: [59, 7, 100] },
    { name: '浆果浓郁', hex: '#4a044e', rgb: [74, 4, 78] },
    { name: '暮色洋红', hex: '#500724', rgb: [80, 7, 36] },
    { name: '勃艮第红', hex: '#450a0a', rgb: [69, 10, 10] },
    { name: '焦糖暖褐', hex: '#451a03', rgb: [69, 26, 3] },
    { name: '琥珀金棕', hex: '#422006', rgb: [66, 32, 6] },
    { name: '极简铅灰', hex: '#18181b', rgb: [24, 24, 27] },
    { name: '霜冷炭黑', hex: '#111827', rgb: [17, 24, 39] },
    { name: '雾霭石灰', hex: '#27272a', rgb: [39, 39, 42] },
    { name: '银青冷板', hex: '#1e293b', rgb: [30, 41, 59] },
    { name: '蔚蓝之境', hex: '#075985', rgb: [7, 89, 133] }
  ];

  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // Default luxury glass palette (Cool Cyan / Deep Indigo / Violet Neon)
    this.currentColors = {
      p: [28, 55, 90],    // Primary
      s: [88, 28, 110],   // Secondary
      a: [56, 189, 248]   // Accent
    };

    this.targetColors = {
      p: [28, 55, 90],
      s: [88, 28, 110],
      a: [56, 189, 248]
    };

    // Color interpolation lerp speed (~2.5 seconds smooth transition at 60fps)
    this.lerpSpeed = 0.028;
    this.currentThemeKey = 'aurora';
    this.lastCoverElement = null;

    // Organic harmonic wave motion anchor points (continuous silky drift, zero hard bounces)
    this.animTime = 0;
    this.blobs = [
      { baseX: 0.30, baseY: 0.35, ampX: 0.18, ampY: 0.14, speedX: 0.00042, speedY: 0.00035, phaseX: 0.0, phaseY: 1.2, r: 0.58, colorKey: 'p' },
      { baseX: 0.72, baseY: 0.42, ampX: 0.16, ampY: 0.18, speedX: 0.00038, speedY: 0.00045, phaseX: 2.1, phaseY: 0.5, r: 0.62, colorKey: 's' },
      { baseX: 0.50, baseY: 0.78, ampX: 0.20, ampY: 0.12, speedX: 0.00048, speedY: 0.00032, phaseX: 1.4, phaseY: 3.1, r: 0.54, colorKey: 'a' },
      { baseX: 0.18, baseY: 0.70, ampX: 0.14, ampY: 0.16, speedX: 0.00035, speedY: 0.00040, phaseX: 4.0, phaseY: 2.3, r: 0.48, colorKey: 's' },
      { baseX: 0.82, baseY: 0.22, ampX: 0.15, ampY: 0.13, speedX: 0.00040, speedY: 0.00038, phaseX: 3.2, phaseY: 1.8, r: 0.50, colorKey: 'p' },
      { baseX: 0.38, baseY: 0.18, ampX: 0.17, ampY: 0.15, speedX: 0.00036, speedY: 0.00042, phaseX: 5.1, phaseY: 0.8, r: 0.52, colorKey: 'a' }
    ];

    // Ambient Glow & Orbs Customization (Requirement: 单色/全彩切换、开启/关闭、动态光球自定义)
    this.glowEnabled = true;
    this.glowMode = 'multi'; // 'multi' | 'mono'
    this.blobCount = 4; // 2, 4, 6
    this.speedMultiplier = 1.0; // 0 to 2.5
    this.intensityMultiplier = 1.0; // 0.2 to 1.6
    this.activePureColor = null; // { name, hex, rgb }

    this.audioBassEnergy = 0; // Driven by AudioEngine

    this.initCanvas();
    this.startRenderLoop();

    // Restore saved settings
    try {
      const savedTheme = localStorage.getItem('glasswave_skin_theme') || 'aurora';
      this.setTheme(savedTheme);

      const savedGlowEnabled = localStorage.getItem('glasswave_glow_enabled');
      if (savedGlowEnabled !== null) this.glowEnabled = savedGlowEnabled !== 'false';
      this.glowMode = localStorage.getItem('glasswave_glow_mode') || 'multi';
      this.blobCount = parseInt(localStorage.getItem('glasswave_glow_blob_count') || '4', 10);
      this.speedMultiplier = parseFloat(localStorage.getItem('glasswave_glow_speed') || '1.0');
      this.intensityMultiplier = parseFloat(localStorage.getItem('glasswave_glow_intensity') || '1.0');

      const savedPureHex = localStorage.getItem('glasswave_pure_color');
      if (savedPureHex) {
        const found = ColorEngine.PURE_COLORS.find(c => c.hex.toLowerCase() === savedPureHex.toLowerCase());
        if (found) this.setPureColor(found.hex, found.name, false);
      }
    } catch (e) {}
  }

  setTheme(themeKey) {
    if (!ColorEngine.THEMES[themeKey]) themeKey = 'aurora';
    this.currentThemeKey = themeKey;
    try {
      localStorage.setItem('glasswave_skin_theme', themeKey);
    } catch (e) {}

    if (themeKey !== 'adaptive') {
      const theme = ColorEngine.THEMES[themeKey];
      this.setTargetPalette(theme.p, theme.s, theme.a);
    } else if (this.lastCoverElement) {
      this.extractColorsFromImage(this.lastCoverElement);
    }
  }

  initCanvas() {
    if (!this.canvas) return;
    const doResize = () => {
      this.width = window.innerWidth;this.height = window.innerHeight;
      // Ambient light is intentionally soft; keep its raster independent of 4K size.
      const scale=Math.min(1,960/this.width,540/this.height);
      this.canvas.width=Math.max(1,Math.round(this.width*scale));
      this.canvas.height=Math.max(1,Math.round(this.height*scale));
      this.ctx.setTransform(this.canvas.width/this.width,0,0,this.canvas.height/this.height,0,0);
    };
    let resizeTimer = null;
    const debouncedResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        doResize();
        resizeTimer = null;
      }, 180);
    };
    window.addEventListener('resize', debouncedResize);
    doResize();
  }

  // Smooth lerp helper
  lerp(start, end, amt) {
    return start + (end - start) * amt;
  }

  // Set new target colors from artwork or presets
  setTargetPalette(primaryRgb, secondaryRgb, accentRgb) {
    if (primaryRgb) this.targetColors.p = primaryRgb;
    if (secondaryRgb) this.targetColors.s = secondaryRgb;
    if (accentRgb) this.targetColors.a = accentRgb;
  }

  // Extract colors from an Image element using fast downsampled canvas
  extractColorsFromImage(imgElement) {
    this.lastCoverElement = imgElement;
    if (this.currentThemeKey && this.currentThemeKey !== 'adaptive') {
      return;
    }
    try {
      const thumbCanvas = document.createElement('canvas');
      const thumbCtx = thumbCanvas.getContext('2d');
      const size = 64; // Downsample for instant extraction without UI hitch
      thumbCanvas.width = size;
      thumbCanvas.height = size;
      thumbCtx.drawImage(imgElement, 0, 0, size, size);

      const imgData = thumbCtx.getImageData(0, 0, size, size).data;
      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      // Calculate average & dominant tones
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        // Filter out extreme blacks and whites for rich chromatic tones
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 25 && lum < 235) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }

      if (count > 0) {
        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);

        // Derive luminous, distinct floating orbs from artwork
        const maxAvg = Math.max(avgR, avgG, avgB, 1);
        const primary = [
          Math.min(255, Math.round((avgR / maxAvg) * 160 + 95)),
          Math.min(255, Math.round((avgG / maxAvg) * 160 + 95)),
          Math.min(255, Math.round((avgB / maxAvg) * 160 + 95))
        ];
        const secondary = [
          Math.min(255, Math.round((avgB / maxAvg) * 150 + 105)),
          Math.min(255, Math.round((avgR / maxAvg) * 130 + 90)),
          Math.min(255, Math.round((avgG / maxAvg) * 150 + 105))
        ];
        const accent = [
          Math.min(255, Math.round(primary[0] * 0.9 + 30)),
          Math.min(255, Math.round(primary[1] * 0.9 + 30)),
          Math.min(255, Math.round(primary[2] * 0.9 + 30))
        ];

        this.setTargetPalette(primary, secondary, accent);
      }
    } catch (err) {
      console.warn('Color extraction fallback:', err);
    }
  }

  updateColors() {
    for (const key of ['p', 's', 'a']) {
      for (let i = 0; i < 3; i++) {
        this.currentColors[key][i] = this.lerp(
          this.currentColors[key][i],
          this.targetColors[key][i],
          this.lerpSpeed
        );
      }
    }

    // Dynamic elegant glass color linkage (优雅通透联动)
    const [pr, pg, pb] = this.currentColors.p.map(Math.round);
    const [sr, sg, sb] = this.currentColors.s.map(Math.round);
    const [ar, ag, ab] = this.currentColors.a.map(Math.round);

    const signature=[pr,pg,pb,sr,sg,sb,ar,ag,ab].join(',');
    if(signature===this._paletteSignature) return;
    this._paletteSignature=signature;
    // Deep luminous tinted acrylic glass base for panels, sidebar and bottom bar
    const gpr = Math.min(52, Math.round(pr * 0.22 + 10));
    const gpg = Math.min(55, Math.round(pg * 0.22 + 12));
    const gpb = Math.min(72, Math.round(pb * 0.22 + 20));
    const glassBgPrimary = `rgba(${gpr}, ${gpg}, ${gpb}, 0.52)`;

    // Secondary glass base for cards, header, drawers, popovers
    const gsr = Math.min(58, Math.round(sr * 0.24 + 12));
    const gsg = Math.min(62, Math.round(sg * 0.24 + 14));
    const gsb = Math.min(78, Math.round(sb * 0.24 + 24));
    const glassBgSecondary = `rgba(${gsr}, ${gsg}, ${gsb}, 0.40)`;

    // Specular border glow reflecting the accent hue
    const glassBorderGlow = `rgba(${ar}, ${ag}, ${ab}, 0.32)`;
    const accentPrimary = `rgb(${ar}, ${ag}, ${ab})`;
    const accentSecondary = `rgb(${sr}, ${sg}, ${sb})`;
    const accentGlow = `rgba(${ar}, ${ag}, ${ab}, 0.38)`;

    const docStyle = document.documentElement.style;
    docStyle.setProperty('--glass-bg-primary', glassBgPrimary);
    docStyle.setProperty('--glass-bg-secondary', glassBgSecondary);
    docStyle.setProperty('--glass-border-glow', glassBorderGlow);
    docStyle.setProperty('--accent-primary', accentPrimary);
    docStyle.setProperty('--accent-secondary', accentSecondary);
    docStyle.setProperty('--accent-glow', accentGlow);
  }

  startRenderLoop() {
    const render = () => {
      this.updateColors();
      if(!document.body.classList.contains('direct-interaction') &&
         !document.body.classList.contains('mini-bar-mode') &&
         Number(document.documentElement.style.getPropertyValue('--desktop-reveal'))<1) this.drawFluidMesh();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  drawFluidMesh() {
    if (!this.ctx || !this.width || !this.height) return;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep luminous atmospheric void base or custom pure color background
    const customBackground = document.body.classList.contains('ui-custom-colors');
    if (customBackground) {
      // The shell supplies the selected base color; this canvas only adds light.
    } else if (this.activePureColor) {
      ctx.fillStyle = this.activePureColor.hex;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
      bgGrad.addColorStop(0, '#060810');
      bgGrad.addColorStop(0.5, '#080c16');
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // If glow is disabled, stop here for an ultra-clean solid/dark aesthetic
    if (!this.glowEnabled) return;

    // Dynamic drifting light spots with screen blending & exponential falloff
    ctx.save();
    ctx.globalCompositeOperation = customBackground ? 'source-over' : 'screen';

    // Advance harmonic motion timeline using speed multiplier (0 = static ambient)
    this.animTime += 16 * this.speedMultiplier;
    const t = this.animTime;

    // Audio-reactive bass expansion
    const bassScale = 1.0 + (this.audioBassEnergy || 0) * 0.22;
    const activeBlobs = this.blobs.slice(0, this.blobCount);

    for (let i = 0; i < activeBlobs.length; i++) {
      const blob = activeBlobs[i];
      // Continuous harmonic wave motion - zero mechanical bouncing
      const normX = blob.baseX + Math.sin(t * blob.speedX + blob.phaseX) * blob.ampX;
      const normY = blob.baseY + Math.cos(t * blob.speedY + blob.phaseY) * blob.ampY;

      const px = normX * this.width;
      const py = normY * this.height;
      const radius = Math.min(this.width, this.height) * blob.r * bassScale;

      // Color selection: if in monochrome mode, all blobs use primary p color for cohesive tone
      const targetColorKey = this.glowMode === 'mono' ? 'p' : blob.colorKey;
      const [r, g, b] = this.currentColors[targetColorKey].map(Math.round);
      const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      const mul = this.intensityMultiplier;

      // 8-stop smooth Gaussian-like curve with boosted luminous core (distinct glowing orbs)
      grad.addColorStop(0.00, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.76 * mul)})`);
      grad.addColorStop(0.14, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.62 * mul)})`);
      grad.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.44 * mul)})`);
      grad.addColorStop(0.44, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.26 * mul)})`);
      grad.addColorStop(0.62, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.12 * mul)})`);
      grad.addColorStop(0.78, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.05 * mul)})`);
      grad.addColorStop(0.90, `rgba(${r}, ${g}, ${b}, ${Math.min(1.0, 0.015 * mul)})`);
      grad.addColorStop(1.00, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  setPureColor(hex, name = '', persist = true, keepThemePalette = false) {
    const found = ColorEngine.PURE_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    if (!found) return;

    this.activePureColor = found;
    if (persist) {
      try {
        localStorage.setItem('glasswave_pure_color', hex);
      } catch (e) {}
    }

    document.documentElement.style.setProperty('--custom-pure-bg', hex);
    document.body.classList.add('has-pure-bg');

    // If linked from an active theme that has its own curated luminous orbs, keep the theme's bright orbs!
    if (keepThemePalette && this.currentThemeKey && ColorEngine.THEMES[this.currentThemeKey]) {
      const th = ColorEngine.THEMES[this.currentThemeKey];
      this.setTargetPalette(th.p, th.s, th.a);
      return;
    }

    // Otherwise (manual pure color pick), calculate bright luminous orbs with high lightness
    // so orbs NEVER blend into the dark background and are clearly visible floating spheres!
    const [r, g, b] = found.rgb;
    const maxVal = Math.max(r, g, b, 1);
    const brightR = Math.min(255, Math.round((r / maxVal) * 160 + 95));
    const brightG = Math.min(255, Math.round((g / maxVal) * 160 + 95));
    const brightB = Math.min(255, Math.round((b / maxVal) * 160 + 95));

    const pastelR = Math.min(255, Math.round(brightB * 0.7 + brightR * 0.3 + 30));
    const pastelG = Math.min(255, Math.round(brightG * 0.7 + brightR * 0.3 + 30));
    const pastelB = Math.min(255, Math.round(brightR * 0.7 + brightB * 0.3 + 30));

    const accentR = Math.min(255, Math.round(brightR * 0.5 + 120));
    const accentG = Math.min(255, Math.round(brightG * 0.5 + 120));
    const accentB = Math.min(255, Math.round(brightB * 0.5 + 120));

    this.setTargetPalette([brightR, brightG, brightB], [pastelR, pastelG, pastelB], [accentR, accentG, accentB]);
  }

  clearPureColor() {
    this.activePureColor = null;
    try {
      localStorage.removeItem('glasswave_pure_color');
    } catch (e) {}
    document.documentElement.style.removeProperty('--custom-pure-bg');
    document.body.classList.remove('has-pure-bg');
    this.setTheme(this.currentThemeKey || 'aurora');
  }

  setGlowEnabled(flag) {
    this.glowEnabled = !!flag;
    try {
      localStorage.setItem('glasswave_glow_enabled', this.glowEnabled);
    } catch (e) {}
  }

  setGlowMode(mode) {
    if (['multi', 'mono'].includes(mode)) {
      this.glowMode = mode;
      try {
        localStorage.setItem('glasswave_glow_mode', mode);
      } catch (e) {}
    }
  }

  setBlobCount(count) {
    const val = parseInt(count, 10);
    if ([2, 4, 6].includes(val)) {
      this.blobCount = val;
      try {
        localStorage.setItem('glasswave_glow_blob_count', val);
      } catch (e) {}
    }
  }

  setSpeedMultiplier(speed) {
    this.speedMultiplier = Math.max(0, Math.min(2.5, Number.isFinite(Number(speed)) ? Number(speed) : 1.0));
    try {
      localStorage.setItem('glasswave_glow_speed', this.speedMultiplier);
    } catch (e) {}
  }

  setIntensityMultiplier(val) {
    this.intensityMultiplier = Math.max(0.2, Math.min(1.6, Number(val) || 1.0));
    try {
      localStorage.setItem('glasswave_glow_intensity', this.intensityMultiplier);
    } catch (e) {}
  }
}

window.ColorEngine = ColorEngine;
