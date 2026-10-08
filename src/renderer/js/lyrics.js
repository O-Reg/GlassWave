(function (root) {
  'use strict';
  const KEY = 'glasswave_lyrics_settings_v1';
  const PALETTES = { ice: { neighbor: '#4d596d', normal: '#e5f3ff', highlight: '#64eaff' }, purple: { neighbor: '#574c66', normal: '#f5eaff', highlight: '#dc86ff' }, gold: { neighbor: '#645640', normal: '#fff3d0', highlight: '#ffd04b' } };
  const DEFAULTS = { enabled: false, ...PALETTES.ice, glow: 8, size: 28, neighborSize: 20, translationSize: 28, width: 64, height: 32, rows: 2, translation: true, background: 35, animation: 'karaoke', position: 'below', x: 50, y: 78 };
  const clamp = (n, min, max, fallback) => Number.isFinite(Number(n)) ? Math.max(min, Math.min(max, Number(n))) : fallback;
  function settings(value = {}) {
    const result = { ...DEFAULTS };
    result.enabled = value.enabled === true;
    for (const k of ['neighbor', 'normal', 'highlight']) if (/^#[a-f\d]{6}$/i.test(value[k] || '')) result[k] = value[k];
    for (const [k, min, max] of [['glow', 0, 24], ['size', 16, 64], ['neighborSize', 12, 64], ['translationSize', 12, 64], ['width', 20, 92], ['height', 12, 85], ['background', 0, 100], ['x', 0, 100], ['y', 0, 100]]) result[k] = clamp(value[k], min, max, DEFAULTS[k]);
    // Migrate only the exact old light-background preset, whose dark text was unreadable on glass.
    if (value.normal === '#343b49' && value.highlight === '#0079a8') Object.assign(result, PALETTES.gold);
    const oldPalettes = { '#97a7c4,#f0f4ff,#76ddff': 'ice', '#b4a2cb,#f2eaff,#d3a4ff': 'purple', '#c1ae8b,#fff3d4,#ffd279': 'gold' };
    const oldPreset = oldPalettes[[value.neighbor, value.normal, value.highlight].join(',')];
    if (oldPreset) Object.assign(result, PALETTES[oldPreset]);
    result.translation = value.translation !== false && value.translation !== 'false';
    if ([1, 2, 3].includes(Number(value.rows))) result.rows = Number(value.rows);
    if (['none', 'soft', 'karaoke'].includes(value.animation)) result.animation = value.animation;
    if (['below', 'bottom', 'custom'].includes(value.position)) result.position = value.position;
    return result;
  }
  class LyricsController {
    constructor(audioEngine, ui) {
      this.engine = audioEngine; this.ui = ui; this.audio = audioEngine.audio;
      try { this.settings = settings(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { this.settings = settings(); }
      this.document = null; this.trackPath = ''; this.generation = 0; this.frame = null; this.lastFrame = 0; this.index = -2; this.wordNodes = [];
      this.button = document.getElementById('btn-toggle-lyrics');
      this.stage = document.createElement('section'); this.stage.className = 'lyrics-stage'; this.stage.hidden = true;
      this.stage.setAttribute('aria-label', '同步歌词');
      this.content = document.createElement('div'); this.content.className = 'lyrics-content'; this.stage.appendChild(this.content);
      this.resizeHandle = document.createElement('button'); this.resizeHandle.className = 'lyrics-resize-handle'; this.resizeHandle.type = 'button'; this.resizeHandle.setAttribute('aria-label', '调整歌词框大小'); this.resizeHandle.title = '拖动调整宽高；方向键微调'; this.resizeHandle.textContent = '◢'; this.resizeHandle.hidden = true;
      this.lockHandle = document.createElement('button'); this.lockHandle.className = 'lyrics-lock-handle'; this.lockHandle.type = 'button'; this.lockHandle.textContent = '完成并锁定'; this.lockHandle.hidden = true;
      document.getElementById('view-player').appendChild(this.stage);
      this.buildPanel(); this.bind(); this.applySettings();
      this.resizeObserver = new ResizeObserver(() => this.updatePlacement());
      this.resizeObserver.observe(this.stage.parentElement);
      this.resizeObserver.observe(document.getElementById('track-meta'));
      this.viewObserver = new MutationObserver(() => { this.updatePlacement(); this.render(true); this.schedule(); });
      this.viewObserver.observe(this.stage.parentElement, { attributes: true, attributeFilter: ['style'] });
      this.modeObserver = new MutationObserver(() => { if (document.body.classList.contains('mini-bar-mode')) this.closePanel(); this.updatePlacement(); this.schedule(); });
      this.modeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      if (audioEngine.currentTrack) this.setTrack(audioEngine.currentTrack);
    }
    save() { localStorage.setItem(KEY, JSON.stringify(this.settings)); }
    applySettings() {
      this.stage.hidden = !this.settings.enabled;
      this.stage.dataset.position = this.settings.position;
      this.stage.dataset.rows = String(this.settings.rows);
      this.stage.dataset.animation = this.settings.animation;
      this.stage.style.setProperty('--lyric-background', String(this.settings.background / 100));
      for (const [k, v] of Object.entries({ '--lyric-neighbor': this.settings.neighbor, '--lyric-normal': this.settings.normal, '--lyric-highlight': this.settings.highlight, '--lyric-neighbor-ratio': this.settings.neighborSize / this.settings.size, '--lyric-translation-ratio': this.settings.translationSize / this.settings.size, '--lyric-glow': `${this.settings.glow}px`, '--lyric-size': `${this.settings.size}px`, '--lyric-x': `${this.settings.x}%`, '--lyric-y': `${this.settings.y}%` })) this.stage.style.setProperty(k, v);
      this.button.classList.toggle('active', this.settings.enabled); this.button.setAttribute('aria-pressed', String(this.settings.enabled));
      this.button.title = `歌词：${this.settings.enabled ? '已开启' : '已关闭'}（右键打开设置）`;
      for (const k of ['neighbor', 'normal', 'highlight', 'glow', 'size', 'neighborSize', 'translationSize', 'width', 'height', 'rows', 'translation', 'background', 'animation', 'position']) {
        const el = this.panel.querySelector(`[data-lyric-setting="${k}"]`); if (el) el.value = this.settings[k];
        const value = this.panel.querySelector(`[data-lyric-value="${k}"]`); if (value) { const n = this.settings[k]; const display = typeof n === 'number' && !Number.isInteger(n) ? n.toFixed(1) : n; value.textContent = display + (['background', 'width', 'height'].includes(k) ? '%' : ['size', 'neighborSize', 'translationSize', 'glow'].includes(k) ? 'px' : ''); }
      }
      this.index = -2; this.render(true); this.updatePlacement(); this.schedule();
    }
    buildPanel() {
      this.panel = document.createElement('section'); this.panel.className = 'lyrics-settings-panel'; this.panel.hidden = true; this.panel.setAttribute('aria-label', '歌词设置');
      this.panel.innerHTML = `<header><button type="button" id="lyrics-close" aria-label="关闭歌词设置">×</button><strong>歌词设置</strong><button type="button" id="lyrics-reset" title="恢复歌词外观、位置与当前歌曲时间偏移，不删除歌词或译文">重置</button></header>
        <div class="lyrics-settings-scroll">
        <p id="lyrics-source" role="status">选择一首歌曲后可导入歌词。</p>
        <button class="glass-pill-btn" id="lyrics-import">为当前歌曲导入歌词</button>
        <button class="glass-pill-btn" id="lyrics-translation-import">为当前歌曲导入译文</button>
        <button class="glass-pill-btn" id="lyrics-folder">选择歌词库文件夹</button>
        <p class="lyrics-help">自动读取同名 LRC／ELRC／YRC／JSON／TXT 和内嵌歌词。逐字歌词按时间填色，普通 LRC 按句高亮；纯文本不自动滚动。此功能不联网、不从音频生成歌词。</p>
        <label>前后句颜色<input type="color" data-lyric-setting="neighbor" aria-label="歌词前后句颜色"></label>
        <label>当前句与译文颜色<input type="color" data-lyric-setting="normal" aria-label="歌词当前句颜色"></label>
        <label>卡拉 OK 填色<input type="color" data-lyric-setting="highlight" aria-label="歌词高亮颜色"></label>
        <div class="lyrics-color-presets"><button data-lyric-palette="ice">冰蓝荧光</button><button data-lyric-palette="purple">紫色荧光</button><button data-lyric-palette="gold">暖金荧光</button></div>
        <label>荧光强度<output data-lyric-value="glow"></output><input type="range" min="0" max="24" step="1" data-lyric-setting="glow" aria-label="歌词荧光强度"></label>
        <label>文字大小<output data-lyric-value="size"></output><input type="range" min="16" max="64" step="1" data-lyric-setting="size" aria-label="歌词文字大小"></label>
        <label>译文字号<output data-lyric-value="translationSize"></output><input type="range" min="12" max="64" step="1" data-lyric-setting="translationSize" aria-label="歌词译文字号"></label>
        <label>前后句字号<output data-lyric-value="neighborSize"></output><input type="range" min="12" max="64" step="1" data-lyric-setting="neighborSize" aria-label="歌词前后句字号"></label>
        <label>歌词框宽度<output data-lyric-value="width"></output><input type="range" min="20" max="92" step="1" data-lyric-setting="width" aria-label="歌词框宽度"></label>
        <label>歌词框高度<output data-lyric-value="height"></output><input type="range" min="12" max="85" step="1" data-lyric-setting="height" aria-label="歌词框高度"></label>
        <p class="lyrics-help">框宽、高度和字号独立保存，不改变封面。长句先换行；装不下时仅临时等比例缩小歌词，放大框后恢复原字号。</p>
        <label>显示句子<select data-lyric-setting="rows"><option value="2">当前句与下一句</option><option value="3">当前句与前后句</option><option value="1">只显示当前句</option></select></label>
        <label>译文显示<select data-lyric-setting="translation"><option value="true">同时显示原文与译文</option><option value="false">只显示原文</option></select></label>
        <p class="lyrics-help">译文随原文切句，不逐词高亮。可导入 TXT（每句一行，行数与原文一致）或相同版本的时间轴译文。</p>
        <label>暗色背景不透明度<output data-lyric-value="background"></output><input type="range" min="0" max="100" step="1" data-lyric-setting="background" aria-label="歌词背景不透明度"></label>
        <label>表现方式<select data-lyric-setting="animation"><option value="karaoke">卡拉 OK · 逐字填色</option><option value="soft">柔和切句 · 逐句高亮</option><option value="none">无过渡 · 逐句高亮</option></select></label>
        <label>画面位置<select data-lyric-setting="position"><option value="below">歌曲信息下方</option><option value="bottom">画面底部</option><option value="custom">自定义位置</option></select></label>
        <button class="glass-pill-btn" id="lyrics-position" aria-pressed="false">调整位置与大小</button>
        <p class="lyrics-help">开启后设置页暂时收起。拖动框内移动，拖右下角调整宽高，点框上的“完成并锁定”结束。颜色、框大小和字号随自定义皮肤保存。</p>
        <label>歌词延后<output id="lyrics-offset-value">0ms</output><input id="lyrics-offset" type="range" min="-5000" max="5000" step="50" value="0" aria-label="当前歌曲歌词延后"></label>
        <p class="lyrics-help">正值让歌词晚出现，负值让歌词提前。只针对当前歌曲保存，不写入皮肤。</p>
        </div>`;
      document.getElementById('app-shell').appendChild(this.panel);
    }
    bind() {
      this.panel.querySelector('#lyrics-folder').onclick = async () => {
        const result = await window.glasswaveAPI.chooseLyricsFolder();
        if (result.error) { this.panel.querySelector('#lyrics-source').textContent = result.error; return; }
        if (!result.canceled) {
          await this.setTrack(this.engine.currentTrack, true);
          this.panel.querySelector('#lyrics-source').textContent += ` · 歌词库 ${result.count} 首`;
        }
      };
      this.button.addEventListener('click', () => {
        this.settings.enabled = !this.settings.enabled;
        if (!this.settings.enabled) this.setPositioning(false);
        this.save(); this.applySettings();
        if (this.settings.enabled && !this.document) this.setTrack(this.engine.currentTrack, true);
      });
      this.button.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); this.openPanel(); });
      this.panel.addEventListener('contextmenu', e => e.stopPropagation());
      this.panel.querySelector('#lyrics-close').onclick = () => this.closePanel();
      this.panel.querySelector('#lyrics-import').onclick = () => this.import();
      this.panel.querySelector('#lyrics-translation-import').onclick = () => this.import(true);
      this.panel.querySelector('#lyrics-reset').onclick = () => this.resetSettings();
      this.panel.addEventListener('wheel', e => {
        const scroll = this.panel.querySelector('.lyrics-settings-scroll');
        const step = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaMode === 2 ? e.deltaY * scroll.clientHeight : e.deltaY;
        scroll.scrollTop += step;
        e.preventDefault(); e.stopPropagation();
      }, { passive: false });
      this.panel.querySelector('#lyrics-position').onclick = () => {
        this.settings.enabled = true; this.settings.position = 'custom'; this.setPositioning(!this.positioning); this.save(); this.applySettings();
        if (this.positioning) this.panel.hidden = true;
        if (!this.document) this.setTrack(this.engine.currentTrack, true);
      };
      this.panel.querySelectorAll('[data-lyric-setting]').forEach(el => el.addEventListener('input', () => {
        if (['width', 'height'].includes(el.dataset.lyricSetting) && this.settings.position !== 'custom') {
          const r = this.stage.getBoundingClientRect(), parent = this.stage.parentElement.getBoundingClientRect();
          this.settings.position = 'custom'; this.settings.x = (r.left + r.width / 2 - parent.left) / parent.width * 100; this.settings.y = (r.top + r.height / 2 - parent.top) / parent.height * 100;
        }
        this.settings = settings({ ...this.settings, [el.dataset.lyricSetting]: el.value }); this.save(); this.applySettings();
      }));
      this.panel.querySelectorAll('[data-lyric-palette]').forEach(el => { el.onclick = () => this.applyPalette(el.dataset.lyricPalette); });
      this.panel.querySelector('#lyrics-offset').oninput = e => {
        if (!this.trackPath) return;
        let map = {}; try { map = JSON.parse(localStorage.getItem('glasswave_lyrics_track_offsets') || '{}'); } catch {}
        map[this.trackPath] = Number(e.target.value); localStorage.setItem('glasswave_lyrics_track_offsets', JSON.stringify(map));
        this.offset = Number(e.target.value); this.panel.querySelector('#lyrics-offset-value').textContent = `${this.offset}ms`; this.render(true);
      };
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && (!this.panel.hidden || this.positioning)) { e.stopImmediatePropagation(); this.closePanel(); } }, true);
      for (const event of ['timeupdate', 'seeked', 'seeking', 'loadedmetadata', 'pause', 'ended', 'play']) this.audio.addEventListener(event, () => { this.render(event === 'seeking' || event === 'seeked'); this.schedule(); });
      for (const event of ['emptied', 'loadstart']) this.audio.addEventListener(event, () => {
        if ((this.engine.currentTrack?.path || '') !== this.trackPath) this.setTrack(this.engine.currentTrack);
        this.schedule();
      });
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.cancelFrame(); else { this.render(true); this.schedule(); } });
      window.glasswaveAPI?.onAnimationPaused?.(paused => { this.suspended = !!paused; if (paused) this.cancelFrame(); else { this.render(true); this.schedule(); } });
      this.stage.addEventListener('pointerdown', e => {
        if (!this.positioning || e.button !== 0) return;
        if (e.target.closest('.lyrics-lock-handle')) return;
        e.stopPropagation(); e.preventDefault(); this.dragPointer = e.pointerId; this.stage.setPointerCapture(e.pointerId);
        const r = this.stage.getBoundingClientRect(); this.dragOffset = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
        this.resizeStart = e.target.closest('.lyrics-resize-handle') ? r : null;
      });
      this.stage.addEventListener('pointermove', e => {
        if (this.dragPointer !== e.pointerId) return;
        const rect = this.stage.parentElement.getBoundingClientRect();
        if (this.resizeStart) {
          const r = this.resizeStart, heightBase = this.availableHeight || rect.height;
          this.settings.width = clamp((e.clientX - r.left) / rect.width * 100, 20, 92, 64);
          this.settings.height = clamp((e.clientY - r.top) / heightBase * 100, 12, 85, 32);
          const w = rect.width * this.settings.width / 100, h = heightBase * this.settings.height / 100;
          this.settings.x = (r.left + w / 2 - rect.left) / rect.width * 100;
          this.settings.y = (r.top + h / 2 - rect.top) / rect.height * 100;
          this.updatePlacement(); return;
        }
        const halfX = Math.min(50, this.stage.offsetWidth / rect.width * 50), halfY = Math.min(50, this.stage.offsetHeight / rect.height * 50);
        this.settings.x = clamp((e.clientX - this.dragOffset.x - rect.left) / rect.width * 100, halfX, 100 - halfX, 50);
        this.settings.y = clamp((e.clientY - this.dragOffset.y - rect.top) / rect.height * 100, halfY, 100 - halfY, 78);
        this.stage.style.setProperty('--lyric-x', `${this.settings.x}%`); this.stage.style.setProperty('--lyric-y', `${this.settings.y}%`);
        this.updatePlacement();
      });
      const finish = () => { if (this.dragPointer !== undefined) { this.dragPointer = undefined; this.resizeStart = null; this.settings = settings(this.settings); this.save(); this.applySettings(); } };
      this.stage.addEventListener('pointerup', finish); this.stage.addEventListener('pointercancel', finish);
      this.stage.addEventListener('dblclick', e => { if (this.positioning) { e.preventDefault(); e.stopPropagation(); } });
      this.lockHandle.onclick = e => { e.stopPropagation(); this.save(); this.closePanel(); };
      this.resizeHandle.addEventListener('keydown', e => {
        if (!this.positioning || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault(); e.stopPropagation(); const step = e.shiftKey ? 10 : 2;
        this.settings = settings({ ...this.settings, width: this.settings.width + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0), height: this.settings.height + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0) });
        this.save(); this.applySettings();
      });
      document.querySelector('.glass-player-bar')?.addEventListener('transitionend', () => this.updatePlacement());
    }
    openPanel() {
      this.panel.hidden = false; document.body.classList.add('lyrics-settings-open');
      this.panel.querySelector('#lyrics-close').focus();
      if (!this.document) this.setTrack(this.engine.currentTrack, true);
    }
    closePanel() {
      const interactionOpen = !this.panel.hidden || this.positioning || document.body.classList.contains('lyrics-settings-open');
      const active = document.activeElement;
      const ownedFocus = active === this.button || this.panel.contains(active) || this.stage.contains(active);
      this.panel.hidden = true; this.setPositioning(false);
      if (document.body.classList.contains('lyrics-settings-open')) document.body.classList.remove('lyrics-settings-open');
      if (ownedFocus) {
        active?.blur?.();
        if (this.ui.currentView === 'player' && !document.body.classList.contains('mini-bar-mode')) {
          const player = this.stage.parentElement;
          if (!player.hasAttribute('tabindex')) player.setAttribute('tabindex', '-1');
          player.focus({ preventScroll: true });
        }
      }
      if (interactionOpen) this.ui.refreshZenPointerState?.();
    }
    applyPalette(name) { if (!PALETTES[name]) return; Object.assign(this.settings, PALETTES[name]); this.save(); this.applySettings(); }
    updatePlacement() {
      this.stage.parentElement.classList.remove('lyrics-active-layout');
      if (this.stage.hidden) return;
      const rect = this.stage.parentElement.getBoundingClientRect(); if (!rect.height) return;
      const bar = document.querySelector('.glass-player-bar');
      const barRect = bar?.getBoundingClientRect(), barStyle = bar && getComputedStyle(bar);
      const zen = document.body.classList.contains('zen-mode');
      const dockVisible = zen && bar && (document.body.classList.contains('zen-show-player-bar') || document.body.classList.contains('zen-interactive-open') || document.body.classList.contains('zen-content-view') || bar.matches(':hover'));
      // Size the frame against the stable stage, never the dock's animated bounds.
      const bottom = zen ? rect.bottom - 12 : (barRect && barStyle.display !== 'none' && Number(barStyle.opacity) > 0.01 && barRect.top < rect.bottom ? Math.min(rect.bottom, barRect.top) - 12 : rect.bottom - 12);
      this.stage.style.setProperty('--lyric-bottom-clearance', `${Math.max(12, rect.bottom - bottom)}px`);
      const meta = document.getElementById('parallax-deck').getBoundingClientRect();
      // Fit real wrapped content, then keep the entire stage above the playback controls.
      const top = rect.top + 12;
      this.availableHeight = Math.max(24, bottom - top);
      const width = Math.min(Math.max(160, rect.width * this.settings.width / 100), Math.max(24, rect.width - 24));
      let height = Math.min(Math.max(80, this.availableHeight * this.settings.height / 100), this.availableHeight);
      // The default below-cover placement uses its own remaining space; resizing switches to custom.
      const belowSpace = bottom - meta.bottom - 10;
      if (this.settings.position === 'below' && belowSpace >= 48) height = Math.min(height, belowSpace);
      this.stage.style.width = `${width}px`; this.stage.style.height = `${height}px`;
      const setSize = size => this.stage.style.setProperty('--lyric-effective-size', `${size}px`);
      // Measure content, since flex centering can hide overflow above the stage.
      // scrollHeight is rounded to whole pixels, while layout height may be fractional.
      const fits = height => {
        const style = getComputedStyle(this.stage);
        const required = this.content.scrollHeight + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        return required <= Math.min(height, this.stage.clientHeight) + 1 && this.stage.scrollWidth <= this.stage.clientWidth + 1;
      };
      setSize(this.settings.size);
      const available = height;
      if (this.document?.timed && !fits(available)) {
        let low = 1, high = this.settings.size;
        for (let i = 0; i < 10; i++) { const mid = (low + high) / 2; setSize(mid); if (fits(available)) low = mid; else high = mid; }
        setSize(Math.floor(low * 10) / 10);
      }
      const half = this.stage.getBoundingClientRect().height / 2;
      const minY = top - rect.top + half, maxY = bottom - rect.top - half;
      const desired = this.settings.position === 'custom' ? rect.height * this.settings.y / 100 : meta.bottom - rect.top + 10 + half;
      const y = Math.max(minY, Math.min(maxY, desired));
      const halfWidth = this.stage.getBoundingClientRect().width / 2;
      const x = Math.max(halfWidth + 12, Math.min(rect.width - halfWidth - 12, rect.width * (this.settings.position === 'custom' ? this.settings.x / 100 : .5)));
      const frameBottom = this.settings.position === 'bottom' ? bottom : rect.top + y + half;
      const dockTop = rect.bottom - (bar?.offsetHeight || barRect?.height || 0);
      const neededLift = dockVisible ? Math.max(0, frameBottom - (dockTop - 12)) : 0;
      const lift = Math.min(neededLift, Math.max(0, frameBottom - height - top));
      this.stage.style.setProperty('--lyric-dock-shift', lift.toFixed(2) + 'px');
      this.stage.style.left = `${x}px`;
      this.stage.style.top = this.settings.position === 'bottom' ? 'auto' : `${Math.round(y)}px`;
      const value = `${Math.round(y)}px`;
      if (this.stage.style.getPropertyValue('--lyric-below-y') !== value) this.stage.style.setProperty('--lyric-below-y', value);
    }
    setPositioning(enabled) { this.positioning = !!enabled; this.stage.classList.toggle('is-positioning', this.positioning); this.resizeHandle.hidden = !this.positioning; this.lockHandle.hidden = !this.positioning; const b = this.panel.querySelector('#lyrics-position'); b.textContent = this.positioning ? '完成并锁定位置' : '调整位置与大小'; b.setAttribute('aria-pressed', String(this.positioning)); }
    mountHandles() { this.stage.appendChild(this.resizeHandle); this.stage.appendChild(this.lockHandle); }
    resetSettings() {
      this.settings = settings({ enabled: this.settings.enabled });
      let map = {}; try { map = JSON.parse(localStorage.getItem('glasswave_lyrics_track_offsets') || '{}'); } catch {}
      if (this.trackPath) { delete map[this.trackPath]; localStorage.setItem('glasswave_lyrics_track_offsets', JSON.stringify(map)); }
      this.offset = 0;
      this.panel.querySelector('#lyrics-offset').value = 0;
      this.panel.querySelector('#lyrics-offset-value').textContent = '0ms';
      this.setPositioning(false); this.save(); this.applySettings();
    }
    async setTrack(track, force = false) {
      const trackPath = track?.path || '';
      if (!force && this.trackPath === trackPath) return;
      this.trackPath = trackPath; const generation = ++this.generation; this.document = null; this.source = ''; this.index = -2; this.offset = 0;
      try { this.offset = clamp(JSON.parse(localStorage.getItem('glasswave_lyrics_track_offsets') || '{}')[trackPath], -5000, 5000, 0); } catch {}
      this.panel.querySelector('#lyrics-offset').value = this.offset; this.panel.querySelector('#lyrics-offset-value').textContent = `${this.offset}ms`;
      this.panel.querySelector('#lyrics-import').disabled = !trackPath;
      this.panel.querySelector('#lyrics-translation-import').disabled = !trackPath;
      this.message = trackPath ? '暂无歌词 · 右键字幕图标导入歌词' : '选择歌曲后显示歌词'; this.render(true);
      this.panel.querySelector('#lyrics-source').textContent = trackPath ? '尚未载入歌词' : '选择一首歌曲后可导入歌词。';
      if (!trackPath || !this.settings.enabled && this.panel.hidden || !window.glasswaveAPI?.loadLyrics) return;
      this.message = '正在读取歌词…'; this.render(true);
      try {
        const result = await window.glasswaveAPI.loadLyrics(trackPath);
        if (generation !== this.generation || trackPath !== this.engine.currentTrack?.path) return;
        this.accept(result);
      } catch (e) { if (generation === this.generation) this.accept({ error: e.message }); }
    }
    accept(result) {
      this.document = result?.document || null; this.source = result?.source || '';
      this.message = result?.error || '暂无歌词 · 右键字幕图标导入歌词';
      const doc = this.document;
      this.panel.querySelector('#lyrics-source').textContent = doc ? `${this.source} · ${doc.format} · ${doc.wordTimed ? '逐字同步' : doc.timed ? '逐句同步' : '无时间轴，手动滚动'}` : this.message;
      if (result?.translationSource) this.panel.querySelector('#lyrics-source').textContent += ` · 译文：${result.translationSource}`;
      if (result?.translationError) this.panel.querySelector('#lyrics-source').textContent += ` · ${result.translationError}`;
      this.index = -2; this.render(true); this.schedule();
    }
    async import(translation = false) {
      const trackPath = this.engine.currentTrack?.path;
      if (!trackPath || !window.glasswaveAPI?.importLyrics) return;
      const button = this.panel.querySelector(translation ? '#lyrics-translation-import' : '#lyrics-import'); button.disabled = true;
      try {
        const result = await (translation ? window.glasswaveAPI.importLyricsTranslation(trackPath) : window.glasswaveAPI.importLyrics(trackPath));
        if (result?.canceled || trackPath !== this.engine.currentTrack?.path) return;
        if (result?.error) { this.ui.showToast(result.error); return; }
        ++this.generation; this.trackPath = trackPath; this.settings.enabled = true; this.save(); this.applySettings(); this.accept(result);
      } catch (e) { this.ui.showToast(e.message); }
      finally { button.disabled = !this.engine.currentTrack?.path; }
    }
    cancelFrame() { if (this.frame !== null) cancelAnimationFrame(this.frame); this.frame = null; }
    schedule() {
      if (!this.settings.enabled || !this.document?.timed || this.audio.paused || this.audio.ended || document.hidden || this.suspended || this.ui.currentView !== 'player') { this.cancelFrame(); return; }
      if (this.frame !== null) return;
      this.frame = requestAnimationFrame(now => { this.frame = null; if (now - this.lastFrame >= 1000 / 60) { this.lastFrame = now; this.render(); } this.schedule(); });
    }
    render(immediate = false) {
      if (!this.settings.enabled) return;
      const timing = root.GlassWaveLyricTiming, doc = this.document;
      if (!doc) { if (this.index !== -3 || immediate) { this.content.textContent = this.message || '选择歌曲后显示歌词'; this.content.classList.remove('is-plain-text'); this.stage.classList.add('is-empty'); this.index = -3; this.mountHandles(); } return; }
      this.stage.classList.remove('is-empty');
      if (!doc.timed) {
        if (this.index !== -4 || immediate) { this.content.replaceChildren(); this.content.classList.add('is-plain-text'); const list = document.createElement('div'); list.className = 'lyrics-scroll-container'; doc.lines.forEach(l => { const p = document.createElement('p'); p.textContent = l.text; list.appendChild(p); if (this.settings.translation && l.translation) { const t = document.createElement('p'); t.className = 'lyric-translation'; t.textContent = l.translation; list.appendChild(t); } }); this.content.appendChild(list); this.index = -4; this.mountHandles(); this.updatePlacement(); }
        return;
      }
      const ms = Math.max(0, (Number(this.audio.currentTime) || 0) * 1000 - (this.offset || 0));
      const index = timing.locate(doc.lines, ms);
      if (index !== this.index || immediate) {
        this.index = index; this.content.replaceChildren(); this.content.classList.remove('is-plain-text'); this.wordNodes = [];
        const line = doc.lines[index];
        const neighbor = (line, className) => {
          if (!line) return;
          const block = document.createElement('div'); block.className = `lyric-neighbor ${className}`;
          const original = document.createElement('div'); original.className = 'lyric-original'; original.textContent = line.text; block.appendChild(original);
          // Consecutive original lines may share one complete translated phrase.
          // Keep that phrase visible once while the original karaoke advances.
          if (this.settings.translation && line.translation && line.translation !== doc.lines[index]?.translation) { const t = document.createElement('div'); t.className = 'lyric-translation'; t.textContent = line.translation; block.appendChild(t); }
          this.content.appendChild(block);
        };
        if (this.settings.rows === 3) neighbor(doc.lines[index - 1], 'lyric-previous');
        const active = document.createElement('div'); active.className = 'lyric-current';
        if (line) {
          if (line.words.length && this.settings.animation === 'karaoke') {
            line.words.forEach(w => { const word = document.createElement('span'); word.className = 'lyric-word'; word.textContent = w.text; const fill = document.createElement('span'); fill.className = 'lyric-word-fill'; fill.textContent = w.text; fill.setAttribute('aria-hidden', 'true'); word.appendChild(fill); active.appendChild(word); this.wordNodes.push({ fill, word: w, progress: -1 }); });
          } else { active.textContent = line.text; active.classList.add('lyric-line-highlight'); }
        } else active.textContent = '♪';
        this.content.appendChild(active);
        if (this.settings.translation && line?.translation) { const translation = document.createElement('div'); translation.className = 'lyric-translation'; translation.textContent = line.translation; this.content.appendChild(translation); }
        if (this.settings.rows >= 2) neighbor(doc.lines[index + 1], 'lyric-next');
        this.mountHandles();
        this.updatePlacement();
        if (!immediate && index >= 0 && this.settings.animation !== 'none' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          this.content.getAnimations().forEach(a => a.cancel());
          this.content.animate([{ opacity: 0.65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 160, easing: 'ease-out' });
        } else this.content.getAnimations().forEach(a => a.cancel());
      }
      for (const item of this.wordNodes) {
        const progress = Math.round(timing.wordProgress(item.word, ms) * 1000) / 1000;
        if (progress !== item.progress) { item.fill.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`; item.progress = progress; }
      }
    }
  }
  root.GlassWaveLyrics = { LyricsController, settings, DEFAULTS, PALETTES, KEY };
})(window);
