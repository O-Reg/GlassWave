/**
 * GlassWave UI Controller
 * Comprehensive controller handling:
 * 1. Responsive Visualizer Layout (downward non-overlapping zone)
 * 2. Instant Fuzzy Multi-field Search with Clear & Count badge
 * 3. Drag & Drop File/Folder Import with Duplicate Detection
 * 4. Custom Category System ("我的分类" - Create, Rename, Delete, Drag, Filter)
 * 5. Current Playback Queue Drawer with Reordering, Removal & Dedicated Queue Ops
 * 6. Basic Library Enhancements: Favorites, Recents, Multi-column Sorting, Ctrl/Shift Multi-select, Batch Operations
 * 7. Multi-harmonic Tag System with Presets (Mood, Usage) & Multi-tag Combinations
 */

// 22 Exquisite Music Themed Vector Icons for Custom Categories
const CATEGORY_ICONS = [
  { id: 'disc', name: '黑胶唱片', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><path d="M12 2a10 10 0 0 1 7.07 2.93"></path></svg>` },
  { id: 'cd', name: 'CD光盘', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle><circle cx="12" cy="12" r="1"></circle></svg>` },
  { id: 'cassette', name: '复古磁带', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="8" cy="12" r="2"></circle><circle cx="16" cy="12" r="2"></circle><path d="M6 18h12"></path></svg>` },
  { id: 'headphones', name: '监听耳机', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>` },
  { id: 'mic', name: '专业麦克风', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>` },
  { id: 'soundwave', name: '声学波形', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="12" x2="2" y2="12.01"></line><line x1="6" y1="8" x2="6" y2="16"></line><line x1="10" y1="4" x2="10" y2="20"></line><line x1="14" y1="7" x2="14" y2="17"></line><line x1="18" y1="9" x2="18" y2="15"></line><line x1="22" y1="12" x2="22" y2="12.01"></line></svg>` },
  { id: 'clef', name: '高音谱号', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3c-1.5 0-3 2-3 4.5 0 3.5 4 5 4 8a4 4 0 1 1-8 0c0-2.5 2-4 3-5l1-5.5"></path><circle cx="10" cy="18" r="1.5"></circle></svg>` },
  { id: 'notes', name: '双音符', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>` },
  { id: 'note-single', name: '单音符', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="18" r="3"></circle><path d="M11 18V4a3 3 0 0 1 3 3v2"></path></svg>` },
  { id: 'equalizer', name: '均衡跳动', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line></svg>` },
  { id: 'radio', name: '复古电台', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="14" rx="2"></rect><path d="M4.5 8L16 2"></path><circle cx="8" cy="15" r="3"></circle><line x1="15" y1="13" x2="19" y2="13"></line><line x1="15" y1="17" x2="19" y2="17"></line></svg>` },
  { id: 'guitar', name: '木吉他', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m19 5-3 3"></path><path d="m15 9-6.5 6.5a3.5 3.5 0 0 0 5 5L20 14a3.5 3.5 0 0 0-5-5Z"></path><path d="m21 3-3 3"></path><circle cx="15.5" cy="15.5" r="1"></circle></svg>` },
  { id: 'piano', name: '钢琴琴键', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="6" y1="5" x2="6" y2="14"></line><line x1="10" y1="5" x2="10" y2="14"></line><line x1="14" y1="5" x2="14" y2="14"></line><line x1="18" y1="5" x2="18" y2="14"></line></svg>` },
  { id: 'drum', name: '爵士鼓', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="7" rx="9" ry="3"></ellipse><path d="M3 7v10c0 1.66 4.03 3 9 3s9-1.34 9-3V7"></path><path d="m6 13 6 4 6-4"></path></svg>` },
  { id: 'speaker', name: '低音音箱', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><circle cx="12" cy="14" r="4"></circle><circle cx="12" cy="6" r="1.5"></circle></svg>` },
  { id: 'turntable', name: 'DJ 打碟机', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><circle cx="9" cy="12" r="5"></circle><circle cx="9" cy="12" r="2"></circle><line x1="17" y1="8" x2="17" y2="16"></line><circle cx="17" cy="12" r="1"></circle></svg>` },
  { id: 'heart-music', name: '心动旋律', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><circle cx="12" cy="11" r="1.5"></circle></svg>` },
  { id: 'star-music', name: '星芒之声', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>` },
  { id: 'flame-music', name: '烈焰节奏', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>` },
  { id: 'crystal-note', name: '水晶和弦', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9Z"></path><path d="M11 3 8 9l4 12 4-12-3-6"></path><path d="M2 9h20"></path></svg>` },
  { id: 'sax', name: '萨克斯风', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6a4 4 0 0 0 4 4h2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-2a6 6 0 0 1-6-6V2"></path><circle cx="18" cy="18" r="2"></circle></svg>` },
  { id: 'bell', name: '风铃钟琴', svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>` }
];

class UIController {
  constructor(audioEngine, visualizer, colorEngine, parallax) {
    this.audioEngine = audioEngine;
    this.visualizer = visualizer;
    this.colorEngine = colorEngine;
    this.parallax = parallax;

    // Keep all slide-out drawers in the same coordinate space as the rounded
    // window shell. Fixed layers in different ancestors can expose a strip at
    // the top while the frameless window is moved.
    const appShell = document.getElementById('app-shell');
    for (const id of ['view-settings', 'view-visualizer-drawer', 'glass-queue-drawer']) {
      const drawer = document.getElementById(id);
      if (appShell && drawer && drawer.parentElement !== appShell) appShell.appendChild(drawer);
    }

    // Core Data States
    this.allTracks = [];
    this.filteredTracks = [];
    this.playbackHistory = [];
    this.categories = [];
    this.categoryGroups = [];
    this.customTags = [];
    this.presetMoods = ['黑暗', '悲伤', '温暖', '神秘', '庄严', '激昂', '宁静', '欢快'];
    this.presetUsages = ['开场', '背景', '转场', '高潮', '结尾', '旁白', '主题曲'];
    this.hiddenPresetTags = new Set();

    // Single Source of Truth for UI Layout Mode: 'NORMAL' | 'VISUALIZER_FULLSCREEN'
    this.uiMode = 'NORMAL';
    this.currentView = 'player';

    // Safety Startup Guard: Purge any stale fullscreen/zen classes
    document.body.classList.remove('visualizer-fullscreen-active', 'zen-mode', 'zen-controls-hidden');
    const startupExitControl = document.getElementById('fullscreen-exit-control');
    if (startupExitControl) startupExitControl.style.display = 'none';

    // Filter & View States
    this.currentSubView = 'all'; // 'all' | 'favorites' | 'recent' | 'added' | 'category:<id>'
    this.activeFilterTags = new Set();
    this.searchQuery = '';
    this.sortBy = 'default'; // 'default' | 'title' | 'artist' | 'album' | 'dateAdded' | 'duration'
    this.sortAsc = true;

    // Multi-Selection State
    this.selectedTrackPaths = new Set();
    this.lastSelectedTrackIndex = -1;

    // Virtual Scrolling Geometry & Memory Optimization (Ultra-smooth 10,000+ items)
    this.ROW_STRIDE = 56; // 52px height + 4px margin
    this.BUFFER_ITEMS = 6; // Compact buffer for zero latency & maximum scroll FPS
    this.coverCache = new Map();
    this.pendingCoverRequests = new Set();
    this.visibleStartIndex = -1;
    this.visibleEndIndex = -1;
    this.isLibraryScrolling = false;
    this.coverLoadQueueTimer = null;
    this.rowPool = [];
    this.fastIndicatorTimer = null;

    // Queue Virtual Scrolling Geometry & State (Full-library queue without 250 limitation)
    this.QUEUE_ROW_STRIDE = 48; // 44px height + 4px margin
    this.queueRowPool = [];
    this.queueVisibleStart = -1;
    this.queueVisibleEnd = -1;
    this.lastCurQueueIdx = -1;


    // Context Menu & Modal States
    this.selectedTrackForMenu = null;
    this.isDraggingTimeline = false;
    this.isDraggingVolume = false;
    this.isDraggingScrollbar = false;
    this.activeCategoryIconPickerCat = null;
    this.pendingDroppedTracks = [];
    this.activeTagModalTracks = [];
    this.activeTagModalTags = new Set();

    // Strict Guard: Never allow #app-shell to scroll horizontally
    const appShellEl = document.getElementById('app-shell');
    if (appShellEl) {
      appShellEl.addEventListener('scroll', () => {
        if (appShellEl.scrollLeft !== 0) appShellEl.scrollLeft = 0;
      });
    }

    // Initialize UI Binders
    this.bindWindowControls();
    this.bindTitlebarDoubleClick();
    this.bindNavigation();
    this.bindPlaybackControls();
    this.bindTimeline();
    this.bindVolume();
    this.bindGlobalVolumeWheel();
    this.bindVisualizerTabs();
    this.bindVisualizerFullscreen();
    this.bindVisualizerCustomization();
    this.bindVisualizerTuning();
    this.bindKeyboardShortcuts();
    this.bindSettings();
    this.bindSearch();
    this.bindLibraryActions();
    this.bindContextMenu();
    this.bindCenterStageContextMenu();
    this.bindHiFiInspector();
    this.bindZenMode();
    this.bindSidebarToggle();
    this.bindMiniMode();
    this.bindPinMode();
    this.bindEqualizer();

    this.bindLibraryScroll();
    this.initAlphabetIndexBar();
    this.initOverlayScrollbar();
    this.bindOverlayScrollbars();
    this.bindCategoryIconPickerGlobal();

    // Advanced Feature Binders
    this.bindCategoriesSystem();
    this.bindQueueDrawer();
    this.bindDragAndDropImport();
    this.bindSortAndFilter();
    this.bindTagSystem();
    this.bindWindowResizing();
    this.bindBatchActions();
    this.bindCategoryContextMenu();
    this.renderThemePresets();
    this.renderCustomPresets();
    this.bindCustomPresetActions();
    this.initCustomWallpaper();
    this.initWindowGlassOpacity();
    this.organizeTransparencyControls();
    window.GlassWaveTheme?.init();
    window.GlassWaveSkin?.init(this);
    this.normalizeParameterRows();
    this.bindResponsiveInteraction();
    this.renderPureColors();
    this.bindAmbientGlowControls();
    window.GlassWaveShortcuts?.initMenu(this);
    this.organizeSettingsCategories();

    // app.js owns the single filesystem update subscription.

    // Listen to Audio Engine Queue Changes
    this.audioEngine.onQueueChange = () => {
      this.renderQueue();
    };
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // =========================================================================
  // 1. Window Controls & Titlebar
  // =========================================================================
  bindWindowControls() {
    const api = window.glasswaveAPI;
    const btnMin = document.getElementById('btn-minimize');
    const btnMax = document.getElementById('btn-maximize');
    const btnClose = document.getElementById('btn-close');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    if (api) {
      if (btnMin) btnMin.onclick = () => api.minimizeWindow();
      if (btnMax) btnMax.onclick = () => this.toggleVisualizerFullscreen();
      if (btnClose) btnClose.onclick = () => api.closeWindow();
      if (btnFullscreen) btnFullscreen.onclick = () => this.toggleVisualizerFullscreen();
    }

    // Windows 11 Snap Layouts Flyout Popover on Maximize button hover
    const snapWrap = document.getElementById('snap-btn-wrap');
    const snapPopover = document.getElementById('snap-layouts-popover');
    let snapTimer = null;

    if (snapWrap && snapPopover) {
      snapWrap.addEventListener('mouseenter', () => {
        if (snapTimer) clearTimeout(snapTimer);
        snapTimer = setTimeout(() => {
          snapPopover.style.display = 'block';
        }, 150);
      });

      snapWrap.addEventListener('mouseleave', () => {
        if (snapTimer) clearTimeout(snapTimer);
        snapTimer = setTimeout(() => {
          snapPopover.style.display = 'none';
        }, 220);
      });

      snapPopover.querySelectorAll('.snap-tile').forEach(tile => {
        tile.addEventListener('click', async (e) => {
          e.stopPropagation();
          const snapType = tile.dataset.snap;
          if (snapType && api && api.snapWindow) {
            await api.snapWindow(snapType);
          }
          snapPopover.style.display = 'none';
        });
      });
    }

    if (api && api.onWindowSnapped) {
      api.onWindowSnapped((data) => {
        if (data && data.snapType) {
          document.body.classList.add('snapped-window', `snapped-${data.snapType}`);
        } else {
          document.body.classList.remove('snapped-window', 'snapped-left-half', 'snapped-right-half', 'snapped-top-left', 'snapped-top-right', 'snapped-bottom-left', 'snapped-bottom-right', 'snapped-maximize');
        }
      });
    }
  }

  bindTitlebarDoubleClick() {
    const titlebar = document.getElementById('titlebar');
    if (titlebar && window.glasswaveAPI) {
      titlebar.addEventListener('dblclick', (e) => {
        if (e.target && e.target.closest('button, input, select, textarea, .search-cluster, .hifi-badge-wrap, .glass-hifi-popover, .win-btn')) return;
        e.preventDefault();
        e.stopPropagation();
        this.toggleVisualizerFullscreen();
      });
    }
  }

  // =========================================================================
  // 2. Navigation & View Routing
  // =========================================================================
  bindNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        const subview = item.dataset.subview || 'all';
        if (view === 'library' && (subview === 'all' || !subview) && this.currentView === 'library' && this.currentSubView === 'all') {
          // Already on all songs, smoothly scroll to currently playing track
          this.scrollToCurrentLibraryTrack(true);
          return;
        }
        this.switchView(view, subview);
      });
    });
  }

  normalizeParameterRows() {
    if(this._parameterRowsReady) return;
    this._parameterRowsReady=true;
    document.querySelectorAll('.settings-content input[type="range"]').forEach(range=>{
      if(range.style.display==='none') return;
      const row=range.parentElement, heading=range.previousElementSibling;
      if(row.dataset.parameterReady || !heading || heading.tagName!=='DIV') return;
      const value=heading.querySelector('[id^="lbl-"],span[id]');
      if(!value || heading.querySelector('input,select')) return;
      const source=value.parentElement.cloneNode(true);
      source.querySelectorAll('[id],button,.setting-desc').forEach(e=>e.remove());
      const title=source.textContent.trim().replace(/[：:]$/,'');
      if(!title) return;
      const buttons=[...heading.querySelectorAll('button')];
      const newHeading=document.createElement('div');newHeading.className='parameter-heading';
      const label=document.createElement('label');label.htmlFor=range.id;label.textContent=title;label.title=title;
      value.classList.add('parameter-value');newHeading.append(label,value);
      heading.replaceWith(newHeading);row.classList.add('parameter-row');row.classList.remove('stable-slider-row');
      row.dataset.parameterReady='true';
      if(buttons.length){const toolbar=document.createElement('div');toolbar.className='parameter-actions';toolbar.append(...buttons);range.after(toolbar);}
    });
  }

  syncIntensityControl(value) {
    const slider = document.getElementById('setting-intensity');
    const label = document.getElementById('lbl-visualizer-intensity');
    if (!slider) return;
    const amount = Math.min(Number(slider.max), Math.max(Number(slider.min), Number(value) || 1));
    slider.value = String(amount);
    slider.style.setProperty('--val-pct', `${((amount - Number(slider.min)) / (Number(slider.max) - Number(slider.min))) * 100}%`);
    if (label) label.textContent = `${amount.toFixed(1)}×`;
  }

  getDefaultVisualizerModeControls(mode = this.visualizer?.mode) {
    // Baseline captured from the tuned 1.2.1 preview. Other modes retain their
    // existing center placement and standard sensitivity/scale.
    const previewDefaults = {
      wave: { intensity: 1, position: 'center', offsetY: 60, scale: 1.4 },
      spectrum: { intensity: 1, position: 'behind', offsetY: 0, scale: 1.35 },
      bars: { intensity: 1.4, position: 'below', offsetY: 80, scale: 2 },
      orb: { intensity: 1, position: 'center', offsetY: 0, scale: 1.25 }
    };
    return {
      intensity: 1,
      position: this.visualizer?.getDefaultPositionForMode(mode) || 'center',
      offsetY: 0,
      scale: 1.25,
      ...previewDefaults[mode]
    };
  }

  getVisualizerModeControls(mode = this.visualizer?.mode) {
    const defaults = this.getDefaultVisualizerModeControls(mode);
    const saved = this.visualizerModeControls?.[mode] || {};
    const clamp = (value, fallback, min, max) => {
      const number = Number(value);
      return value == null || !Number.isFinite(number) ? fallback : Math.min(max, Math.max(min, number));
    };
    return {
      intensity: clamp(saved.intensity, defaults.intensity, 0.5, 2),
      position: ['behind', 'below', 'center'].includes(saved.position) ? saved.position : defaults.position,
      offsetY: clamp(saved.offsetY, defaults.offsetY, -180, 180),
      scale: clamp(saved.scale, defaults.scale, 0.7, 2.8)
    };
  }

  applyVisualizerModeControls(mode = this.visualizer?.mode) {
    if (!this.visualizer || !mode) return;
    const controls = this.getVisualizerModeControls(mode);
    this.visualizer.setIntensity(controls.intensity);
    this.visualizer.setPositionPreset(controls.position);
    this.visualizer.setOffsetY(controls.offsetY);
    this.visualizer.setScale(controls.scale);
    this.syncVisualizerCustomizationUI();
  }

  saveVisualizerModeControls(patch, mode = this.visualizer?.mode) {
    if (!mode) return;
    this.visualizerModeControls ||= {};
    this.visualizerModeControls[mode] = { ...this.getVisualizerModeControls(mode), ...patch };
    this._visualizerModeControlsChanged = true;
    try { localStorage.setItem('glasswave_visualizer_mode_controls_v1', JSON.stringify(this.visualizerModeControls)); } catch (e) {}
    clearTimeout(this._saveVisualizerModeControlsTimer);
    this._saveVisualizerModeControlsTimer = setTimeout(() => {
      window.glasswaveAPI?.saveConfig?.({ visualizerModeControls: this.visualizerModeControls });
    }, 250);
  }

  switchVisualizerMode(mode) {
    if (!this.visualizer || !['wave', 'spectrum', 'sphere', 'bars', 'orb', 'ambient', 'reactive', 'curtain'].includes(mode)) return;
    if (this.visualizer.mode !== mode) this.visualizer.setMode(mode);
    this.applyVisualizerModeControls(mode);
    document.querySelectorAll('.vis-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.mode === mode));
  }

  organizeSettingsCategories() {
    const panel = document.getElementById('settings-panel-main');
    if (!panel || panel.querySelector('.settings-category-title')) return;
    const original = [...panel.children]; const used = new Set();
    const addGroup = (label, ids) => {
      const title = document.createElement('h3'); title.className = 'settings-category-title'; title.textContent = label; panel.append(title);
      for (const id of ids) {
        let item = document.getElementById(id);
        while (item && item.parentElement !== panel) item = item.parentElement;
        if (item && !used.has(item)) { used.add(item); panel.append(item); }
      }
    };
    const shortcutEntry = document.getElementById('shortcut-entry');
    if (shortcutEntry) { used.add(shortcutEntry); panel.append(shortcutEntry); }
    addGroup('桌面与背景', ['transparency-controls','btn-choose-custom-bg','pure-color-dense-grid']);
    addGroup('皮肤与界面', ['interface-color-settings','skin-manager-entry','theme-preset-grid','setting-compact-sidebar-nav','btn-toggle-cover']);
    addGroup('视觉效果', ['btn-open-vis-advanced','setting-glow-enabled','setting-parallax']);
    addGroup('播放与曲库', ['setting-autoplay','setting-launch-shuffle','setting-remember-progress','setting-auto-add-dropped','btn-unhide-all']);
    // Keep any future controls in their own final section rather than losing them.
    const remaining = original.filter(item => !used.has(item));
    if (remaining.length) { const title = document.createElement('h3'); title.className='settings-category-title'; title.textContent='其他设置'; panel.append(title,...remaining); }
  }

  organizeTransparencyControls() {
    const panel=document.getElementById('settings-panel-main');
    if(!panel || document.getElementById('transparency-controls')) return;
    const group=document.createElement('section');group.id='transparency-controls';group.className='setting-item transparency-controls';
    const title=document.createElement('div');title.className='setting-title';title.textContent='桌面与背景抠图';group.append(title);
    const row=(rangeId,valueId,text)=>{
      const range=document.getElementById(rangeId),value=document.getElementById(valueId);
      const r=document.createElement('div');r.className='parameter-row';r.dataset.parameterReady='true';
      const h=document.createElement('div');h.className='parameter-heading';
      const label=document.createElement('label');label.htmlFor=rangeId;label.textContent=text;
      if(rangeId==='setting-bg-luma-threshold')label.id='lbl-bg-luma-title';
      value.classList.add('parameter-value');h.append(label,value);r.append(h,range);return r;
    };
    const desktopParent=document.getElementById('setting-desktop-reveal').closest('.setting-item');
    const glassParent=document.getElementById('row-window-glass-opacity');
    const luma=document.getElementById('row-bg-luma-threshold');
    const keyLabel=this.bgLumaColor==='white'?'白底透光阈值':this.bgLumaColor==='black'?'黑底透光阈值':'背景抠图阈值';
    group.append(row('setting-desktop-reveal','lbl-desktop-reveal','桌面透光程度'),row('setting-bg-luma-threshold','lbl-bg-luma-threshold',keyLabel));
    group.append(luma.querySelector('.luma-color-grid'));
    group.append(luma.querySelector('.luma-preset-grid'));
    group.append(row('setting-window-glass-ratio','lbl-window-glass-ratio','界面亚克力通透度'));
    const help=document.createElement('p');help.className='setting-desc';help.textContent='桌面透光控制底幕，抠图去掉图片的黑底或白底，界面通透控制菜单和边栏。';group.append(help);
    const reset=document.getElementById('btn-reset-window-glass');reset.title='重置界面通透度';reset.textContent='重置界面';const groupHeading=document.createElement('div');groupHeading.className='transparency-heading';title.replaceWith(groupHeading);groupHeading.append(title,reset);
    desktopParent.remove();glassParent.remove();luma.remove();panel.prepend(group);
    const close=document.getElementById('btn-close-settings');document.getElementById('settings-header-main').prepend(close);
  }

  bindResponsiveInteraction() {
    const begin=()=>{clearTimeout(this._interactionEnd);document.body.classList.add('direct-interaction');};
    const end=()=>{clearTimeout(this._interactionEnd);this._interactionEnd=setTimeout(()=>document.body.classList.remove('direct-interaction'),100);};
    document.addEventListener('pointerdown',e=>{if(e.target.matches('input[type="range"]') || e.target.closest('.window-resize-handle'))begin();},true);
    window.addEventListener('pointerup',end,true);window.addEventListener('pointercancel',end,true);window.addEventListener('blur',end);
    this.beginDirectInteraction=begin;this.endDirectInteraction=end;
  }

  toggleVisualizerDrawer(forceOpen) {
    this.normalizeParameterRows();
    const drawer = document.getElementById('view-visualizer-drawer');
    const triggerBtn = document.getElementById('btn-open-vis-menu');
    const shortcutBtn = document.getElementById('btn-vis-tune-shortcut');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    const target = forceOpen !== undefined ? forceOpen : !isOpen;

    if (target) {
      // Close settings drawer, queue drawer & EQ if open to avoid right-edge clash
      const settingsDrawer = document.getElementById('view-settings');
      if (settingsDrawer && settingsDrawer.classList.contains('open')) {
        this.toggleSettingsDrawer(false);
      }
      const queueDrawer = document.getElementById('glass-queue-drawer');
      const queueBtn = document.getElementById('btn-queue-toggle');
      if (queueDrawer && queueDrawer.classList.contains('open')) {
        queueDrawer.classList.remove('open');
        if (queueBtn) queueBtn.classList.remove('active');
      }
      const eqModal = document.getElementById('glass-eq-modal');
      const eqBtn = document.getElementById('btn-toggle-eq');
      if (eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex')) {
        eqModal.classList.remove('open');
        eqModal.style.display = 'none';
        if (eqBtn) eqBtn.classList.remove('active');
      }

      drawer.classList.add('open');
      drawer.style.display = 'flex';
      if (triggerBtn) triggerBtn.classList.add('active');
      if (shortcutBtn) shortcutBtn.classList.add('active');
      this.selectVisualizerTuneMode?.(this.visualizer?.mode, false);
      this.syncVisualizerCustomizationUI();
      if (this.syncVisualizerTuningUI) this.syncVisualizerTuningUI();

      if (document.body.classList.contains('zen-mode')) {
        this.cancelZenAutoHide?.();
        document.body.classList.add('zen-interactive-open', 'zen-show-player-bar');
      }
    } else {
      drawer.classList.remove('open');
      if (triggerBtn) triggerBtn.classList.remove('active');
      if (shortcutBtn) shortcutBtn.classList.remove('active');

      if (document.body.classList.contains('zen-mode')) {
        const queueDrawer = document.getElementById('glass-queue-drawer');
        const eqModal = document.getElementById('glass-eq-modal');
        const settingsDrawer = document.getElementById('view-settings');
        const isQOpen = queueDrawer && queueDrawer.classList.contains('open');
        const isEqOpen = eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex');
        const isSetOpen = settingsDrawer && settingsDrawer.classList.contains('open');
        document.body.classList.toggle('zen-interactive-open', isQOpen || isEqOpen || isSetOpen);
      }
    }
  }

  toggleSettingsDrawer(forceOpen) {
    this.normalizeParameterRows();
    const drawer = document.getElementById('view-settings');
    const navBtn = document.querySelector('.nav-item[data-view="settings"]');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    const target = forceOpen !== undefined ? forceOpen : !isOpen;

    if (target) {
      // Close visualizer drawer, queue drawer & EQ if open to avoid right-edge clash
      const visDrawer = document.getElementById('view-visualizer-drawer');
      if (visDrawer && visDrawer.classList.contains('open')) {
        this.toggleVisualizerDrawer(false);
      }
      const queueDrawer = document.getElementById('glass-queue-drawer');
      const queueBtn = document.getElementById('btn-queue-toggle');
      if (queueDrawer && queueDrawer.classList.contains('open')) {
        queueDrawer.classList.remove('open');
        if (queueBtn) queueBtn.classList.remove('active');
      }
      const eqModal = document.getElementById('glass-eq-modal');
      const eqBtn = document.getElementById('btn-toggle-eq');
      if (eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex')) {
        eqModal.classList.remove('open');
        eqModal.style.display = 'none';
        if (eqBtn) eqBtn.classList.remove('active');
      }

      drawer.classList.add('open');
      drawer.style.display = 'flex';
      if (navBtn) navBtn.classList.add('active');
      this.currentView = 'settings';
      this.syncZenChromeForView();

      // Controls are built once at startup; opening the drawer must not rebuild them.
      this.syncVisualizerCustomizationUI();

      if (document.body.classList.contains('zen-mode')) {
        document.body.classList.add('zen-interactive-open');
      }
    } else {
      window.GlassWaveShortcuts?.closePage(false);
      drawer.classList.remove('open');
      if (navBtn) navBtn.classList.remove('active');

      // Restore current view to stage under drawer (player, library or folders)
      const libStage = document.getElementById('view-library');
      const foldersStage = document.getElementById('view-folders');
      const activeStage = (libStage && libStage.style.display === 'flex') ? 'library' :
                          ((foldersStage && foldersStage.style.display === 'flex') ? 'folders' : 'player');
      this.currentView = activeStage;
      this.syncZenChromeForView();

      // Update active nav button
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(n => {
        n.classList.toggle('active', n.dataset.view === activeStage);
      });

      if (document.body.classList.contains('zen-mode')) {
        const queueDrawer = document.getElementById('glass-queue-drawer');
        const eqModal = document.getElementById('glass-eq-modal');
        const visDrawer = document.getElementById('view-visualizer-drawer');
        const isQOpen = queueDrawer && queueDrawer.classList.contains('open');
        const isEqOpen = eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex');
        const isVisOpen = visDrawer && visDrawer.classList.contains('open');
        document.body.classList.toggle('zen-interactive-open', isQOpen || isEqOpen || isVisOpen);
      }
    }
  }

  switchView(viewName, subView = 'all') {
    if (viewName === 'settings') {
      const drawer = document.getElementById('view-settings');
      const isOpen = drawer && drawer.classList.contains('open');
      this.toggleSettingsDrawer(!isOpen);
      return;
    }

    // When switching to any regular stage (player, library, folders), close settings & visualizer drawers
    this.toggleSettingsDrawer(false);
    this.toggleVisualizerDrawer(false);

    const appShellEl = document.getElementById('app-shell');
    if (appShellEl && appShellEl.scrollLeft !== 0) appShellEl.scrollLeft = 0;
    if (window.scrollX !== 0) window.scrollTo(0, 0);

    const animateZenContentEntry = document.body.classList.contains('zen-mode') &&
      !document.body.classList.contains('zen-content-view') && viewName !== 'player';
    this.currentView = viewName;
    const viewMap = {
      player: document.getElementById('view-player'),
      library: document.getElementById('view-library'),
      folders: document.getElementById('view-folders')
    };

    // Update active nav button (Strict Single Selection State)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(n => {
      if (!subView.startsWith('category:') && n.dataset.view === viewName && (!n.dataset.subview || n.dataset.subview === subView)) {
        n.classList.add('active');
      } else {
        n.classList.remove('active');
      }
    });

    // Remove active state on category list if navigating elsewhere
    if (!subView.startsWith('category:')) {
      document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
    }

    // Toggle view stages
    Object.keys(viewMap).forEach(k => {
      if (viewMap[k]) viewMap[k].style.display = 'none';
    });

    if (viewMap[viewName]) {
      viewMap[viewName].style.display = 'flex';
    }

    // A2 Performance: Pause visualizer canvas rendering when viewing library in normal mode to allocate 100% GPU/CPU to scrolling;
    // In Zen Mode, KEEP visualizer active so waves/particles are visible through the frosted glass
    if (this.visualizer) {
      if (viewName !== 'player' && !document.body.classList.contains('zen-mode')) {
        this.visualizer.isPaused = true;
        if (this.visualizer.ctx && this.visualizer.width && this.visualizer.height) {
          this.visualizer.ctx.clearRect(0, 0, this.visualizer.width, this.visualizer.height);
        }
      } else {
        this.visualizer.isPaused = false;
        if (this.visualizer.invalidateCoverMetrics) {
          this.visualizer.invalidateCoverMetrics();
        }
      }
    }

    if (viewName === 'library') {
      if (this.currentSubView !== subView) this.clearSelection();
      this.currentSubView = subView;
      this.updateLibraryHeader();
      this.applyFilterAndSort();
      if (subView === 'all' || !subView) {
        this.scrollToCurrentLibraryTrack(false);
      }
    } else if (viewName === 'folders') {
      this.renderFoldersList();
    }
    // Give the newly shown stage its starting geometry before the sidebar pushes it inward.
    if (animateZenContentEntry && viewMap[viewName]) void viewMap[viewName].offsetWidth;
    this.syncZenChromeForView();
  }

  syncZenChromeForView() {
    const body = document.body;
    const keepVisible = body.classList.contains('zen-mode') && this.currentView !== 'player';
    body.classList.toggle('zen-content-view', keepVisible);
    if (keepVisible) {
      this.cancelZenAutoHide?.();
      body.classList.add('zen-show-sidebar', 'zen-show-player-bar');
    } else if (body.classList.contains('zen-mode')) {
      body.classList.remove('zen-show-sidebar', 'zen-show-player-bar');
    }
  }

  updateLibraryHeader() {
    const titleEl = document.getElementById('library-view-title');
    if (!titleEl) return;

    if (this.currentSubView === 'all') {
      titleEl.innerHTML = '本地音乐库';
    } else if (this.currentSubView === 'favorites') {
      titleEl.innerHTML = '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;fill:none;stroke:currentColor;stroke-width:1.8;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>我的收藏';
    } else if (this.currentSubView === 'recent') {
      titleEl.innerHTML = '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;fill:none;stroke:currentColor;stroke-width:1.8;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>最近播放';
    } else if (this.currentSubView === 'added') {
      titleEl.innerHTML = '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;fill:none;stroke:currentColor;stroke-width:1.8;" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>最近添加';
    } else if (this.currentSubView.startsWith('category:')) {
      const catId = this.currentSubView.split(':')[1];
      const cat = this.categories.find(c => c.id === catId);
      const name = cat ? cat.name : '我的分类';
      titleEl.innerHTML = `<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:8px;fill:none;stroke:currentColor;stroke-width:1.8;" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>分类: ${escapeHtml(name)}`;
    }
  }

  // =========================================================================
  // 3. Playback Controls & Timeline & Volume
  // =========================================================================
  bindPlaybackControls() {
    const btnPlayPause = document.getElementById('btn-play-pause');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnShuffle = document.getElementById('btn-shuffle');
    const btnRepeat = document.getElementById('btn-repeat');

    const iconPlay = document.getElementById('icon-play');
    const iconPause = document.getElementById('icon-pause');

    if (btnPlayPause) btnPlayPause.onclick = () => this.audioEngine.togglePlayPause();
    if (btnPrev) {
      btnPrev.onclick = () => {
        const res = this.audioEngine.previous();
        if (res && res.action === 'start_of_shuffle') {
          this.showToast('已倒退至本次随机播放的第一首（已从头播放）');
        }
      };
    }
    if (btnNext) btnNext.onclick = () => this.audioEngine.next();

    if (btnShuffle) {
      btnShuffle.classList.toggle('active', this.audioEngine.isShuffle);
      btnShuffle.title = this.audioEngine.isShuffle ? '随机播放: 已开启 (向前记录历史，向后随机探索)' : '随机播放: 已关闭 (顺序播放)';

      btnShuffle.onclick = () => {
        this.audioEngine.setShuffle(!this.audioEngine.isShuffle);
        btnShuffle.classList.toggle('active', this.audioEngine.isShuffle);
        btnShuffle.title = this.audioEngine.isShuffle ? '随机播放: 已开启 (向前记录历史，向后随机探索)' : '随机播放: 已关闭 (顺序播放)';
        if (window.glasswaveSaveState) window.glasswaveSaveState();
      };
    }

    if (btnRepeat) {
      const updateRepeatUI = () => {
        const mode = this.audioEngine.repeatMode || 'all';
        if (mode === 'all') {
          btnRepeat.className = 'ctrl-btn mode-all active';
          btnRepeat.title = '循环模式: 全部循环 (列表循环)';
        } else if (mode === 'one') {
          btnRepeat.className = 'ctrl-btn mode-one active';
          btnRepeat.title = '循环模式: 单曲循环 (当前歌曲无限循环)';
        } else {
          btnRepeat.className = 'ctrl-btn mode-none';
          btnRepeat.title = '循环模式: 已关闭 (顺序播放 / 播放完停止)';
        }
      };
      this.updateRepeatUI = updateRepeatUI;
      updateRepeatUI();

      btnRepeat.onclick = () => {
        if (this.audioEngine.repeatMode === 'all') {
          this.audioEngine.repeatMode = 'one';
        } else if (this.audioEngine.repeatMode === 'one') {
          this.audioEngine.repeatMode = 'none';
        } else {
          this.audioEngine.repeatMode = 'all';
        }
        updateRepeatUI();
        if (window.glasswaveSaveState) window.glasswaveSaveState();
      };
    }

    this.audioEngine.onStateChange = (isPlaying) => {
      if (iconPlay && iconPause) {
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
      }
      const hudPlay = document.getElementById('hud-icon-play');
      const hudPause = document.getElementById('hud-icon-pause');
      if (hudPlay && hudPause) {
        hudPlay.style.display = isPlaying ? 'none' : 'block';
        hudPause.style.display = isPlaying ? 'block' : 'none';
      }
      this.highlightCurrentPlayingInList();
      if (this.pinMode === 'playing') {
        this.syncAlwaysOnTop(isPlaying);
      }
    };
  }

  bindTimeline() {
    const track = document.getElementById('timeline-track');
    const progress = document.getElementById('timeline-progress');
    const handle = document.getElementById('timeline-handle');
    const curTimeLbl = document.getElementById('current-time');
    const durLbl = document.getElementById('total-duration');

    this.audioEngine.onTimeUpdate = (current, duration) => {
      if (this.isDraggingTimeline) return;
      if (curTimeLbl) curTimeLbl.textContent = this.formatTime(current);
      if (durLbl) durLbl.textContent = this.formatTime(duration);

      const percent = duration > 0 ? (current / duration) * 100 : 0;
      if (progress) progress.style.width = `${percent}%`;
      if (handle) handle.style.left = `${percent}%`;
    };

    const getRatio = (e) => {
      const rect = track.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      return rect.width > 0 ? clickX / rect.width : 0;
    };

    const updateVisual = (ratio) => {
      const percent = Math.max(0, Math.min(100, ratio * 100));
      if (progress) progress.style.width = `${percent}%`;
      if (handle) handle.style.left = `${percent}%`;
      const duration = this.audioEngine.audio ? this.audioEngine.audio.duration : 0;
      if (curTimeLbl && duration > 0) {
        curTimeLbl.textContent = this.formatTime(ratio * duration);
      }
    };

    if (track) {
      track.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Left click only
        this.isDraggingTimeline = true;
        track.classList.add('dragging');
        const ratio = getRatio(e);
        updateVisual(ratio);
        const duration = this.audioEngine.audio ? this.audioEngine.audio.duration : 0;
        if (duration > 0) this.audioEngine.seek(ratio * duration);

        const onMouseMove = (ev) => {
          if (!this.isDraggingTimeline) return;
          const r = getRatio(ev);
          updateVisual(r);
        };

        const onMouseUp = (ev) => {
          if (!this.isDraggingTimeline) return;
          this.isDraggingTimeline = false;
          track.classList.remove('dragging');
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          const r = getRatio(ev);
          updateVisual(r);
          const dur = this.audioEngine.audio ? this.audioEngine.audio.duration : 0;
          if (dur > 0) this.audioEngine.seek(r * dur);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }
  }

  getVolumeIconSvg(pct) {
    if (pct === 0) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    } else if (pct < 50) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    } else {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
    }
  }

  updateEQSliderFill(slider) {
    const min = Number(slider.min), max = Number(slider.max);
    const ratio = Math.max(0, Math.min(1, (Number(slider.value) - min) / (max - min || 1)));
    // Match the native thumb's 14px travel inset, including both endpoints.
    slider.style.setProperty('--eq-fill', 'calc(7px + ' + (ratio * 100) + '% - ' + (ratio * 14) + 'px)');
    const position = 'calc(7px + ' + (ratio * 100) + '% - ' + (ratio * 14) + 'px)';
    slider.style.setProperty('--eq-from', Number(slider.value) < 0 ? position : '50%');
    slider.style.setProperty('--eq-to', Number(slider.value) > 0 ? position : '50%');
    slider.setAttribute('aria-valuetext', slider.value + ' dB');
  }

  updateVolumeSliderFill(vol) {
    const slider = document.getElementById('volume-slider');
    if (!slider) return;
    const isMuted = this.audioEngine && this.audioEngine.isMuted;
    const effectiveVol = isMuted ? 0 : (vol !== undefined ? vol : (this.audioEngine ? this.audioEngine.volume : (parseFloat(slider.value) || 0.8)));
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 1;
    const pct = Math.max(0, Math.min(100, Math.round(((effectiveVol - min) / (max - min)) * 100)));
    slider.style.setProperty('--val-pct', `${pct}%`);
  }

  showVolumeSliderTooltip(pct) {
    const tip = document.getElementById('volume-slider-tooltip');
    const iconEl = document.getElementById('vol-tip-icon');
    const pctEl = document.getElementById('vol-tip-pct');
    if (!tip) return;
    if (iconEl) iconEl.innerHTML = this.getVolumeIconSvg(pct);
    if (pctEl) pctEl.textContent = `${pct}%`;
    tip.classList.add('visible');
    if (this._volTipTimer) clearTimeout(this._volTipTimer);
    this._volTipTimer = setTimeout(() => {
      if (!this.isDraggingVolume) {
        tip.classList.remove('visible');
      }
    }, 700);
  }

  showVolumeHud(vol) {
    let hud = document.getElementById('volume-hud-indicator');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'volume-hud-indicator';
      hud.className = 'volume-hud-pill';
      document.body.appendChild(hud);
    }
    const pct = Math.round(vol * 100);
    const iconSvg = this.getVolumeIconSvg(pct);

    hud.innerHTML = `
      <div class="hud-icon">${iconSvg}</div>
      <div class="hud-text">${pct}%</div>
    `;
    hud.classList.add('visible');

    if (this._volumeHudTimer) clearTimeout(this._volumeHudTimer);
    this._volumeHudTimer = setTimeout(() => {
      hud.classList.remove('visible');
    }, 1000);
  }

  adjustVolumeByWheel(isUp) {
    if (!this.audioEngine) return;
    const currentVol = this.audioEngine.volume;
    const currentPct = Math.round(currentVol * 100);
    let newPct;

    const rem = currentPct % 5;
    if (rem !== 0) {
      if (isUp) {
        newPct = Math.min(100, currentPct + (5 - rem));
      } else {
        newPct = Math.max(0, currentPct - rem);
      }
    } else {
      newPct = isUp ? Math.min(100, currentPct + 5) : Math.max(0, currentPct - 5);
    }

    const newVol = Math.round(newPct) / 100;
    this.audioEngine.setVolume(newVol);

    const slider = document.getElementById('volume-slider');
    if (slider) slider.value = newVol;
    this.updateVolumeSliderFill(newVol);
    this.showVolumeSliderTooltip(newPct);
    const btnVolIcon = document.getElementById('btn-volume-icon');
    if (btnVolIcon) {
      btnVolIcon.style.opacity = newVol === 0 ? '0.4' : '1.0';
    }
    this.showVolumeHud(newVol);
  }

  bindVolume() {
    const slider = document.getElementById('volume-slider');
    const sliderWrap = document.getElementById('volume-slider-wrap');
    const btnVolIcon = document.getElementById('btn-volume-icon');

    if (slider) {
      const initialVol = this.audioEngine ? this.audioEngine.volume : 0.8;
      slider.value = initialVol;
      this.updateVolumeSliderFill(initialVol);

      slider.addEventListener('mousedown', () => {
        this.isDraggingVolume = true;
        const pct = Math.round(parseFloat(slider.value) * 100);
        this.showVolumeSliderTooltip(pct);
      });

      window.addEventListener('mouseup', () => {
        if (this.isDraggingVolume) {
          this.isDraggingVolume = false;
          const tip = document.getElementById('volume-slider-tooltip');
          if (tip) {
            setTimeout(() => {
              if (!this.isDraggingVolume) tip.classList.remove('visible');
            }, 300);
          }
        }
      });

      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.audioEngine.setVolume(val);
        const pct = Math.round(val * 100);
        this.updateVolumeSliderFill(val);
        this.showVolumeSliderTooltip(pct);
      });
    }

    // Direct wheel volume control on audio slider bar, wrapper & volume button
    const handleVolumeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.adjustVolumeByWheel(e.deltaY < 0);
    };

    if (slider) {
      slider.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }
    if (sliderWrap) {
      sliderWrap.addEventListener('wheel', handleVolumeWheel, { passive: false });
    }
    if (btnVolIcon) {
      btnVolIcon.addEventListener('wheel', handleVolumeWheel, { passive: false });
      btnVolIcon.onclick = () => {
        const muted = this.audioEngine.toggleMute();
        btnVolIcon.style.opacity = muted ? '0.4' : '1.0';
        this.updateVolumeSliderFill();
      };
    }
  }

  bindGlobalVolumeWheel() {
    window.addEventListener('wheel', (e) => {
      const target = e.target;
      const el = (target && typeof target.closest === 'function')
        ? target
        : (target && target.documentElement ? target.documentElement : document.body);

      // 1. Direct Volume Control: scrolling directly on volume slider, wrapper or icon always adjusts volume
      if (el.closest('#volume-slider, .volume-slider-wrap, #btn-volume-icon')) {
        e.preventDefault();
        this.adjustVolumeByWheel(e.deltaY < 0);
        return;
      }

      const drawer = document.getElementById('glass-queue-drawer');
      const isDrawerOpen = drawer && drawer.classList.contains('open');

      // Scheme 2A: Coordinate Envelope Physical Isolation for Right Menu
      if (isDrawerOpen) {
        const dRect = drawer.getBoundingClientRect();
        // If cursor is physically inside the right menu envelope (clientX >= left boundary)
        if (e.clientX >= dRect.left || el.closest('#glass-queue-drawer')) {
          // Inside the menu: strictly DO NOT adjust volume!
          const list = document.getElementById('queue-track-list');
          if (list && !el.closest('#queue-track-list')) {
            const step = e.deltaMode === 1 ? e.deltaY * 40 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
            list.scrollTop += step;
            e.preventDefault();
          }
          return;
        }
      }

      // Scheme 2B: Coordinate Envelope Physical Isolation for Right Settings Drawer
      const settingsDrawer = document.getElementById('view-settings');
      const isSettingsOpen = settingsDrawer && settingsDrawer.classList.contains('open');
      if (isSettingsOpen) {
        const sRect = settingsDrawer.getBoundingClientRect();
        if (e.clientX >= sRect.left || el.closest('#view-settings, .glass-settings-drawer, .settings-content')) {
          const sContent = settingsDrawer.querySelector('.settings-content');
          if (sContent && !el.closest('.settings-content')) {
            const step = e.deltaMode === 1 ? e.deltaY * 40 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
            sContent.scrollTop += step;
            e.preventDefault();
          }
          return;
        }
      }

      // Background wheel adjustment: strictly on player background, exclude inputs, lists, modal dialogs
      if (
        el.closest('#glass-queue-drawer') ||
        el.closest('#view-settings, .settings-stage, .settings-content, .glass-settings-content') ||
        el.closest('#view-folders, .folders-stage, .folder-list-container, .folder-list') ||
        el.closest('#view-library, .library-stage, #tracks-container, .track-list-scrollable, .tracks-table-wrap, .tracks-table') ||
        el.closest('.glass-sidebar, .sidebar-scroll-content') ||
        el.closest('.glass-eq-modal') ||
        el.closest('.category-icon-picker') ||
        el.closest('#category-context-menu, #glass-context-menu') ||
        el.closest('.lyrics-scroll-container, .lyrics-settings-panel') ||
        el.closest('input[type="range"]')
      ) {
        return;
      }

      // Check if on playback interface: strictly currentView is 'player'
      // When viewing settings, library, or folders (even in zen-mode), allow normal scrolling of that view!
      if (this.currentView !== 'player') {
        return;
      }

      // Adjust volume on playback background: fixed 5% step with direction-aware snap
      e.preventDefault();
      this.adjustVolumeByWheel(e.deltaY < 0);
    }, { passive: false });
  }

  bindVisualizerTabs() {
    const tabs = document.querySelectorAll('.vis-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchVisualizerMode(mode);
        this.selectVisualizerTuneMode?.(mode, false);
      });
    });

    // Dedicated Visualizer Menu Drawer Trigger
    const btnOpenVisMenu = document.getElementById('btn-open-vis-menu');
    if (btnOpenVisMenu) {
      btnOpenVisMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleVisualizerDrawer();
      });
    }

    // Visualizer Power Switch beside "视觉模式"
    const btnToggleVis = document.getElementById('btn-toggle-visualizer');
    const visTabsWrap = document.getElementById('visualizer-tabs');
    const setVisualizerActiveState = (enabled) => {
      if (btnToggleVis) {
        btnToggleVis.classList.toggle('active', !!enabled);
        const label = btnToggleVis.querySelector('.dot-label');
        if (label) label.textContent = enabled ? '开' : '关';
      }
      if (visTabsWrap) {
        visTabsWrap.style.opacity = enabled ? '1' : '0.4';
        visTabsWrap.style.pointerEvents = enabled ? 'auto' : 'none';
      }
      if (this.visualizer) {
        this.visualizer.setEnabled(!!enabled);
      }
    };

    if (btnToggleVis) {
      btnToggleVis.addEventListener('click', () => {
        const willEnable = !btnToggleVis.classList.contains('active');
        setVisualizerActiveState(willEnable);
        if (!willEnable) {
          this.toggleVisualizerDrawer(false);
        }
        try { localStorage.setItem('glasswave_visualizer_enabled', willEnable ? 'true' : 'false'); } catch (e) {}
      });
    }

    // Restore saved state
    try {
      const savedVis = localStorage.getItem('glasswave_visualizer_enabled');
      if (savedVis !== null) {
        setVisualizerActiveState(savedVis === 'true');
      }
    } catch (e) {}
  }

  // =========================================================================
  // Visualizer Fullscreen Immersive Mode (Centralized State Machine)
  // Single Source of Truth: this.uiMode = 'NORMAL' | 'VISUALIZER_FULLSCREEN'
  // =========================================================================
  setUIMode(mode) {
    if (mode !== 'NORMAL' && mode !== 'VISUALIZER_FULLSCREEN') return;
    this.uiMode = mode;

    const exitBtn = document.getElementById('fullscreen-exit-control');

    // Freeze visualizer during window mode transition to eliminate blank frames & flickering
    if (this.visualizer && this.visualizer.freezeTransition) {
      this.visualizer.freezeTransition(400);
    }
    document.body.classList.add('fullscreen-transitioning');
    setTimeout(() => {
      document.body.classList.remove('fullscreen-transitioning');
    }, 450);

    if (this.uiMode === 'VISUALIZER_FULLSCREEN') {
      document.body.classList.add('visualizer-fullscreen-active');
      if (exitBtn) {
        exitBtn.style.setProperty('display', 'flex', 'important');
      }

      // Always ensure stage is on Player view so album cover & visualizer are displayed
      if (this.currentView !== 'player') {
        this.switchView('player');
      }

      // Synchronize with Electron native fullscreen
      if (window.glasswaveAPI && window.glasswaveAPI.setFullscreen) {
        window.glasswaveAPI.setFullscreen(true);
      }
    } else {
      document.body.classList.remove('visualizer-fullscreen-active');
      if (exitBtn) {
        exitBtn.style.setProperty('display', 'none', 'important');
      }

      // Synchronize with Electron native fullscreen
      if (window.glasswaveAPI && window.glasswaveAPI.setFullscreen) {
        window.glasswaveAPI.setFullscreen(false);
      }
    }

    if (this.visualizer && this.visualizer.performSyncResize) {
      this.visualizer.performSyncResize();
    }
  }

  enterVisualizerFullscreen() {
    this.setUIMode('VISUALIZER_FULLSCREEN');
  }

  exitVisualizerFullscreen() {
    this.setUIMode('NORMAL');
  }

  toggleVisualizerFullscreen() {
    const now = Date.now();
    if (this._lastToggleFullscreenTime && (now - this._lastToggleFullscreenTime < 450)) {
      return;
    }
    this._lastToggleFullscreenTime = now;
    if (window.glasswaveAPI && window.glasswaveAPI.toggleFullscreen) {
      window.glasswaveAPI.toggleFullscreen();
    }
  }

  bindVisualizerFullscreen() {
    // Double click background / empty stage anywhere to toggle fullscreen / maximize
    const handleBackgroundDblClick = (e) => {
      if (!e || !e.target) return;
      // Exclude interactive controls, inputs, search, buttons, sliders, track table rows, etc.
      if (e.target.closest('button, input, select, textarea, .ctrl-btn, .win-btn, .glass-slider, .track-row, .track-table, .nav-item, .category-row, .folder-card, .eq-slider, .preset-chip, .glass-pill-btn, .volume-slider-wrap, #search-input, .settings-content, .drawer-header, .glass-settings-drawer, .glass-queue-drawer, .glass-confirm-dialog') || e.target.tagName === 'INPUT') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      this.toggleVisualizerFullscreen();
    };

    document.body.addEventListener('dblclick', handleBackgroundDblClick);

    const exitControl = document.getElementById('fullscreen-exit-control');
    if (exitControl) {
      const handleExit = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (window.glasswaveAPI && window.glasswaveAPI.setFullscreen) {
          window.glasswaveAPI.setFullscreen(false);
        }
      };
      exitControl.addEventListener('click', handleExit);
      exitControl.addEventListener('pointerup', handleExit);
      exitControl.onclick = handleExit;
    }

    // Esc restores fullscreen; configurable F11 is handled by GlassWaveShortcuts.
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (document.getElementById('view-settings')?.classList.contains('open')) return;
        if (document.body.classList.contains('window-fullscreen') || document.body.classList.contains('is-maximized')) {
          if (window.glasswaveAPI && window.glasswaveAPI.setFullscreen) {
            window.glasswaveAPI.setFullscreen(false);
          }
        }
      }
    });

    // Native Electron State Listeners (Synchronize OS fullscreen & maximize)
    if (window.glasswaveAPI) {
      const updateMaxBtn = () => {
        const isFilled = document.body.classList.contains('window-fullscreen') || document.body.classList.contains('is-maximized');
        const btnMax = document.getElementById('btn-maximize');
        if (btnMax) {
          btnMax.title = isFilled ? '退出全屏 / 还原窗口 (Esc)' : '全屏 / 最大化 (双击界面)';
          btnMax.innerHTML = isFilled
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 9V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4"/><rect x="3" y="7" width="12" height="12" rx="2"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"></rect></svg>`;
        }
        const btnFs = document.getElementById('btn-fullscreen');
        if (btnFs) {
          btnFs.title = isFilled ? '退出全屏 (Esc)' : '全屏沉浸模式 (双击界面 / F11)';
        }
      };

      if (window.glasswaveAPI.onFullscreenState) {
        window.glasswaveAPI.onFullscreenState((isFs) => {
          document.body.classList.toggle('window-fullscreen', isFs);
          updateMaxBtn();
          if (this.visualizer && this.visualizer.performSyncResize) {
            setTimeout(() => this.visualizer.performSyncResize(), 60);
          }
          document.body.classList.remove('fullscreen-transitioning');
        });
      }

      if (window.glasswaveAPI.onMaximizedState) {
        window.glasswaveAPI.onMaximizedState((isMax) => {
          document.body.classList.toggle('is-maximized', isMax);
          updateMaxBtn();
        });
      }
    }
  }

  // =========================================================================
  // 4. Instant Fuzzy Search (Requirement 2)
  // =========================================================================
  bindSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBox = document.querySelector('.glass-search-box');
    const btnClear = document.getElementById('btn-search-clear');
    const badge = document.getElementById('search-results-count');
    const btnSearchMore = document.getElementById('btn-search-more');
    const popover = document.getElementById('search-more-popover');

    if (!searchInput) return;

    if (searchBox) {
      searchBox.addEventListener('click', (e) => {
        if (e.target !== btnClear) {
          searchInput.focus();
        }
      });
    }

    const performSearch = () => {
      const query = searchInput.value.trim().toLowerCase();
      this.searchQuery = query;

      if (btnClear) {
        btnClear.style.display = query ? 'block' : 'none';
      }

      // If user is searching on Player stage, automatically open Library stage to view results
      if (query) {
        if (this.currentSubView !== 'all') {
          if (!this._prevSubViewBeforeSearch) {
            this._prevSubViewBeforeSearch = this.currentSubView;
          }
          this.currentSubView = 'all';
          this.renderSidebarActiveState();
        }
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.view === 'player') {
          this.switchView('library', 'all');
        }
      } else if (this._prevSubViewBeforeSearch) {
        this.currentSubView = this._prevSubViewBeforeSearch;
        this._prevSubViewBeforeSearch = null;
        this.renderSidebarActiveState();
      }

      this.applyFilterAndSort();

      if (badge) {
        if (query) {
          badge.style.display = 'inline-flex';
          badge.textContent = `找到 ${this.filteredTracks.length} 首`;
        } else {
          badge.style.display = 'none';
        }
      }
    };

    searchInput.addEventListener('input', performSearch);

    if (btnClear) {
      btnClear.onclick = (e) => {
        e.stopPropagation();
        searchInput.value = '';
        performSearch();
        searchInput.focus();
      };
    }

    // Search Cluster Three-Dot (•••) Popover Menu (Tag Classification & Quick Operations)
    if (btnSearchMore && popover) {
      btnSearchMore.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = popover.classList.contains('open') || popover.style.display === 'block';
        if (isOpen) {
          popover.classList.remove('open');
          popover.style.display = 'none';
          btnSearchMore.classList.remove('active');
        } else {
          this.renderSearchMoreTags();
          popover.classList.add('open');
          popover.style.display = 'block';
          btnSearchMore.classList.add('active');
        }
      });

      // Close on outside click
      window.addEventListener('click', (e) => {
        if (!popover.contains(e.target) && !btnSearchMore.contains(e.target)) {
          popover.classList.remove('open');
          popover.style.display = 'none';
          btnSearchMore.classList.remove('active');
        }
      });

      // Close on ESC key
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (popover.classList.contains('open') || popover.style.display === 'block')) {
          popover.classList.remove('open');
          popover.style.display = 'none';
          btnSearchMore.classList.remove('active');
        }
      });

      // Popover Action: Reset all tag filters
      const btnResetTags = document.getElementById('pop-btn-reset-tags');
      if (btnResetTags) {
        btnResetTags.onclick = (e) => {
          e.stopPropagation();
          this.activeFilterTags.clear();
          this.renderTagPillBar();
          this.renderSearchMoreTags();
          performSearch();
          this.showToast('已显示全部歌曲');
        };
      }

      // Popover Action: Inline Add Custom Tag
      const inputNewTag = document.getElementById('pop-input-new-tag');
      const btnAddTag = document.getElementById('pop-btn-add-tag');
      if (btnAddTag && inputNewTag) {
        const doAdd = () => {
          const val = inputNewTag.value.trim();
          if (val) {
            this.addNewCustomTag(val);
            inputNewTag.value = '';
          }
        };
        btnAddTag.onclick = (e) => {
          e.stopPropagation();
          doAdd();
        };
        inputNewTag.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.stopPropagation();
            doAdd();
          }
        };
      }

      // Popover Action: Scan Monitored Directories
      const popScan = document.getElementById('pop-scan-library');
      if (popScan) {
        popScan.onclick = () => {
          popover.classList.remove('open');
          btnSearchMore.classList.remove('active');
          const btnScan = document.getElementById('btn-scan-library');
          if (btnScan) btnScan.click();
        };
      }

      // Popover Action: Add Music Folder
      const popAddFolder = document.getElementById('pop-add-folder');
      if (popAddFolder) {
        popAddFolder.onclick = () => {
          popover.classList.remove('open');
          btnSearchMore.classList.remove('active');
          const btnAdd = document.getElementById('btn-add-folder');
          if (btnAdd) btnAdd.click();
        };
      }

      // Popover Action: Clear Search & Tag Filters
      const popClearSearch = document.getElementById('pop-clear-search');
      if (popClearSearch) {
        popClearSearch.onclick = () => {
          popover.classList.remove('open');
          btnSearchMore.classList.remove('active');
          searchInput.value = '';
          this.activeFilterTags.clear();
          this.renderTagPillBar();
          this.renderSearchMoreTags();
          performSearch();
        };
      }

      // Popover Action: Restore Hidden/Removed Tracks
      const popRestore = document.getElementById('pop-restore-removed');
      if (popRestore) {
        popRestore.onclick = async () => {
          popover.classList.remove('open');
          btnSearchMore.classList.remove('active');
          if (window.glasswaveAPI && window.glasswaveAPI.unhideAllTracks) {
            await window.glasswaveAPI.unhideAllTracks();
            await this.loadLibrary();
          }
        };
      }

      // Popover Action: Quick Switch Theme (Requirement 4)
      const popSwitchTheme = document.getElementById('pop-switch-theme');
      if (popSwitchTheme) {
        popSwitchTheme.onclick = () => {
          popover.classList.remove('open');
          btnSearchMore.classList.remove('active');
          this.switchView('settings');
          setTimeout(() => {
            const themeGrid = document.getElementById('theme-preset-grid');
            if (themeGrid) {
              themeGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 60);
        };
      }
    }
  }

  // Auto-Hide Overlay Scrollbars Active Detection
  bindOverlayScrollbars() {
    const scrollTimers = new WeakMap();
    window.addEventListener('scroll', (e) => {
      const target = e.target;
      if (target && target.nodeType === 1 && target.id !== 'track-list-scroll-view') {
        if (!target.classList.contains('is-scrolling')) {
          target.classList.add('is-scrolling');
        }
        const prevTimer = scrollTimers.get(target);
        if (prevTimer) clearTimeout(prevTimer);
        const timer = setTimeout(() => {
          target.classList.remove('is-scrolling');
          scrollTimers.delete(target);
        }, 800);
        scrollTimers.set(target, timer);
      }
    }, { capture: true, passive: true });
  }

  // Reserved Extension Interface for RAG / Semantic AI Search
  async performSemanticSearch(naturalLanguagePrompt) {
    console.log('🤖 Semantic Search Interface called with:', naturalLanguagePrompt);
    // Extensible hook for AI embeddings / vector search
    this.searchQuery = naturalLanguagePrompt;
    this.applyFilterAndSort();
  }

  // =========================================================================
  // 5. Drag & Drop Import System with Deduplication (Requirement 3)
  // =========================================================================
  bindDragAndDropImport() {
    const overlay = document.getElementById('drag-drop-overlay');
    const modal = document.getElementById('glass-drop-modal');
    const btnCloseModal = document.getElementById('btn-close-drop-modal');
    const btnCancel = document.getElementById('btn-cancel-drop');
    const btnConfirm = document.getElementById('btn-confirm-drop');
    const summaryEl = document.getElementById('drop-modal-summary');
    const catSelect = document.getElementById('drop-target-category');
    const rememberCheckbox = document.getElementById('drop-remember-pref');

    let dragCounter = 0;
    let internalDragActive = false;
    const hideImportOverlay = () => {
      dragCounter = 0;
      if (overlay) overlay.style.display = 'none';
    };
    const isExternalFileDrag = (e) => {
      if (internalDragActive || !e.dataTransfer) return false;
      const types = Array.from(e.dataTransfer.types || []);
      if (types.includes('application/x-glasswave-tracks') || types.includes('text/queue-index')) return false;
      // During dragenter/dragover, files are protected and usually empty.
      return types.includes('Files') || e.dataTransfer.files?.length > 0;
    };

    // A drag originating in this renderer is never a file import, even if
    // Chromium supplies a Files payload for an image or link.
    window.addEventListener('dragstart', () => {
      internalDragActive = true;
      hideImportOverlay();
    }, true);
    window.addEventListener('dragend', () => {
      internalDragActive = false;
      hideImportOverlay();
    }, true);

    window.addEventListener('dragenter', (e) => {
      if (!isExternalFileDrag(e)) return;
      e.preventDefault();
      dragCounter++;
      if (overlay) overlay.style.display = 'flex';
    });

    window.addEventListener('dragleave', (e) => {
      if (internalDragActive || dragCounter === 0) return;
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (overlay) overlay.style.display = 'none';
      }
    });

    window.addEventListener('dragover', (e) => {
      if (!isExternalFileDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      const externalFileDrag = isExternalFileDrag(e);
      hideImportOverlay();
      if (!externalFileDrag) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const filePaths = files.map(f => {
        if (window.glasswaveAPI && typeof window.glasswaveAPI.getPathForFile === 'function') {
          try {
            const p = window.glasswaveAPI.getPathForFile(f);
            if (p) return p;
          } catch (err) {}
        }
        return f.path;
      }).filter(Boolean);
      if (filePaths.length === 0) return;

      if (!window.glasswaveAPI || !window.glasswaveAPI.scanDroppedItems) return;

      // Scan dropped items recursively with duplicate detection
      const scanResult = await window.glasswaveAPI.scanDroppedItems(filePaths);
      if (!scanResult || !scanResult.tracks || scanResult.tracks.length === 0) {
        return;
      }

      // Check whether user enabled automatic library import in settings
      let autoAdd = false;
      const settingAuto = document.getElementById('setting-auto-add-dropped');
      if (settingAuto) {
        autoAdd = settingAuto.checked;
      } else if (window.glasswaveAPI && window.glasswaveAPI.getConfig) {
        try {
          const cfg = await window.glasswaveAPI.getConfig();
          autoAdd = !!(cfg && cfg.autoAddDroppedToLibrary);
        } catch (e) {}
      }

      // 1. If auto-import is enabled, import new tracks into database; otherwise do not persist to library
      if (autoAdd) {
        if (scanResult.newTracks && scanResult.newTracks.length > 0) {
          const updated = await window.glasswaveAPI.importTracks(scanResult.newTracks);
          this.setTracks(updated);
        }
      }

      // 2. Immediate playback of the dropped music (stops previous song, plays immediately even if not auto-imported):
      const firstTrack = scanResult.tracks[0];
      if (firstTrack) {
        // If multiple songs were dropped, append remaining songs to playback queue
        for (let i = 1; i < scanResult.tracks.length; i++) {
          this.audioEngine.addToQueue(scanResult.tracks[i]);
        }

        // Immediately interrupt previous song and play the dropped track
        this.audioEngine.playNow(firstTrack);

        // Switch to player view so the album art & visualizer are immediately active
        this.switchView('player');

        if (autoAdd) {
          this.showToast(`已自动入库并立即播放：${firstTrack.title || firstTrack.fileName || '音乐'}`);
        } else {
          this.showToast(`已开始播放：${firstTrack.title || firstTrack.fileName || '音乐'}（即时临时播放）`);
        }
      }

      // Close modal if open
      if (modal) modal.style.display = 'none';
      this.pendingDroppedTracks = [];
    });

    const hideDropModal = () => {
      if (modal) modal.style.display = 'none';
      this.pendingDroppedTracks = [];
    };

    if (btnCloseModal) btnCloseModal.onclick = hideDropModal;
    if (btnCancel) btnCancel.onclick = hideDropModal;

    if (btnConfirm) {
      btnConfirm.onclick = async () => {
        const selectedAction = document.querySelector('input[name="drop-action"]:checked')?.value || 'queue-play';
        const tracks = this.pendingDroppedTracks;

        if (rememberCheckbox && rememberCheckbox.checked && window.glasswaveAPI) {
          await window.glasswaveAPI.saveConfig({ autoAddDroppedToLibrary: true });
          const settingAuto = document.getElementById('setting-auto-add-dropped');
          if (settingAuto) settingAuto.checked = true;
        }

        if (selectedAction === 'queue-play') {
          tracks.forEach(t => this.audioEngine.addToQueue(t));
          if (tracks[0]) this.audioEngine.playNow(tracks[0]);
        } else if (selectedAction === 'library') {
          const updated = await window.glasswaveAPI.importTracks(tracks);
          this.setTracks(updated);
        } else if (selectedAction === 'category') {
          const targetCatId = catSelect?.value;
          const updated = await window.glasswaveAPI.importTracks(tracks);
          if (targetCatId) {
            const trackPaths = tracks.map(t => t.path);
            await window.glasswaveAPI.addToCategory(targetCatId, trackPaths);
            await this.loadCategories();
          }
          this.setTracks(updated);
        } else if (selectedAction === 'temp-queue') {
          tracks.forEach(t => this.audioEngine.addToQueue(t));
        }

        hideDropModal();
      };
    }
  }

  // =========================================================================
  // 6. User Custom Categories System ("我的分类") (Requirement 4)
  // =========================================================================
  async bindCategoriesSystem() {
    await this.loadCategories();

    // Toggle collapse/expand on "我的分类" header
    const toggleBtn = document.getElementById('btn-toggle-categories');
    const catList = document.getElementById('sidebar-category-list');
    if (toggleBtn && catList) {
      toggleBtn.onclick = () => {
        const isCollapsed = catList.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed', isCollapsed);
      };
    }

    // Quick add category button '+'
    const btnAddQuick = document.getElementById('btn-create-category-quick');
    const modalCat = document.getElementById('glass-category-modal');
    const inputCatName = document.getElementById('cat-name-input');
    const btnCloseCat = document.getElementById('btn-close-cat-modal');
    const btnCancelCat = document.getElementById('btn-cancel-cat');
    const btnSaveCat = document.getElementById('btn-save-cat');
    const titleCatModal = document.getElementById('cat-modal-title');
    const parentSelect = document.getElementById('cat-parent-group');

    const openCategoryModal = (catId = null, existingName = '', kind = 'category', groupId = null) => {
      this.editingCategoryId = catId;
      this.editingCategoryKind = kind;
      if (titleCatModal) titleCatModal.textContent = `${catId ? '重命名' : '新建'}${kind === 'group' ? '一级分类' : '二级分类'}`;
      if (parentSelect) {
        parentSelect.style.display = kind === 'group' ? 'none' : 'block';
        parentSelect.innerHTML = (this.categoryGroups || []).map(g => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.name)}</option>`).join('');
        if (groupId) parentSelect.value = groupId;
        if (catId && kind === 'category') parentSelect.disabled = true;
        else parentSelect.disabled = false;
      }
      if (inputCatName) {
        inputCatName.value = existingName || '';
        setTimeout(() => inputCatName.focus(), 50);
      }
      if (modalCat) modalCat.style.display = 'flex';
    };

    const closeCategoryModal = () => {
      if (modalCat) modalCat.style.display = 'none';
      this.editingCategoryId = null;
      if (inputCatName) inputCatName.value = '';
    };

    if (btnAddQuick) btnAddQuick.onclick = () => openCategoryModal(null, '', 'group');
    if (btnCloseCat) btnCloseCat.onclick = closeCategoryModal;
    if (btnCancelCat) btnCancelCat.onclick = closeCategoryModal;

    if (btnSaveCat && inputCatName) {
      btnSaveCat.onclick = async () => {
        const name = inputCatName.value.trim();
        if (!name) return;

        if (this.editingCategoryKind === 'group') {
          if (this.editingCategoryId) await window.glasswaveAPI.renameCategoryGroup(this.editingCategoryId, name);
          else await window.glasswaveAPI.addCategoryGroup(name);
        } else if (this.editingCategoryId) {
          await window.glasswaveAPI.renameCategory(this.editingCategoryId, name);
        } else {
          await window.glasswaveAPI.addCategory(name, parentSelect?.value);
        }
        await this.loadCategories();
        closeCategoryModal();
      };

      inputCatName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') btnSaveCat.click();
        else if (e.key === 'Escape') closeCategoryModal();
      });
    }

    this.openCategoryModal = openCategoryModal;
  }

  async loadCategories() {
    if (!window.glasswaveAPI || !window.glasswaveAPI.getCategories) return;
    [this.categories, this.categoryGroups] = await Promise.all([
      window.glasswaveAPI.getCategories(), window.glasswaveAPI.getCategoryGroups()
    ]);
    this.renderSidebarCategories();
  }

  renderSidebarCategories() {
    const container = document.getElementById('sidebar-category-list');
    if (!container) return;

    container.innerHTML = '';
    if (!this.categoryGroups?.length) {
      container.innerHTML = '<div class="category-empty">暂无一级分类，点击 + 创建</div>';
      return;
    }

    this.categoryGroups.forEach(group => {
      const wrapper = document.createElement('div');
      wrapper.className = 'category-group';
      const heading = document.createElement('div');
      heading.className = 'category-group-heading';
      heading.innerHTML = `<span class="category-group-name">${escapeHtml(group.name)}</span><button class="btn-add-cat-icon category-add-child" title="新建二级分类">+</button>`;
      const children = document.createElement('div');
      children.className = 'category-group-children';
      heading.querySelector('.category-group-name').onclick = () => children.classList.toggle('collapsed');
      heading.querySelector('.category-add-child').onclick = () => this.openCategoryModal(null, '', 'category', group.id);
      heading.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); this.openCategoryContextMenu(group, e.clientX, e.clientY, true); };
      wrapper.appendChild(heading);
      wrapper.appendChild(children);
      container.appendChild(wrapper);
      this.categories.filter(cat => cat.groupId === group.id).forEach(cat => {
      const item = document.createElement('div');
      item.className = `category-item ${this.currentSubView === `category:${cat.id}` ? 'active' : ''}`;
      item.dataset.catId = cat.id;

      const count = Array.isArray(cat.trackPaths) ? cat.trackPaths.length : 0;
      const iconIdx = (typeof cat.iconIndex === 'number' && cat.iconIndex >= 0) ? (cat.iconIndex % CATEGORY_ICONS.length) : 0;
      const curIcon = CATEGORY_ICONS[iconIdx];

      item.innerHTML = `
        <div class="cat-item-left">
          <span class="cat-music-icon" data-cat-id="${cat.id}" title="点击切换专属音乐图标 (当前: ${curIcon.name}, 共22款)">
            ${curIcon.svg}
          </span>
          <span class="cat-item-name">${escapeHtml(cat.name)}</span>
        </div>
        <div class="cat-end-action">
          <span class="cat-count-badge">${count}</span>
          <button class="cat-hover-play" data-cat-id="${cat.id}" title="立即播放【${escapeHtml(cat.name)}】全部歌曲 (${count}首)">
            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 19 12 7 20 7 4"></polygon></svg>
          </button>
        </div>
      `;

      // Click icon to open floating category icon picker popover (Requirement 5)
      const iconBtn = item.querySelector('.cat-music-icon');
      if (iconBtn) {
        iconBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openCategoryIconPicker(cat, iconBtn);
        });
      }

      // Hover play button click
      const playBtn = item.querySelector('.cat-hover-play');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.playCategory(cat.id);
        });
      }

      item.onclick = () => {
        this.switchView('library', `category:${cat.id}`);
        document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
        item.classList.add('active');
      };

      // Support drag & drop songs onto this category in sidebar
      item.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        item.style.background = 'rgba(138, 196, 255, 0.25)';
      };

      item.ondragleave = () => {
        item.style.background = '';
      };

      item.ondrop = async (e) => {
        e.preventDefault();
        item.style.background = '';
        try {
          const data = e.dataTransfer.getData('text/plain');
          if (data) {
            const paths = JSON.parse(data);
            if (Array.isArray(paths) && paths.length > 0) {
              const updated = await window.glasswaveAPI.addToCategory(cat.id, paths);
              await this.loadCategories();
              this.setTracks(updated);
            }
          }
        } catch (err) {
          console.warn('Drop to category parse error:', err);
        }
      };

      // Right-click category for comprehensive actions
      item.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openCategoryContextMenu(cat, e.clientX, e.clientY);
      };

      children.appendChild(item);
      });
    });
  }

  openCategoryIconPicker(cat, anchorEl) {
    const picker = document.getElementById('category-icon-picker');
    const grid = document.getElementById('icon-picker-grid');
    if (!picker || !grid) return;

    // Toggle close if clicking the same category's icon
    if (picker.style.display !== 'none' && this.activeCategoryIconPickerCat && this.activeCategoryIconPickerCat.id === cat.id) {
      this.closeCategoryIconPicker();
      return;
    }

    this.activeCategoryIconPickerCat = cat;
    grid.innerHTML = '';

    const curIdx = (typeof cat.iconIndex === 'number' && cat.iconIndex >= 0) ? (cat.iconIndex % CATEGORY_ICONS.length) : 0;

    CATEGORY_ICONS.forEach((icon, idx) => {
      const cell = document.createElement('div');
      cell.className = `icon-picker-cell ${idx === curIdx ? 'active' : ''}`;
      cell.dataset.index = idx;
      cell.title = icon.name;
      cell.innerHTML = icon.svg;

      cell.addEventListener('click', async (e) => {
        e.stopPropagation();
        cat.iconIndex = idx;
        if (window.glasswaveAPI && window.glasswaveAPI.updateCategoryIcon) {
          await window.glasswaveAPI.updateCategoryIcon(cat.id, idx);
        }
        this.renderSidebarCategories();
        this.showToast(`已更换分类【${cat.name}】图标为：${icon.name}`);
        this.closeCategoryIconPicker();
      });

      grid.appendChild(cell);
    });

    picker.style.display = 'block';

    // Position relative to anchorEl with boundary checks and auto-flip
    const rect = anchorEl.getBoundingClientRect();
    const pickerW = picker.offsetWidth || 240;
    const pickerH = picker.offsetHeight || 190;

    let left = rect.right + 10;
    if (left + pickerW > window.innerWidth - 12) {
      left = rect.left - pickerW - 10;
    }
    if (left < 10) left = 10;

    let top = rect.top - 10;
    // Auto-flip if space below is insufficient
    if (top + pickerH > window.innerHeight - 15) {
      top = Math.max(15, window.innerHeight - pickerH - 15);
    }
    if (top < 15) top = 15;

    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
  }

  closeCategoryIconPicker() {
    const picker = document.getElementById('category-icon-picker');
    if (picker) picker.style.display = 'none';
    this.activeCategoryIconPickerCat = null;
  }

  bindCategoryIconPickerGlobal() {
    const picker = document.getElementById('category-icon-picker');
    if (!picker) return;

    const closeBtn = document.getElementById('btn-close-icon-picker');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeCategoryIconPicker();
      });
    }

    document.addEventListener('pointerdown', (e) => {
      if (picker.style.display !== 'none') {
        if (!picker.contains(e.target) && !e.target.closest('.cat-music-icon')) {
          this.closeCategoryIconPicker();
        }
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && picker.style.display !== 'none') {
        this.closeCategoryIconPicker();
      }
    });
  }

  showToast(msg, duration = 2200) {
    let toast = document.getElementById('global-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'global-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 96px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: rgba(18, 22, 34, 0.92);
        color: #ffffff;
        padding: 9px 20px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.3px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        opacity: 0;
        pointer-events: none;
        z-index: 99999;
        transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(16px)';
    }, duration);
  }


  // =========================================================================
  // 7. Current Playback Queue Drawer (Requirement 5)
  // =========================================================================
  toggleQueueDrawer(forceOpen) {
    const drawer = document.getElementById('glass-queue-drawer');
    const btnToggle = document.getElementById('btn-queue-toggle');
    if (!drawer) return;

    const isOpen = drawer.classList.contains('open');
    const target = forceOpen !== undefined ? forceOpen : !isOpen;
    drawer.classList.toggle('open', target);
    if (btnToggle) btnToggle.classList.toggle('active', target);

    if (target) {
      this.renderQueue(true);
      this.scrollToCurrentQueueTrack(false);
    }

    if (document.body.classList.contains('zen-mode')) {
      const eqModal = document.getElementById('glass-eq-modal');
      const isEqOpen = eqModal && !eqModal.classList.contains('hidden') && eqModal.style.display !== 'none';
      document.body.classList.toggle('zen-interactive-open', target || !!isEqOpen);
      document.body.classList.toggle('zen-show-player-bar', target);
    }
  }

  scrollToCurrentQueueTrack(smooth = false) {
    const list = document.getElementById('queue-track-list');
    if (!list) return;
    const queue = this.audioEngine?.playbackQueue || [];
    if (queue.length === 0) return;

    let curIdx = this.audioEngine?.queueIndex;
    const curTrack = this.audioEngine?.currentTrack;
    if ((curIdx === undefined || curIdx < 0 || curIdx >= queue.length) && curTrack) {
      curIdx = queue.findIndex(t => (curTrack.id && t.id === curTrack.id) || (curTrack.path && t.path === curTrack.path));
    }
    if (curIdx === undefined || curIdx < 0 || curIdx >= queue.length) return;

    const listH = list.clientHeight || 500;
    const targetScroll = Math.max(0, Math.round(curIdx * this.QUEUE_ROW_STRIDE - (listH - this.QUEUE_ROW_STRIDE) / 2));

    const applyScroll = () => {
      if (smooth) {
        list.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        list.scrollTop = targetScroll;
      }
      this.updateVirtualQueue(true);
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 40);
  }

  scrollToCurrentLibraryTrack(smooth = false) {
    const scrollView = document.getElementById('track-list-scroll-view');
    if (!scrollView) return;
    const curTrack = this.audioEngine?.currentTrack;
    if (!curTrack || !this.filteredTracks || this.filteredTracks.length === 0) return;

    const idx = this.filteredTracks.findIndex(t => (curTrack.id && t.id === curTrack.id) || (curTrack.path && t.path === curTrack.path));
    if (idx === -1) return;

    const clientH = scrollView.clientHeight || 600;
    const targetScroll = Math.max(0, Math.round(idx * this.ROW_STRIDE - (clientH - this.ROW_STRIDE) / 2));

    const applyScroll = () => {
      if (smooth) {
        scrollView.scrollTo({ top: targetScroll, behavior: 'smooth' });
      } else {
        scrollView.scrollTop = targetScroll;
      }
      this.updateVirtualScroll(true);
      this.updateOverlayScrollbar();
    };

    applyScroll();
    requestAnimationFrame(applyScroll);
    setTimeout(applyScroll, 40);
  }

  bindQueueDrawer() {
    const btnToggle = document.getElementById('btn-queue-toggle');
    const drawer = document.getElementById('glass-queue-drawer');
    const btnClose = document.getElementById('btn-close-queue');
    const btnClear = document.getElementById('btn-clear-queue');

    if (btnToggle && drawer) {
      btnToggle.onclick = () => {
        this.toggleQueueDrawer();
      };
    }

    if (btnClose && drawer) {
      btnClose.onclick = () => {
        this.toggleQueueDrawer(false);
      };
    }

    if (btnClear) {
      btnClear.onclick = () => {
        this.audioEngine.clearQueue();
        this.renderQueue();
      };
    }

    const queueList = document.getElementById('queue-track-list');
    if (queueList && !queueList._hasBoundVirtualScroll) {
      queueList._hasBoundVirtualScroll = true;
      let qScrollRaf = null;
      queueList.addEventListener('scroll', () => {
        if (!qScrollRaf) {
          qScrollRaf = requestAnimationFrame(() => {
            this.updateVirtualQueue();
            qScrollRaf = null;
          });
        }
      }, { passive: true });
    }

    // Panoramic Main Stage Click to Close Right Drawers (Queue & Settings) & Dismiss Zen Sidebar
    document.addEventListener('pointerdown', (e) => {
      // 1. Queue Drawer outside click
      if (drawer && drawer.classList.contains('open')) {
        if (!drawer.contains(e.target) && !e.target.closest('#btn-queue-toggle') &&
            !e.target.closest('#glass-context-menu, #category-context-menu, .category-icon-picker, #glass-confirm-modal, #glass-eq-modal, #btn-toggle-eq, #view-settings, .nav-item[data-view="settings"]')) {
          this.toggleQueueDrawer(false);
        }
      }

      // Settings drawers remain open until their switch / close button is used.
      // 2.2 EQ Preset context menu dismiss
      const eqCtxMenu = document.getElementById('eq-preset-context-menu');
      if (eqCtxMenu && eqCtxMenu.style.display !== 'none' && !eqCtxMenu.contains(e.target)) {
        eqCtxMenu.style.display = 'none';
      }

      // 3. Zen Mode sidebar dismiss when clicking on main stage
      if (document.body.classList.contains('zen-mode') && this.currentView === 'player' && document.body.classList.contains('zen-show-sidebar')) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.category-icon-picker, #category-context-menu')) {
          document.body.classList.remove('zen-show-sidebar');
        }
      }
    }, true);
  }

  createQueuePoolRow() {
    const row = document.createElement('div');
    row.className = 'queue-row';
    row.draggable = true;

    const indexEl = document.createElement('div');
    indexEl.className = 'queue-row-index';
    row.appendChild(indexEl);

    const infoEl = document.createElement('div');
    infoEl.className = 'queue-row-info';
    const titleEl = document.createElement('div');
    titleEl.className = 'queue-row-title';
    const artistEl = document.createElement('div');
    artistEl.className = 'queue-row-artist';
    infoEl.appendChild(titleEl);
    infoEl.appendChild(artistEl);
    row.appendChild(infoEl);

    const durationEl = document.createElement('div');
    durationEl.className = 'queue-row-duration';
    row.appendChild(durationEl);

    const delBtn = document.createElement('button');
    delBtn.className = 'queue-row-del';
    delBtn.title = '从队列移除';
    delBtn.innerHTML = '&times;';
    row.appendChild(delBtn);

    row._indexEl = indexEl;
    row._titleEl = titleEl;
    row._artistEl = artistEl;
    row._durationEl = durationEl;
    row._delBtn = delBtn;

    row.onclick = (e) => {
      if (e.target.closest('.queue-row-del')) return;
      const idx = parseInt(row.dataset.queueIndex, 10);
      const q = this.audioEngine.playbackQueue || [];
      if (!isNaN(idx) && q[idx]) {
        this.audioEngine.queueIndex = idx;
        this.audioEngine.loadTrack(q[idx], true);
        this.updateVirtualQueue(true);
      }
    };

    delBtn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(row.dataset.queueIndex, 10);
      if (!isNaN(idx)) {
        this.audioEngine.removeFromQueue(idx);
        this.renderQueue(true);
      }
    };

    row.ondragstart = (e) => {
      const idx = parseInt(row.dataset.queueIndex, 10);
      e.dataTransfer.setData('text/queue-index', idx);
    };

    row.ondragover = (e) => {
      e.preventDefault();
      row.style.borderColor = 'var(--accent-primary)';
    };

    row.ondragleave = () => {
      row.style.borderColor = 'transparent';
    };

    row.ondrop = (e) => {
      e.preventDefault();
      row.style.borderColor = 'transparent';
      const toIdx = parseInt(row.dataset.queueIndex, 10);
      const fromIdx = parseInt(e.dataTransfer.getData('text/queue-index'), 10);
      if (!isNaN(fromIdx) && !isNaN(toIdx) && fromIdx !== toIdx) {
        this.audioEngine.reorderQueue(fromIdx, toIdx);
        this.renderQueue(true);
      }
    };

    return row;
  }

  updateQueuePoolRow(row, track, idx, isCur) {
    row.dataset.queueIndex = idx;
    row.classList.toggle('playing', !!isCur);
    row._indexEl.textContent = idx + 1;

    const title = track.title || '未知曲目';
    if (row._titleEl.textContent !== title) {
      row._titleEl.textContent = title;
      row._titleEl.title = title;
    }

    const artist = track.artist || '未知艺术家';
    if (row._artistEl.textContent !== artist) {
      row._artistEl.textContent = artist;
      row._artistEl.title = artist;
    }

    const durStr = this.formatTime(track.duration);
    if (row._durationEl.textContent !== durStr) {
      row._durationEl.textContent = durStr;
    }

    row.style.transform = `translate3d(0, ${idx * this.QUEUE_ROW_STRIDE}px, 0)`;
    row.style.display = 'grid';
  }

  updateVirtualQueue(force = false) {
    const list = document.getElementById('queue-track-list');
    let poolContainer = document.getElementById('queue-pool-container');
    if (!list) return;

    if (!poolContainer) {
      poolContainer = document.createElement('div');
      poolContainer.id = 'queue-pool-container';
      poolContainer.className = 'queue-pool-container';
      list.appendChild(poolContainer);
    }

    const queue = this.audioEngine.playbackQueue || [];
    const total = queue.length;
    if (total === 0) return;

    const scrollTop = list.scrollTop;
    const clientHeight = list.clientHeight || 500;
    const buffer = 4;
    const startIndex = Math.max(0, Math.floor(scrollTop / this.QUEUE_ROW_STRIDE) - buffer);
    const endIndex = Math.min(total, Math.ceil((scrollTop + clientHeight) / this.QUEUE_ROW_STRIDE) + buffer);

    const curIdx = this.audioEngine.queueIndex;

    if (!force && startIndex === this.queueVisibleStart && endIndex === this.queueVisibleEnd && this.lastCurQueueIdx === curIdx) {
      return;
    }

    this.queueVisibleStart = startIndex;
    this.queueVisibleEnd = endIndex;
    this.lastCurQueueIdx = curIdx;

    const neededCount = endIndex - startIndex;
    while (this.queueRowPool.length < neededCount) {
      const row = this.createQueuePoolRow();
      this.queueRowPool.push(row);
      poolContainer.appendChild(row);
    }

    for (let i = 0; i < neededCount; i++) {
      const idx = startIndex + i;
      const track = queue[idx];
      const row = this.queueRowPool[i];
      if (!row) continue;
      if (!track) {
        row.style.display = 'none';
        continue;
      }
      this.updateQueuePoolRow(row, track, idx, idx === curIdx);
    }

    for (let i = neededCount; i < this.queueRowPool.length; i++) {
      if (this.queueRowPool[i]) {
        this.queueRowPool[i].style.display = 'none';
      }
    }
  }

  renderQueue(force = false) {
    const list = document.getElementById('queue-track-list');
    const badge = document.getElementById('queue-count-badge');
    const drawerCount = document.getElementById('queue-drawer-count');
    const drawer = document.getElementById('glass-queue-drawer');
    const queue = this.audioEngine.playbackQueue || [];

    const btnToggle = document.getElementById('btn-queue-toggle');
    if (badge) {
      badge.textContent = queue.length;
      badge.style.display = queue.length > 0 ? 'inline-flex' : 'none';
    }
    if (btnToggle) {
      btnToggle.title = queue.length > 0 ? `当前播放队列 (${queue.length} 首)` : '当前播放队列';
    }
    if (drawerCount) drawerCount.textContent = `· ${queue.length} 首`;
    if (!list) return;

    // Performance: do not render pool when drawer is closed unless forced
    if (!force && (!drawer || !drawer.classList.contains('open'))) {
      this.queueNeedsRender = true;
      return;
    }
    this.queueNeedsRender = false;

    let spacer = document.getElementById('queue-scroll-spacer');
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.id = 'queue-scroll-spacer';
      spacer.className = 'queue-scroll-spacer';
      list.prepend(spacer);
    }

    let emptyEl = list.querySelector('.empty-hint');
    if (queue.length === 0) {
      spacer.style.height = '0px';
      this.queueRowPool.forEach(r => r.style.display = 'none');
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty-hint';
        emptyEl.textContent = '当前播放队列为空';
        list.appendChild(emptyEl);
      }
      emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    spacer.style.height = `${queue.length * this.QUEUE_ROW_STRIDE}px`;
    this.updateVirtualQueue(true);
  }

  // =========================================================================
  // 8. Sorting, Filter Bar & Multi-Tag Combination (Requirement 6 & 7)
  // =========================================================================
  bindSortAndFilter() {
    const btnDropdown = document.getElementById('btn-sort-dropdown');
    const dropdownMenu = document.getElementById('sort-dropdown-menu');
    const selectedLabel = document.getElementById('sort-selected-label');
    const btnSortDir = document.getElementById('btn-sort-dir');
    const sortDirSvg = document.getElementById('sort-dir-svg');

    // SVG icons for sort direction (Ascending / Descending)
    const svgDesc = '<path d="M3 4h13M3 8h9M3 12h5m8 3l3 3m0 0l3-3m-3 3V8"/>';
    const svgAsc = '<path d="M3 4h5M3 8h9M3 12h13m-3-3l3-3m0 0l3 3m-3-3v11"/>';

    if (btnDropdown && dropdownMenu) {
      btnDropdown.onclick = (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.style.display !== 'none';
        dropdownMenu.style.display = isOpen ? 'none' : 'block';
        btnDropdown.classList.toggle('open', !isOpen);
      };

      const menuItems = dropdownMenu.querySelectorAll('.sort-menu-item');
      menuItems.forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          menuItems.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          this.sortBy = item.dataset.sort;
          if (selectedLabel) selectedLabel.textContent = item.textContent;
          dropdownMenu.style.display = 'none';
          btnDropdown.classList.remove('open');
          this.applyFilterAndSort();
        };
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#sort-dropdown')) {
          dropdownMenu.style.display = 'none';
          btnDropdown.classList.remove('open');
        }
      });
    }

    if (btnSortDir) {
      btnSortDir.onclick = () => {
        this.sortAsc = !this.sortAsc;
        if (sortDirSvg) {
          sortDirSvg.innerHTML = this.sortAsc ? svgAsc : svgDesc;
        }
        btnSortDir.title = this.sortAsc ? '当前：升序 (点击切换降序)' : '当前：降序 (点击切换升序)';
        this.applyFilterAndSort();
      };
    }

    const btnClearTags = document.getElementById('btn-clear-tag-filters');
    if (btnClearTags) {
      btnClearTags.onclick = () => {
        this.activeFilterTags.clear();
        this.renderTagPillBar();
        this.applyFilterAndSort();
      };
    }
  }

  bindTagSystem() {
    this.renderTagPillBar();
    const allModal = document.getElementById('glass-all-tags-modal');
    const closeAll = () => { if (allModal) allModal.style.display = 'none'; };
    const openAll = () => { this.renderAllTagsManager(); if (allModal) allModal.style.display = 'flex'; };
    document.getElementById('pop-manage-all-tags')?.addEventListener('click', openAll);
    document.getElementById('btn-close-all-tags')?.addEventListener('click', closeAll);
    allModal?.addEventListener('click', e => { if (e.target === allModal) closeAll(); });
    const allInput = document.getElementById('all-tags-new-input');
    const addAll = async () => {
      const value = allInput?.value.trim();
      if (!value) return;
      await this.addNewCustomTag(value);
      allInput.value = '';
      await this.loadCustomTags();
    };
    document.getElementById('btn-add-all-tag')?.addEventListener('click', addAll);
    allInput?.addEventListener('keydown', e => { if (e.key === 'Enter') addAll(); });

    // Tag Management Modal Binders
    const modalTag = document.getElementById('glass-tag-modal');
    const btnCloseTag = document.getElementById('btn-close-tag-modal');
    const btnCancelTag = document.getElementById('btn-cancel-tag-modal');
    const btnSaveTag = document.getElementById('btn-save-tag-modal');
    const inputCustomTag = document.getElementById('custom-tag-input');
    const btnAddCustomTag = document.getElementById('btn-add-custom-tag');

    const closeTagModal = () => {
      if (modalTag) modalTag.style.display = 'none';
      this.activeTagModalTracks = [];
      this.activeTagModalTags.clear();
    };

    if (btnCloseTag) btnCloseTag.onclick = closeTagModal;
    if (btnCancelTag) btnCancelTag.onclick = closeTagModal;

    // Preset pills clicking inside tag modal
    document.querySelectorAll('#modal-preset-moods .preset-pill, #modal-preset-usages .preset-pill').forEach(pill => {
      pill.onclick = () => {
        const tag = pill.dataset.tag;
        if (tag) {
          this.activeTagModalTags.add(tag);
          this.renderTagModalChips();
        }
      };
    });

    const addCustomFromInput = () => {
      const tag = inputCustomTag?.value.trim();
      if (tag) {
        this.activeTagModalTags.add(tag);
        inputCustomTag.value = '';
        this.renderTagModalChips();
      }
    };

    if (btnAddCustomTag) btnAddCustomTag.onclick = addCustomFromInput;
    if (inputCustomTag) {
      inputCustomTag.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addCustomFromInput();
      });
    }

    if (btnSaveTag) {
      btnSaveTag.onclick = async () => {
        const newTags = Array.from(this.activeTagModalTags);
        const paths = this.activeTagModalTracks.map(t => t.path);
        if (paths.length > 0 && window.glasswaveAPI) {
          const removedTags = [...new Set(this.activeTagModalTracks.flatMap(t=>t.tags || []))].filter(tag=>!newTags.includes(tag));
          const updated = await window.glasswaveAPI.batchUpdateTags(paths, newTags, removedTags);
          this.setTracks(updated);
          await this.loadCustomTags();
        }
        closeTagModal();
      };
    }

    this.loadCustomTags();
  }

  renderTagPillBar() {
    const container = document.getElementById('tag-pill-container');
    const btnClear = document.getElementById('btn-clear-tag-filters');
    if (!container) return;

    container.innerHTML = '';
    const allAvailableTags = new Set([...(this.presetMoods || []), ...(this.presetUsages || []), ...(this.customTags || [])]);

    // Also harvest tags from tracks
    this.allTracks.forEach(t => {
      if (Array.isArray(t.tags)) t.tags.forEach(tag => allAvailableTags.add(tag));
    });

    allAvailableTags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = `tag-pill ${this.activeFilterTags.has(tag) ? 'active' : ''}`;
      pill.textContent = tag;

      pill.onclick = () => {
        if (this.activeFilterTags.has(tag)) {
          this.activeFilterTags.delete(tag);
        } else {
          this.activeFilterTags.add(tag);
        }
        pill.classList.toggle('active', this.activeFilterTags.has(tag));
        if (btnClear) btnClear.style.display = this.activeFilterTags.size > 0 ? 'inline-block' : 'none';
        this.renderSearchMoreTags();
        this.applyFilterAndSort();
      };

      container.appendChild(pill);
    });

    if (btnClear) btnClear.style.display = this.activeFilterTags.size > 0 ? 'inline-block' : 'none';
  }

  renderSearchMoreTags() {
    const moodsWrap = document.getElementById('pop-chips-moods');
    const usagesWrap = document.getElementById('pop-chips-usages');
    const customWrap = document.getElementById('pop-chips-custom');
    const countHint = document.getElementById('pop-custom-tag-count');
    const hintEl = document.getElementById('pop-tag-current-hint');
    const btnSearchMore = document.getElementById('btn-search-more');

    // Update active filter state hint
    if (hintEl) {
      if (this.activeFilterTags.size === 0) {
        hintEl.textContent = '全部歌曲 · 无标签筛选';
        hintEl.style.color = 'var(--text-muted)';
      } else {
        hintEl.textContent = `已按标签筛选 (${this.activeFilterTags.size}): ${Array.from(this.activeFilterTags).join(', ')}`;
        hintEl.style.color = 'var(--accent-primary, #38bdf8)';
      }
    }

    if (btnSearchMore) {
      btnSearchMore.classList.toggle('has-active-filter', this.activeFilterTags.size > 0);
    }

    const onChipClick = (tag) => {
      if (this.activeFilterTags.has(tag)) {
        this.activeFilterTags.delete(tag);
      } else {
        this.activeFilterTags.add(tag);
      }
      this.renderTagPillBar();
      this.renderSearchMoreTags();

      // Switch to library view if currently on player stage
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav && activeNav.dataset.view === 'player') {
        this.switchView('library', 'all');
      }

      this.applyFilterAndSort();
    };

    // Render Moods
    if (moodsWrap) {
      moodsWrap.innerHTML = '';
      (this.presetMoods || []).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = `pop-tag-chip ${this.activeFilterTags.has(tag) ? 'active' : ''}`;
        chip.textContent = tag;
        chip.onclick = (e) => {
          e.stopPropagation();
          onChipClick(tag);
        };
        moodsWrap.appendChild(chip);
      });
    }

    // Render Usages
    if (usagesWrap) {
      usagesWrap.innerHTML = '';
      (this.presetUsages || []).forEach(tag => {
        const chip = document.createElement('span');
        chip.className = `pop-tag-chip ${this.activeFilterTags.has(tag) ? 'active' : ''}`;
        chip.textContent = tag;
        chip.onclick = (e) => {
          e.stopPropagation();
          onChipClick(tag);
        };
        usagesWrap.appendChild(chip);
      });
    }

    // Render Custom Tags
    if (customWrap) {
      customWrap.innerHTML = '';
      const cTags = Array.from(new Set(this.customTags || [])).filter(tag => !this.presetMoods.includes(tag) && !this.presetUsages.includes(tag));
      if (countHint) countHint.textContent = `${cTags.length} 个`;

      if (cTags.length === 0) {
        customWrap.innerHTML = '<span style="font-size:11px;color:var(--text-muted);padding:4px 0;">暂无自定义标签，在下方输入添加</span>';
      } else {
        cTags.forEach(tag => {
          const chip = document.createElement('span');
          chip.className = `pop-tag-chip ${this.activeFilterTags.has(tag) ? 'active' : ''}`;

          const lbl = document.createElement('span');
          lbl.textContent = tag;
          chip.appendChild(lbl);

          const delBtn = document.createElement('span');
          delBtn.className = 'chip-del-btn';
          delBtn.innerHTML = '&times;';
          delBtn.title = '删除此自定义标签';
          delBtn.onclick = async (e) => {
            e.stopPropagation();
            await this.deleteCustomTag(tag);
          };
          chip.appendChild(delBtn);

          chip.onclick = (e) => {
            e.stopPropagation();
            onChipClick(tag);
          };
          customWrap.appendChild(chip);
        });
      }
    }
  }

  async loadCustomTags() {
    if (window.glasswaveAPI && typeof window.glasswaveAPI.getCustomTags === 'function') {
      try {
        const [tags, hidden] = await Promise.all([
          window.glasswaveAPI.getCustomTags(), window.glasswaveAPI.getHiddenPresetTags()
        ]);
        if (Array.isArray(tags)) {
          this.customTags = tags;
          this.hiddenPresetTags = new Set(hidden || []);
          const moods = ['黑暗', '悲伤', '温暖', '神秘', '庄严', '激昂', '宁静', '欢快'];
          const usages = ['开场', '背景', '转场', '高潮', '结尾', '旁白', '主题曲'];
          this.presetMoods = moods.filter(t => !this.hiddenPresetTags.has(t));
          this.presetUsages = usages.filter(t => !this.hiddenPresetTags.has(t));
          document.querySelectorAll('#modal-preset-moods .preset-pill, #modal-preset-usages .preset-pill').forEach(pill => {
            pill.style.display = this.hiddenPresetTags.has(pill.dataset.tag) ? 'none' : '';
          });
          this.renderTagPillBar();
          this.renderSearchMoreTags();
          this.renderModalCustomTags();
          this.renderAllTagsManager();
        }
      } catch (e) {}
    }
  }

  async addNewCustomTag(tagName) {
    const clean = (tagName || '').trim();
    if (!clean) return;
    if (this.customTags && this.customTags.includes(clean) && !this.hiddenPresetTags.has(clean)) {
      this.showToast(`标签已存在: ${clean}`);
      return;
    }

    if (!Array.isArray(this.customTags)) this.customTags = [];
    this.customTags.push(clean);

    if (window.glasswaveAPI && typeof window.glasswaveAPI.addCustomTag === 'function') {
      try {
        const updated = await window.glasswaveAPI.addCustomTag(clean);
        if (Array.isArray(updated)) this.customTags = updated;
      } catch (e) {}
    }

    await this.loadCustomTags();
    this.showToast(`✨ 已创建自定义标签: ${clean}`);
  }

  async deleteCustomTag(tagName) {
    const clean = (tagName || '').trim();
    if (!clean) return;

    const count = this.allTracks.filter(t => (t.tags || []).includes(clean)).length;
    const ok = await this.showGlassConfirm({
      title: '删除全局标签',
      message: `删除“${clean}”并从 ${count} 首歌曲移除？`,
      subtext: '歌曲文件不会删除。',
      confirmText: '删除标签',
      danger: true
    });
    if (!ok) return;
    this.activeFilterTags.delete(clean);

    if (window.glasswaveAPI && typeof window.glasswaveAPI.removeCustomTag === 'function') {
      try {
        await window.glasswaveAPI.removeCustomTag(clean);
        const tracks = await window.glasswaveAPI.getTracks();
        this.setTracks(tracks);
      } catch (e) {
        console.error('Failed to delete tag:', e);
        this.showToast('删除标签失败，请重试');
        return;
      }
    }
    await this.loadCustomTags();
    this.applyFilterAndSort();
    this.showToast(`已删除标签: ${clean}`);
  }

  renderAllTagsManager() {
    const list = document.getElementById('all-tags-list');
    if (!list) return;
    list.innerHTML = '';
    const tags = new Set([...(this.presetMoods || []), ...(this.presetUsages || []), ...(this.customTags || [])]);
    if (!tags.size) list.textContent = '暂无标签';
    [...tags].sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach(tag => {
      const row = document.createElement('div');
      row.className = 'all-tags-row';
      const label = document.createElement('span');
      const count = this.allTracks.filter(t => (t.tags || []).includes(tag)).length;
      label.textContent = `${tag} · ${count} 首`;
      const del = document.createElement('button');
      del.textContent = '删除';
      del.onclick = () => this.deleteCustomTag(tag);
      row.append(label, del);
      list.appendChild(row);
    });
  }

  renderModalCustomTags() {
    const group = document.getElementById('modal-preset-custom-group');
    const wrap = document.getElementById('modal-preset-customs');
    if (!group || !wrap) return;

    const cTags = Array.from(new Set(this.customTags || [])).filter(tag => !this.presetMoods.includes(tag) && !this.presetUsages.includes(tag));
    if (cTags.length === 0) {
      group.style.display = 'none';
      return;
    }
    group.style.display = 'block';
    wrap.innerHTML = '';
    cTags.forEach(tag => {
      const pill = document.createElement('span');
      pill.className = 'preset-pill';
      pill.textContent = tag;
      pill.onclick = () => {
        this.activeTagModalTags.add(tag);
        this.renderTagModalChips();
      };
      wrap.appendChild(pill);
    });
  }

  openTagModal(tracks) {
    const modal = document.getElementById('glass-tag-modal');
    if (!modal) return;

    this.activeTagModalTracks = Array.isArray(tracks) ? tracks : [tracks];
    this.activeTagModalTags.clear();

    // Union of tags on selected tracks
    this.activeTagModalTracks.forEach(t => {
      if (Array.isArray(t.tags)) t.tags.forEach(tag => this.activeTagModalTags.add(tag));
    });

    this.renderTagModalChips();
    this.renderModalCustomTags();
    modal.style.display = 'flex';
  }

  renderTagModalChips() {
    const wrap = document.getElementById('modal-current-tags');
    if (!wrap) return;

    wrap.innerHTML = '';
    if (this.activeTagModalTags.size === 0) {
      wrap.innerHTML = '<span style="font-size:12px; color:var(--text-dim);">暂无标签，点击下方预设或手动输入添加</span>';
      return;
    }

    this.activeTagModalTags.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `
        <span>${escapeHtml(tag)}</span>
        <span class="tag-chip-del">&times;</span>
      `;
      chip.querySelector('.tag-chip-del').onclick = () => {
        this.activeTagModalTags.delete(tag);
        this.renderTagModalChips();
      };
      wrap.appendChild(chip);
    });
  }

  // =========================================================================
  // 9. Batch Selection & Actions (Requirement 6)
  // =========================================================================
  bindBatchActions() {
    const bar = document.getElementById('batch-action-bar');
    const btnBatchCat = document.getElementById('btn-batch-add-category');
    const btnBatchTags = document.getElementById('btn-batch-add-tags');
    const btnBatchQueue = document.getElementById('btn-batch-add-queue');
    const btnBatchFav = document.getElementById('btn-batch-favorite');
    const btnClearSel = document.getElementById('btn-batch-clear-selection');
    const btnBatchRemoveCat = document.getElementById('btn-batch-remove-cat');
    const btnBatchRemoveLib = document.getElementById('btn-batch-remove-lib');
    const btnBatchDeleteFile = document.getElementById('btn-batch-delete-file');

    if (btnClearSel) {
      btnClearSel.onclick = () => this.clearSelection();
    }

    if (btnBatchQueue) {
      btnBatchQueue.onclick = () => {
        const selected = this.getSelectedTracks();
        selected.forEach(t => this.audioEngine.addToQueue(t));
        this.clearSelection();
      };
    }

    if (btnBatchFav && window.glasswaveAPI) {
      btnBatchFav.onclick = async () => {
        const selected = this.getSelectedTracks();
        const paths = selected.map(t => t.path);
        const updated = await window.glasswaveAPI.batchFavorite(paths, true);
        this.setTracks(updated);
        this.clearSelection();
      };
    }

    if (btnBatchTags) {
      btnBatchTags.onclick = () => {
        const selected = this.getSelectedTracks();
        if (selected.length > 0) this.openTagModal(selected);
      };
    }

    // Level 1 Deletion: Batch Remove from Current Category
    if (btnBatchRemoveCat && window.glasswaveAPI) {
      btnBatchRemoveCat.onclick = async () => {
        if (!this.currentSubView.startsWith('category:')) return;
        const catId = this.currentSubView.split(':')[1];
        const selected = this.getSelectedTracks();
        const paths = selected.map(t => t.path);
        if (paths.length === 0) return;

        await window.glasswaveAPI.removeFromCategory(catId, paths);
        await this.loadCategories();
        this.applyFilterAndSort();
        this.clearSelection();
      };
    }

    // Level 2 Deletion: Batch Remove from Player Library (DB only, safe)
    if (btnBatchRemoveLib && window.glasswaveAPI) {
      btnBatchRemoveLib.onclick = async () => {
        const selected = this.getSelectedTracks();
        const paths = selected.map(t => t.path);
        if (paths.length === 0) return;

        const ok = await this.showGlassConfirm({
          title: '从音乐库移除',
          message: `确定将选中的 ${paths.length} 首歌曲从音乐库移除吗？`,
          subtext: '仅从播放器曲库列表中移出，绝不会删除本地磁盘文件。',
          confirmText: '确认移除',
          danger: true
        });

        if (ok) {
          const updated = await window.glasswaveAPI.batchHideTracks(paths);
          this.removeTracksFromPlayback(paths);
            this.setTracks(updated);
          this.clearSelection();
        }
      };
    }

    // Level 3 Deletion: Batch Delete Local Files to Recycle Bin (Physical files)
    if (btnBatchDeleteFile && window.glasswaveAPI) {
      btnBatchDeleteFile.onclick = async () => {
        const selected = this.getSelectedTracks();
        const paths = selected.map(t => t.path);
        if (paths.length === 0) return;

        const ok = await this.showGlassConfirm({
          title: '移至系统回收站',
          message: `确定要将选中的 ${paths.length} 个本地音频文件移入系统回收站吗？`,
          subtext: '高危操作：此操作将对磁盘物理文件生效！',
          confirmText: '删除文件',
          danger: true
        });

        if (ok) {
          await this.deleteTracksSafely(paths);
          this.clearSelection();
        }
      };
    }

    // Batch Category Modal
    const modalBatchCat = document.getElementById('glass-batch-category-modal');
    const selectBatchCat = document.getElementById('batch-cat-select');
    const btnCloseBatchCat = document.getElementById('btn-close-batch-cat-modal');
    const btnCancelBatchCat = document.getElementById('btn-cancel-batch-cat');
    const btnConfirmBatchCat = document.getElementById('btn-confirm-batch-cat');

    const closeBatchCatModal = () => {
      if (modalBatchCat) modalBatchCat.style.display = 'none';
    };

    if (btnCloseBatchCat) btnCloseBatchCat.onclick = closeBatchCatModal;
    if (btnCancelBatchCat) btnCancelBatchCat.onclick = closeBatchCatModal;

    if (btnBatchCat) {
      btnBatchCat.onclick = () => {
        if (!selectBatchCat || this.categories.length === 0) {
          alert('请先在左侧边栏“我的分类”中创建分类！');
          return;
        }
        selectBatchCat.innerHTML = this.categories.map(c => {
          const group = this.categoryGroups.find(g => g.id === c.groupId);
          return `<option value="${escapeHtml(c.id)}">${escapeHtml(group?.name || '分类')} / ${escapeHtml(c.name)}</option>`;
        }).join('');
        if (modalBatchCat) modalBatchCat.style.display = 'flex';
      };
    }

    if (btnConfirmBatchCat) {
      btnConfirmBatchCat.onclick = async () => {
        const catId = selectBatchCat?.value;
        const selected = this.getSelectedTracks();
        const paths = [...new Set(selected.map(t => t.path))];
        if (catId && paths.length > 0 && window.glasswaveAPI) {
          const updated = await window.glasswaveAPI.addToCategory(catId, paths);
          await this.loadCategories();
          this.setTracks(updated);
        }
        closeBatchCatModal();
        this.clearSelection();
      };
    }
  }

  getSelectedTracks() {
    return this.allTracks.filter(t => this.selectedTrackPaths.has(t.path));
  }

  clearSelection() {
    this.selectedTrackPaths.clear();
    this.lastSelectedTrackIndex = -1;
    const bar = document.getElementById('batch-action-bar');
    if (bar) bar.style.display = 'none';
    document.querySelectorAll('.track-row.selected').forEach(r => r.classList.remove('selected'));
  }

  updateSelectionUI() {
    const bar = document.getElementById('batch-action-bar');
    const countEl = document.getElementById('batch-selected-count');
    const size = this.selectedTrackPaths.size;

    if (bar && countEl) {
      if (size > 0) {
        bar.style.display = 'flex';
        countEl.textContent = size;

        // Toggle "从当前分类移除" button based on subview
        const btnBatchRemoveCat = document.getElementById('btn-batch-remove-cat');
        if (btnBatchRemoveCat) {
          btnBatchRemoveCat.style.display = this.currentSubView.startsWith('category:') ? 'inline-block' : 'none';
        }
      } else {
        bar.style.display = 'none';
      }
    }

    // Refresh row highlighted classes
    document.querySelectorAll('.track-row').forEach(row => {
      const p = row.dataset.trackPath;
      if (p && this.selectedTrackPaths.has(p)) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  // =========================================================================
  // 10. Filter & Sort Execution Logic
  // =========================================================================
  applyFilterAndSort() {
    let result = [...this.allTracks];

    // Include any temporarily dropped/queued tracks that are not yet in database so they are instantly searchable
    if (this.audioEngine && Array.isArray(this.audioEngine.playbackQueue)) {
      const knownPaths = new Set(result.map(t => t.path));
      for (const qTrack of this.audioEngine.playbackQueue) {
        if (qTrack && qTrack.path && !knownPaths.has(qTrack.path)) {
          result.push(qTrack);
          knownPaths.add(qTrack.path);
        }
      }
    }

    // 1. Subview Filter
    if (this.currentSubView === 'favorites') {
      result = result.filter(t => t.isFavorite);
    } else if (this.currentSubView === 'recent') {
      if (this.playbackHistory && this.playbackHistory.length > 0) {
        const histOrder = new Map(this.playbackHistory.map((h, i) => [h.path, i]));
        result = result.filter(t => histOrder.has(t.path));
        result.sort((a, b) => (histOrder.get(a.path) ?? 9999) - (histOrder.get(b.path) ?? 9999));
      }
    } else if (this.currentSubView === 'added') {
      result.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
    } else if (this.currentSubView.startsWith('category:')) {
      const catId = this.currentSubView.split(':')[1];
      const cat = this.categories.find(c => c.id === catId);
      if (cat && Array.isArray(cat.trackPaths)) {
        const pathSet = new Set(cat.trackPaths);
        result = result.filter(t => pathSet.has(t.path));
      } else {
        result = [];
      }
    }

    // 2. Multi-Tag AND Combination Filter
    if (this.activeFilterTags.size > 0) {
      result = result.filter(t => {
        if (!Array.isArray(t.tags) || t.tags.length === 0) return false;
        const trackTagSet = new Set(t.tags.map(s => s.toLowerCase()));
        for (const tag of this.activeFilterTags) {
          if (!trackTagSet.has(tag.toLowerCase())) return false;
        }
        return true;
      });
    }

    // 3. Multi-token Fuzzy/Substring Search Filter
    if (this.searchQuery) {
      const tokens = this.searchQuery.split(/\s+/).filter(Boolean);
      result = result.filter(t => {
        const title = (t.title || '').toLowerCase();
        const artist = (t.artist || '').toLowerCase();
        const album = (t.album || '').toLowerCase();
        const fullPath = (t.path || '').toLowerCase();
        const fileName = (t.path ? t.path.split(/[\\/]/).pop() : '').toLowerCase();
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const tags = (t.tags || []).join(' ').toLowerCase();
        const categories = (t.categories || []).join(' ').toLowerCase();

        const haystack = `${title} ${artist} ${album} ${fileName} ${baseName} ${fullPath} ${tags} ${categories}`;
        return tokens.every(tok => haystack.includes(tok));
      });
    }

    // 4. Sorting
    if (this.sortBy && this.sortBy !== 'default') {
      result.sort((a, b) => {
        let valA, valB;
        if (this.sortBy === 'title') {
          valA = (a.title || '').localeCompare(b.title || '', 'zh-Hans-CN');
          return this.sortAsc ? valA : -valA;
        } else if (this.sortBy === 'artist') {
          valA = (a.artist || '').localeCompare(b.artist || '', 'zh-Hans-CN');
          return this.sortAsc ? valA : -valA;
        } else if (this.sortBy === 'album') {
          valA = (a.album || '').localeCompare(b.album || '', 'zh-Hans-CN');
          return this.sortAsc ? valA : -valA;
        } else if (this.sortBy === 'dateAdded') {
          valA = (a.dateAdded || 0) - (b.dateAdded || 0);
          return this.sortAsc ? valA : -valA;
        } else if (this.sortBy === 'duration') {
          valA = (a.duration || 0) - (b.duration || 0);
          return this.sortAsc ? valA : -valA;
        }
        return 0;
      });
    }

    this.filteredTracks = result;

    const subBadge = document.getElementById('library-sub-count');
    if (subBadge) subBadge.textContent = `${this.filteredTracks.length} 首`;

    const scrollView = document.getElementById('track-list-scroll-view');
    if (scrollView) scrollView.scrollTop = 0;
    this.renderTrackList();
  }

  // =========================================================================
  // =========================================================================
  // 11. Virtual Scrolling with Selection & Favorite Support
  // =========================================================================
  // =========================================================================
  // 11. High-Performance Virtual Scrolling with DOM Pool & Momentum Physics
  // =========================================================================
  createPoolRow() {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.draggable = true;

    const indexEl = document.createElement('div');
    indexEl.className = 'track-row-index';
    row.appendChild(indexEl);

    const favBtn = document.createElement('div');
    favBtn.className = 'track-row-fav';
    favBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    `;
    row.appendChild(favBtn);

    const thumbEl = document.createElement('div');
    thumbEl.className = 'track-row-thumb';

    // Pre-create image and SVG placeholder to completely avoid innerHTML allocations during high-speed scroll
    const thumbImg = document.createElement('img');
    thumbImg.alt = '';
    thumbImg.style.display = 'none';
    thumbImg.onerror = () => {
      thumbImg.style.display = 'none';
      thumbSvg.style.display = 'block';
    };
    thumbEl.appendChild(thumbImg);

    const thumbSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    thumbSvg.setAttribute('viewBox', '0 0 24 24');
    thumbSvg.setAttribute('fill', 'none');
    thumbSvg.setAttribute('stroke', 'currentColor');
    thumbSvg.setAttribute('stroke-width', '2');
    thumbSvg.innerHTML = '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle>';
    thumbEl.appendChild(thumbSvg);
    row.appendChild(thumbEl);

    const titleEl = document.createElement('div');
    titleEl.className = 'track-row-title';
    row.appendChild(titleEl);

    const artistEl = document.createElement('div');
    artistEl.className = 'track-row-artist';
    row.appendChild(artistEl);

    const durationEl = document.createElement('div');
    durationEl.className = 'track-row-duration';
    row.appendChild(durationEl);

    // Cache child references for sub-millisecond updates
    row._indexEl = indexEl;
    row._favBtn = favBtn;
    row._favSvg = favBtn.querySelector('svg');
    row._thumbEl = thumbEl;
    row._thumbImg = thumbImg;
    row._thumbSvg = thumbSvg;
    row._titleEl = titleEl;
    row._artistEl = artistEl;
    row._durationEl = durationEl;
    row._currentCoverSrc = '';

    return row;
  }

  updatePoolRow(row, track, idx, isCur, isSelected) {
    row.dataset.index = idx;
    row.dataset.trackId = track.id || '';
    row.dataset.trackPath = track.path || '';

    // Fast class toggling
    row.classList.toggle('playing', !!isCur);
    row.classList.toggle('selected', !!isSelected);

    // Fast text updates without HTML re-parsing
    row._indexEl.textContent = idx + 1;

    const title = track.title || '未知曲目';
    if (row._titleEl.textContent !== title) {
      row._titleEl.textContent = title;
      row._titleEl.title = title;
    }

    const artist = track.artist || '未知艺术家';
    if (row._artistEl.textContent !== artist) {
      row._artistEl.textContent = artist;
      row._artistEl.title = artist;
    }

    const durationStr = this.formatTime(track.duration);
    if (row._durationEl.textContent !== durationStr) {
      row._durationEl.textContent = durationStr;
    }

    // Favorite heart status
    const isFav = !!track.isFavorite;
    row._favBtn.classList.toggle('is-fav', isFav);
    row._favBtn.title = isFav ? '取消收藏' : '收藏';
    if (row._favSvg) {
      row._favSvg.setAttribute('fill', isFav ? 'currentColor' : 'none');
    }

    // Thumbnail: Instant cache hit or lightweight placeholder with ZERO DOM reallocations
    const targetCover = track.coverPath || track.path;
    if (targetCover && this.coverCache.has(targetCover) && this.coverCache.get(targetCover) !== 'none') {
      const dataUrl = this.coverCache.get(targetCover);
      if (row._currentCoverSrc !== dataUrl) {
        row._currentCoverSrc = dataUrl;
        row._thumbImg.src = dataUrl;
        row._thumbImg.style.display = 'block';
        row._thumbSvg.style.display = 'none';
      }
    } else {
      if (row._currentCoverSrc !== 'default') {
        row._currentCoverSrc = 'default';
        row._thumbImg.style.display = 'none';
        row._thumbSvg.style.display = 'block';
      }
    }

    // Hardware-accelerated GPU translate3d positioning
    row.style.transform = `translate3d(0, ${idx * this.ROW_STRIDE}px, 0)`;
    row.style.display = 'flex';
  }


  bindTrackListEvents() {
    const container = document.getElementById('track-list-container');
    if (!container || container._hasBoundTrackEvents) return;
    container._hasBoundTrackEvents = true;

    // Single unified click delegation
    container.addEventListener('click', async (e) => {
      const favBtn = e.target.closest('.track-row-fav');
      const row = e.target.closest('.track-row');
      if (!row) return;

      const idx = parseInt(row.dataset.index, 10);
      const track = this.filteredTracks[idx];
      if (!track) return;

      if (favBtn) {
        e.stopPropagation();
        const newFav = !track.isFavorite;
        track.isFavorite = newFav;
        if (window.glasswaveAPI && window.glasswaveAPI.toggleFavorite) {
          await window.glasswaveAPI.toggleFavorite(track.path, newFav);
        }
        favBtn.classList.toggle('is-fav', newFav);
        const svg = favBtn.querySelector('svg');
        if (svg) svg.setAttribute('fill', newFav ? 'currentColor' : 'none');
        favBtn.title = newFav ? '取消收藏' : '收藏';

        const favBadge = document.getElementById('fav-count');
        if (favBadge) favBadge.textContent = this.allTracks.filter(t => t.isFavorite).length;

        if (this.currentSubView === 'favorites' && !newFav) {
          this.applyFilterAndSort();
        }
        return;
      }

      // Track row click: Multi-selection or play
      if (e.ctrlKey || e.metaKey) {
        if (this.selectedTrackPaths.has(track.path)) {
          this.selectedTrackPaths.delete(track.path);
        } else {
          this.selectedTrackPaths.add(track.path);
        }
        this.lastSelectedTrackIndex = idx;
        this.updateSelectionUI();
      } else if (e.shiftKey && this.lastSelectedTrackIndex !== -1) {
        this.selectedTrackPaths.clear();
        const start = Math.min(this.lastSelectedTrackIndex, idx);
        const end = Math.max(this.lastSelectedTrackIndex, idx);
        for (let i = start; i <= end; i++) {
          if (this.filteredTracks[i]) {
            this.selectedTrackPaths.add(this.filteredTracks[i].path);
          }
        }
        this.updateSelectionUI();
      } else {
        this.selectedTrackPaths.clear();
        this.selectedTrackPaths.add(track.path);
        this.lastSelectedTrackIndex = idx;
        this.updateSelectionUI();
      }
    });

    container.addEventListener('dblclick', e => {
      if (e.target.closest('.track-row-fav')) return;
      const row = e.target.closest('.track-row');
      const idx = row ? Number(row.dataset.index) : -1;
      const track = this.filteredTracks[idx];
      if (!track) return;
      const sourceView = this.searchQuery ? (this._prevSubViewBeforeSearch || this.currentSubView) : this.currentSubView;
      const scope = sourceView?.startsWith('category:')
        ? { type: 'category', categoryId: sourceView.slice('category:'.length) } : { type: 'library' };
      this.audioEngine.setQueue(this.filteredTracks, idx, scope);
      this.audioEngine.loadTrack(track, true);
    });

    // Unified contextmenu delegation
    container.addEventListener('contextmenu', (e) => {
      const row = e.target.closest('.track-row');
      if (!row) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(row.dataset.index, 10);
      const track = this.filteredTracks[idx];
      if (track) {
        if (!this.selectedTrackPaths.has(track.path)) {
          this.selectedTrackPaths.clear();
          this.selectedTrackPaths.add(track.path);
          this.lastSelectedTrackIndex = idx;
          this.updateSelectionUI();
        }
        this.openContextMenu(track, e.clientX, e.clientY);
      }
    });

    // Unified dragstart delegation for categories
    container.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.track-row');
      if (!row) return;
      const idx = parseInt(row.dataset.index, 10);
      const track = this.filteredTracks[idx];
      if (!track) return;

      let paths = [track.path];
      if (this.selectedTrackPaths.has(track.path)) {
        paths = Array.from(this.selectedTrackPaths);
      }
      const payload = JSON.stringify(paths);
      e.dataTransfer.setData('application/x-glasswave-tracks', payload);
      e.dataTransfer.setData('text/plain', payload);
    });
  }

  getTrackInitialLetter(track) {
    if (!track) return '#';
    const title = (track.title || '').trim();
    if (!title) return '#';
    const firstChar = title.charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'Z') return firstChar;
    if (/[\u4e00-\u9fa5]/.test(firstChar)) {
      const pinyinBuckets = [
        { char: '吖', letter: 'A' }, { char: '八', letter: 'B' }, { char: '嚓', letter: 'C' },
        { char: '搭', letter: 'D' }, { char: '蛾', letter: 'E' }, { char: '发', letter: 'F' },
        { char: '噶', letter: 'G' }, { char: '哈', letter: 'H' }, { char: '击', letter: 'J' },
        { char: '喀', letter: 'K' }, { char: '垃', letter: 'L' }, { char: '妈', letter: 'M' },
        { char: '拿', letter: 'N' }, { char: '哦', letter: 'O' }, { char: '趴', letter: 'P' },
        { char: '七', letter: 'Q' }, { char: '然', letter: 'R' }, { char: '撒', letter: 'S' },
        { char: '塌', letter: 'T' }, { char: '挖', letter: 'W' }, { char: '昔', letter: 'X' },
        { char: '压', letter: 'Y' }, { char: '匝', letter: 'Z' }
      ];
      for (let i = pinyinBuckets.length - 1; i >= 0; i--) {
        if (firstChar.localeCompare(pinyinBuckets[i].char, 'zh-Hans-CN') >= 0) {
          return pinyinBuckets[i].letter;
        }
      }
    }
    return '#';
  }

  initAlphabetIndexBar() {
    const bar = document.getElementById('alphabet-index-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const letters = ['#', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    letters.forEach(letter => {
      const el = document.createElement('div');
      el.className = 'alphabet-letter';
      el.dataset.letter = letter;
      el.textContent = letter;
      el.title = `跳转到 ${letter}`;
      bar.appendChild(el);
    });

    const handleJump = (targetEl) => {
      if (!targetEl || !targetEl.classList.contains('alphabet-letter')) return;
      const letter = targetEl.dataset.letter;
      this.scrollToLetter(letter);
    };

    bar.addEventListener('click', (e) => {
      const letterEl = e.target.closest('.alphabet-letter');
      if (letterEl) handleJump(letterEl);
    });

    // Dragging across vertical alphabet column
    let isDragging = false;
    bar.addEventListener('pointerdown', (e) => {
      isDragging = true;
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target) handleJump(target.closest('.alphabet-letter'));
    });

    bar.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (target) handleJump(target.closest('.alphabet-letter'));
    });

    const stopDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try { bar.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    bar.addEventListener('pointerup', stopDrag);
    bar.addEventListener('pointercancel', stopDrag);
  }

  scrollToLetter(letter) {
    if (!this.filteredTracks || !this.filteredTracks.length) return;
    const scrollView = document.getElementById('track-list-scroll-view');
    if (!scrollView) return;

    let targetIndex = -1;
    if (letter === '#') {
      targetIndex = 0;
    } else {
      targetIndex = this.filteredTracks.findIndex(t => this.getTrackInitialLetter(t) === letter);
      if (targetIndex === -1) {
        targetIndex = this.filteredTracks.findIndex(t => {
          const l = this.getTrackInitialLetter(t);
          return l !== '#' && l.localeCompare(letter) >= 0;
        });
      }
    }

    if (targetIndex !== -1) {
      scrollView.scrollTop = targetIndex * this.ROW_STRIDE;
      if (this.resetScrollLerp) this.resetScrollLerp();
      this.updateVirtualScroll();
      this.updateOverlayScrollbar();
      this.highlightAlphabetLetter(letter);
    }
  }

  highlightAlphabetLetter(letter) {
    if (this._currentHighlightedLetter === letter) return;
    this._currentHighlightedLetter = letter;
    const bar = document.getElementById('alphabet-index-bar');
    if (!bar) return;
    const prev = bar.querySelector('.alphabet-letter.active');
    if (prev) prev.classList.remove('active');
    const target = bar.querySelector(`.alphabet-letter[data-letter="${letter}"]`);
    if (target) target.classList.add('active');
  }

  bindLibraryScroll() {
    const scrollView = document.getElementById('track-list-scroll-view');
    if (!scrollView) return;

    this.bindTrackListEvents();

    let scrollEndTimer = null;

    // 1. High-Performance Native GPU Hardware Scroll Listener
    scrollView.addEventListener('scroll', () => {
      if (!this.isLibraryScrolling) {
        this.isLibraryScrolling = true;
        scrollView.classList.add('is-scrolling');
      }

      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        this.isLibraryScrolling = false;
        scrollView.classList.remove('is-scrolling');
        this.scheduleProgressiveCoverLoad();
      }, 120);

      // Immediately synchronize virtual scroll rows and custom overlay scrollbar via rAF
      if (!this._libScrollRaf) {
        this._libScrollRaf = requestAnimationFrame(() => {
          if (!scrollView.classList.contains('is-fast-scrolling')) {
            this.updateVirtualScroll();
            this.updateOverlayScrollbar();
          }
          this._libScrollRaf = null;
        });
      }
    }, { passive: true });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateVirtualScroll(true);
        this.updateOverlayScrollbar();
        this.scheduleProgressiveCoverLoad();
        resizeTimer = null;
      }, 100);
    });
  }

  initOverlayScrollbar() {
    const scrollView = document.getElementById('track-list-scroll-view');
    const track = document.getElementById('tracklist-scrollbar-track');
    const thumb = document.getElementById('tracklist-scrollbar-thumb');
    if (!scrollView || !track || !thumb) return;

    let targetScrollTop = scrollView.scrollTop;
    let currentScrollTop = scrollView.scrollTop;
    let isLerping = false;
    let lerpRafId = null;
    let isFastScrolling = false;

    const doLerpScroll = () => {
      const diff = targetScrollTop - currentScrollTop;
      const absDiff = Math.abs(diff);

      if (absDiff < 0.5) {
        currentScrollTop = targetScrollTop;
        scrollView.scrollTop = currentScrollTop;
        isLerping = false;
        if (isFastScrolling) {
          isFastScrolling = false;
          scrollView.classList.remove('is-fast-scrolling');
          this.updateVirtualScroll(true);
          this.triggerTrackBrushIn();
        } else {
          this.updateVirtualScroll();
        }
        this.updateOverlayScrollbar();
        return;
      }

      currentScrollTop += diff * 0.28;
      scrollView.scrollTop = currentScrollTop;

      if (absDiff > 120) {
        if (!isFastScrolling) {
          isFastScrolling = true;
          scrollView.classList.add('is-fast-scrolling');
        }
      } else {
        if (isFastScrolling) {
          isFastScrolling = false;
          scrollView.classList.remove('is-fast-scrolling');
          this.updateVirtualScroll(true);
          this.triggerTrackBrushIn();
        } else {
          this.updateVirtualScroll();
        }
      }

      this.updateOverlayScrollbar();
      lerpRafId = requestAnimationFrame(doLerpScroll);
    };

    // Smooth damping wheel scroll on track list scroll view (Section 9.4)
    scrollView.addEventListener('wheel', (e) => {
      e.preventDefault();
      const maxScroll = Math.max(0, scrollView.scrollHeight - scrollView.clientHeight);
      if (maxScroll <= 0) return;

      if (!isLerping) {
        currentScrollTop = scrollView.scrollTop;
        targetScrollTop = scrollView.scrollTop;
      }

      targetScrollTop = Math.max(0, Math.min(maxScroll, targetScrollTop + e.deltaY));
      if (!isLerping) {
        isLerping = true;
        lerpRafId = requestAnimationFrame(doLerpScroll);
      }
    }, { passive: false });

    // Direct Damped Thumb Dragging with Fast-Scrubbing Decoupling & Brush-In
    let isDraggingThumb = false;
    let startY = 0;
    let startScrollTop = 0;
    let dragRafId = null;

    const runDampedDrag = () => {
      const diff = targetScrollTop - currentScrollTop;
      const absDiff = Math.abs(diff);

      if (!isDraggingThumb && absDiff < 0.5) {
        currentScrollTop = targetScrollTop;
        scrollView.scrollTop = currentScrollTop;
        this.updateOverlayScrollbar();
        if (isFastScrolling) {
          isFastScrolling = false;
          scrollView.classList.remove('is-fast-scrolling');
          this.updateVirtualScroll(true);
          this.triggerTrackBrushIn();
        } else {
          this.updateVirtualScroll();
        }
        dragRafId = null;
        return;
      }

      // Smooth physical damping
      currentScrollTop += diff * 0.32;
      scrollView.scrollTop = currentScrollTop;

      // Update thumb position based on damped currentScrollTop
      const maxScroll = Math.max(0, scrollView.scrollHeight - scrollView.clientHeight);
      const trackHeight = track.clientHeight || (scrollView.clientHeight - 20);
      const thumbHeight = thumb.offsetHeight || 40;
      const maxThumbTop = trackHeight - thumbHeight;
      const scrollRatio = maxScroll > 0 ? (currentScrollTop / maxScroll) : 0;
      const thumbTop = Math.max(0, Math.min(maxThumbTop, scrollRatio * maxThumbTop));
      thumb.style.transform = `translate3d(0, ${thumbTop}px, 0)`;

      // Fast-scrubbing velocity detection: decouple DOM row rendering while scrubbing rapidly
      if (absDiff > 25) {
        if (!isFastScrolling) {
          isFastScrolling = true;
          scrollView.classList.add('is-fast-scrolling');
        }
      } else {
        if (isFastScrolling) {
          isFastScrolling = false;
          scrollView.classList.remove('is-fast-scrolling');
          this.updateVirtualScroll(true);
          this.triggerTrackBrushIn();
        } else {
          this.updateVirtualScroll();
        }
      }

      dragRafId = requestAnimationFrame(runDampedDrag);
    };

    thumb.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingThumb = true;
      this.isDraggingScrollbar = true;
      this.isLibraryScrolling = true;
      scrollView.classList.add('is-scrolling');
      thumb.classList.add('is-dragging');
      try { thumb.setPointerCapture(e.pointerId); } catch (err) {}
      startY = e.clientY;
      startScrollTop = scrollView.scrollTop;
      targetScrollTop = startScrollTop;
      currentScrollTop = startScrollTop;
      if (isLerping) {
        cancelAnimationFrame(lerpRafId);
        isLerping = false;
      }
      if (!dragRafId) {
        dragRafId = requestAnimationFrame(runDampedDrag);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingThumb) return;
      this.isLibraryScrolling = true;
      const deltaY = e.clientY - startY;
      const trackHeight = track.clientHeight || (scrollView.clientHeight - 20);
      const thumbHeight = thumb.offsetHeight || 40;
      const maxThumbTop = trackHeight - thumbHeight;
      const maxScroll = Math.max(0, scrollView.scrollHeight - scrollView.clientHeight);
      if (maxThumbTop <= 0 || maxScroll <= 0) return;

      const scrollDelta = (deltaY / maxThumbTop) * maxScroll;
      targetScrollTop = Math.max(0, Math.min(maxScroll, startScrollTop + scrollDelta));

      if (!dragRafId) {
        dragRafId = requestAnimationFrame(runDampedDrag);
      }
    });

    const stopThumbDrag = (e) => {
      if (!isDraggingThumb) return;
      isDraggingThumb = false;
      this.isDraggingScrollbar = false;
      thumb.classList.remove('is-dragging');
      try { thumb.releasePointerCapture(e.pointerId); } catch (err) {}

      // Settle if damped loop has finished
      if (!dragRafId) {
        if (isFastScrolling) {
          isFastScrolling = false;
          scrollView.classList.remove('is-fast-scrolling');
        }
        scrollView.scrollTop = targetScrollTop;
        currentScrollTop = targetScrollTop;
        this.updateVirtualScroll(true);
        this.triggerTrackBrushIn();
        this.updateOverlayScrollbar();
      }

      setTimeout(() => {
        this.isLibraryScrolling = false;
        scrollView.classList.remove('is-scrolling');
        this.scheduleProgressiveCoverLoad();
      }, 120);
    };
    window.addEventListener('pointerup', stopThumbDrag);
    window.addEventListener('pointercancel', stopThumbDrag);

    // Track click to jump with smooth damping
    track.addEventListener('pointerdown', (e) => {
      if (e.target === thumb) return;
      const rect = track.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const trackHeight = track.clientHeight || (scrollView.clientHeight - 20);
      const thumbHeight = thumb.offsetHeight || 40;
      const maxThumbTop = trackHeight - thumbHeight;
      const maxScroll = Math.max(0, scrollView.scrollHeight - scrollView.clientHeight);
      if (maxThumbTop <= 0 || maxScroll <= 0) return;

      const targetThumbTop = Math.max(0, Math.min(maxThumbTop, clickY - thumbHeight / 2));
      const newScrollTop = (targetThumbTop / maxThumbTop) * maxScroll;
      targetScrollTop = newScrollTop;
      if (!isLerping) {
        isLerping = true;
        lerpRafId = requestAnimationFrame(doLerpScroll);
      }
    });

    this.resetScrollLerp = () => {
      if (isLerping) {
        cancelAnimationFrame(lerpRafId);
        isLerping = false;
      }
      if (dragRafId) {
        cancelAnimationFrame(dragRafId);
        dragRafId = null;
      }
      targetScrollTop = scrollView.scrollTop;
      currentScrollTop = scrollView.scrollTop;
    };
  }

  updateOverlayScrollbar() {
    const scrollView = document.getElementById('track-list-scroll-view');
    const track = document.getElementById('tracklist-scrollbar-track');
    const thumb = document.getElementById('tracklist-scrollbar-thumb');
    if (!scrollView || !track || !thumb) return;

    const scrollHeight = scrollView.scrollHeight;
    const clientHeight = scrollView.clientHeight;

    if (scrollHeight <= clientHeight || clientHeight === 0) {
      track.style.display = 'none';
      return;
    }

    track.style.display = 'flex';
    const trackHeight = track.clientHeight || (clientHeight - 20);
    const rawThumbHeight = (clientHeight / scrollHeight) * trackHeight;
    // Section 9.6: Minimum thumb height strictly clamped to 40px (never becomes tiny cube in 10,000+ tracks)
    const thumbHeight = Math.max(40, Math.min(trackHeight, rawThumbHeight));
    thumb.style.height = `${thumbHeight}px`;

    const maxScroll = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const scrollRatio = maxScroll > 0 ? (scrollView.scrollTop / maxScroll) : 0;
    const thumbTop = Math.max(0, Math.min(maxThumbTop, scrollRatio * maxThumbTop));
    thumb.style.transform = `translate3d(0, ${thumbTop}px, 0)`;
  }

  setTracks(tracks) {
    const retained=new Set((tracks||[]).map(t=>t.path));
    const removed=(this.allTracks||[]).filter(t=>!retained.has(t.path)).map(t=>t.path);
    if(removed.length) this.removeTracksFromPlayback(removed);
    this.allTracks = tracks || [];
    const badge = document.getElementById('library-count');
    if (badge) badge.textContent = this.allTracks.length;

    const favCount = this.allTracks.filter(t => t.isFavorite).length;
    const favBadge = document.getElementById('fav-count');
    if (favBadge) favBadge.textContent = favCount;

    this.renderTagPillBar();
    this.renderSearchMoreTags();
    this.applyFilterAndSort();
  }

  renderTrackList() {
    const scrollView = document.getElementById('track-list-scroll-view');
    const spacer = document.getElementById('virtual-scroll-spacer');
    const container = document.getElementById('track-list-container');
    if (!container || !spacer) return;

    this.visibleStartIndex = -1;
    this.visibleEndIndex = -1;

    const total = this.filteredTracks.length;
    if (total === 0) {
      spacer.style.height = '0px';
      this.rowPool.forEach(r => r.style.display = 'none');
      let emptyEl = container.querySelector('.empty-hint');
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.className = 'empty-hint';
        emptyEl.textContent = '暂无匹配歌曲，将音乐放入库文件夹或点击上方添加目录即可自动发现。';
        container.appendChild(emptyEl);
      }
      emptyEl.style.display = 'block';
      this.updateOverlayScrollbar();
      return;
    }

    const emptyEl = container.querySelector('.empty-hint');
    if (emptyEl) emptyEl.style.display = 'none';

    const totalHeight = total * this.ROW_STRIDE;
    spacer.style.height = `${totalHeight}px`;

    this.updateVirtualScroll(true);
    this.updateOverlayScrollbar();
    this.scheduleProgressiveCoverLoad();
  }

  updateVirtualScroll(force = false) {
    const scrollView = document.getElementById('track-list-scroll-view');
    const container = document.getElementById('track-list-container');
    if (!scrollView || !container) return;

    const total = this.filteredTracks.length;
    if (total === 0) return;

    const scrollTop = scrollView.scrollTop;
    const clientHeight = scrollView.clientHeight || 600;

    const startIndex = Math.max(0, Math.floor(scrollTop / this.ROW_STRIDE) - this.BUFFER_ITEMS);
    const endIndex = Math.min(total, Math.ceil((scrollTop + clientHeight) / this.ROW_STRIDE) + this.BUFFER_ITEMS);

    if (!force && startIndex === this.visibleStartIndex && endIndex === this.visibleEndIndex) {
      return;
    }

    this.visibleStartIndex = startIndex;
    this.visibleEndIndex = endIndex;

    // Highlight active letter on vertical alphabet quick navigation bar
    if (this.filteredTracks[startIndex]) {
      const topLetter = this.getTrackInitialLetter(this.filteredTracks[startIndex]);
      this.highlightAlphabetLetter(topLetter);
    }

    const curTrack = this.audioEngine.currentTrack;
    const neededCount = endIndex - startIndex;

    // Reuse or expand row pool without intermediate array allocation
    while (this.rowPool.length < neededCount) {
      const newRow = this.createPoolRow();
      this.rowPool.push(newRow);
      container.appendChild(newRow);
    }

    // Update active pool rows
    for (let i = 0; i < neededCount; i++) {
      const idx = startIndex + i;
      const track = this.filteredTracks[idx];
      if (!track) continue;
      const isCur = curTrack && (curTrack.id === track.id || curTrack.path === track.path);
      const isSelected = this.selectedTrackPaths.has(track.path);
      const row = this.rowPool[i];

      this.updatePoolRow(row, track, idx, isCur, isSelected);
    }

    // Hide surplus rows in pool
    for (let i = neededCount; i < this.rowPool.length; i++) {
      this.rowPool[i].style.display = 'none';
    }

    if (!this.isLibraryScrolling) {
      this.scheduleProgressiveCoverLoad();
    }
  }

  triggerTrackBrushIn() {
    if (!this.rowPool) return;
    this.rowPool.forEach(row => {
      if (row.style.display !== 'none') {
        row.classList.remove('brush-in');
        void row.offsetWidth;
        row.classList.add('brush-in');
      }
    });
    if (this._brushInTimer) clearTimeout(this._brushInTimer);
    this._brushInTimer = setTimeout(() => {
      if (this.rowPool) {
        this.rowPool.forEach(row => row.classList.remove('brush-in'));
      }
      this._brushInTimer = null;
    }, 380);
  }

  // Progressive background cover loader: runs during scroll-idle
  scheduleProgressiveCoverLoad() {
    if (this.isLibraryScrolling) return;
    if (this.coverLoadQueueTimer) {
      clearTimeout(this.coverLoadQueueTimer);
      this.coverLoadQueueTimer = null;
    }
    if (!window.glasswaveAPI || !window.glasswaveAPI.getCoverData) return;
    if (this.visibleStartIndex === -1 || this.visibleEndIndex === -1) return;

    const visibleTracks = this.filteredTracks.slice(this.visibleStartIndex, this.visibleEndIndex);
    const needed = [];
    for (const track of visibleTracks) {
      const targetCover = track.coverPath || track.path;
      if (targetCover && !this.coverCache.has(targetCover) && !this.pendingCoverRequests.has(targetCover)) {
        needed.push({ track, targetCover });
      }
    }

    if (needed.length === 0) return;

    let index = 0;
    const processBatch = () => {
      if (this.isLibraryScrolling) return;

      const batch = needed.slice(index, index + 3);
      index += 3;

      batch.forEach(({ track, targetCover }) => {
        this.pendingCoverRequests.add(targetCover);
        window.glasswaveAPI.getCoverData(targetCover).then(dataUrl => {
          this.pendingCoverRequests.delete(targetCover);
          if (dataUrl) {
            if (this.coverCache.size > 800) {
              const oldestKey = this.coverCache.keys().next().value;
              this.coverCache.delete(oldestKey);
            }
            this.coverCache.set(targetCover, dataUrl);
            if (track.path) this.coverCache.set(track.path, dataUrl);

            // Fast pool lookup without querySelector
            if (!this.isLibraryScrolling) {
              const poolRow = this.rowPool.find(r => r.dataset.trackPath === track.path && r.style.display !== 'none');
              if (poolRow) {
                poolRow._currentCoverSrc = dataUrl;
                if (poolRow._thumbImg) {
                  poolRow._thumbImg.src = dataUrl;
                  poolRow._thumbImg.style.display = 'block';
                }
                if (poolRow._thumbSvg) {
                  poolRow._thumbSvg.style.display = 'none';
                }
              }
            }
          } else {
            this.coverCache.set(targetCover, 'none');
            if (track.path) this.coverCache.set(track.path, 'none');
          }
        }).catch(() => {
          this.pendingCoverRequests.delete(targetCover);
          this.coverCache.set(targetCover, 'none');
        });
      });

      if (index < needed.length && !this.isLibraryScrolling) {
        this.coverLoadQueueTimer = setTimeout(processBatch, 35);
      }
    };

    processBatch();
  }

  loadVisibleCovers(slice) {
    this.scheduleProgressiveCoverLoad();
  }

  evictCoverCache() {
    const MAX_CACHE_SIZE = 600;
    if (this.coverCache.size <= MAX_CACHE_SIZE) return;

    const minIdx = Math.max(0, this.visibleStartIndex - 40);
    const maxIdx = Math.min(this.filteredTracks.length, this.visibleEndIndex + 40);
    const activePaths = new Set();

    for (let i = minIdx; i < maxIdx; i++) {
      const t = this.filteredTracks[i];
      if (t) {
        if (t.coverPath) activePaths.add(t.coverPath);
        if (t.hasCover && t.path) activePaths.add(t.path);
      }
    }

    if (this.audioEngine.currentTrack) {
      if (this.audioEngine.currentTrack.coverPath) activePaths.add(this.audioEngine.currentTrack.coverPath);
      if (this.audioEngine.currentTrack.path) activePaths.add(this.audioEngine.currentTrack.path);
    }

    for (const key of this.coverCache.keys()) {
      if (!activePaths.has(key)) {
        this.coverCache.delete(key);
      }
    }
  }

  highlightCurrentPlayingInList() {
    const rows = document.querySelectorAll('.track-row');
    const cur = this.audioEngine.currentTrack;
    rows.forEach(r => {
      const trackPath = r.dataset.trackPath;
      if (trackPath && cur && trackPath === cur.path) {
        r.classList.add('playing');
      } else {
        r.classList.remove('playing');
      }
    });
  }

  // =========================================================================
  // 12. Context Menu (Player & Library Rows)
  // =========================================================================
  bindContextMenu() {
    const menu = document.getElementById('glass-context-menu');
    const ctxPlay = document.getElementById('ctx-play');
    const ctxPlayNext = document.getElementById('ctx-play-next');
    const ctxAddQueue = document.getElementById('ctx-add-queue');
    const ctxFavorite = document.getElementById('ctx-favorite');
    const ctxFavoriteLabel = document.getElementById('ctx-favorite-label');
    const ctxManageTags = document.getElementById('ctx-manage-tags');
    const ctxInfo = document.getElementById('ctx-info');
    const ctxReveal = document.getElementById('ctx-reveal');
    const ctxRemoveFromCat = document.getElementById('ctx-remove-from-cat');
    const ctxRemoveFromLibrary = document.getElementById('ctx-remove-from-library');
    const ctxDeleteFile = document.getElementById('ctx-delete-file');

    document.addEventListener('click', (e) => {
      if (menu && !menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });

    if (ctxPlay) {
      ctxPlay.onclick = () => {
        if (this.selectedTrackForMenu) this.audioEngine.playNow(this.selectedTrackForMenu);
        menu.style.display = 'none';
      };
    }

    if (ctxPlayNext) {
      ctxPlayNext.onclick = () => {
        if (this.selectedTrackForMenu) this.audioEngine.playNext(this.selectedTrackForMenu);
        menu.style.display = 'none';
      };
    }

    if (ctxAddQueue) {
      ctxAddQueue.onclick = () => {
        if (this.selectedTrackForMenu) this.audioEngine.addToQueue(this.selectedTrackForMenu);
        menu.style.display = 'none';
      };
    }

    if (ctxFavorite) {
      ctxFavorite.onclick = async () => {
        if (this.selectedTrackForMenu && window.glasswaveAPI) {
          const t = this.selectedTrackForMenu;
          const newFav = !t.isFavorite;
          await window.glasswaveAPI.toggleFavorite(t.path, newFav);
          t.isFavorite = newFav;
          this.applyFilterAndSort();
        }
        menu.style.display = 'none';
      };
    }

    if (ctxManageTags) {
      ctxManageTags.onclick = () => {
        if (this.selectedTrackForMenu) {
          const isMulti = this.selectedTrackPaths.has(this.selectedTrackForMenu.path) && this.selectedTrackPaths.size > 1;
          const tracks = isMulti ? this.getSelectedTracks() : [this.selectedTrackForMenu];
          this.openTagModal(tracks);
        }
        menu.style.display = 'none';
      };
    }

    if (ctxInfo) {
      ctxInfo.onclick = () => {
        if (this.selectedTrackForMenu) {
          alert(`【曲目详细信息】\n标题：${this.selectedTrackForMenu.title || '未知'}\n艺术家：${this.selectedTrackForMenu.artist || '未知'}\n专辑：${this.selectedTrackForMenu.album || '未知'}\n格式：${(this.selectedTrackForMenu.format || this.selectedTrackForMenu.audioSpec?.container || 'AUDIO').toUpperCase()}\n时长：${this.formatTime(this.selectedTrackForMenu.duration)}\n路径：${this.selectedTrackForMenu.path}`);
        }
        menu.style.display = 'none';
      };
    }

    if (ctxReveal && window.glasswaveAPI) {
      ctxReveal.onclick = () => {
        if (this.selectedTrackForMenu?.path) {
          window.glasswaveAPI.revealFile(this.selectedTrackForMenu.path);
        }
        menu.style.display = 'none';
      };
    }

    // Level 1: Remove from Current Category
    if (ctxRemoveFromCat && window.glasswaveAPI) {
      ctxRemoveFromCat.onclick = async () => {
        if (this.selectedTrackForMenu && this.currentSubView.startsWith('category:')) {
          const catId = this.currentSubView.split(':')[1];
          const isMulti = this.selectedTrackPaths.has(this.selectedTrackForMenu.path) && this.selectedTrackPaths.size > 1;
          const paths = isMulti ? Array.from(this.selectedTrackPaths) : [this.selectedTrackForMenu.path];

          await window.glasswaveAPI.removeFromCategory(catId, paths);
          await this.loadCategories();
          this.applyFilterAndSort();
          if (isMulti) this.clearSelection();
        }
        menu.style.display = 'none';
      };
    }

    // Level 2: Remove from Library (DB only, safe)
    if (ctxRemoveFromLibrary && window.glasswaveAPI) {
      ctxRemoveFromLibrary.onclick = async () => {
        menu.style.display = 'none';
        if (this.selectedTrackForMenu?.path) {
          const isMulti = this.selectedTrackPaths.has(this.selectedTrackForMenu.path) && this.selectedTrackPaths.size > 1;
          const paths = isMulti ? Array.from(this.selectedTrackPaths) : [this.selectedTrackForMenu.path];

          const msg = isMulti
            ? `确定将选中的 ${paths.length} 首歌曲从音乐库移除吗？`
            : `确定将歌曲《${this.selectedTrackForMenu.title || '该歌曲'}》从音乐库移除吗？`;

          const ok = await this.showGlassConfirm({
            title: '从音乐库移除',
            message: msg,
            subtext: '仅从曲库列表中移出，绝不会删除本地磁盘文件。',
            confirmText: '确认移除',
            danger: true
          });

          if (ok) {
            const updated = await window.glasswaveAPI.batchHideTracks(paths);
            this.removeTracksFromPlayback(paths);
            this.setTracks(updated);
            if (isMulti) this.clearSelection();
          }
        }
        menu.style.display = 'none';
      };
    }

    // Level 3: Delete Local File to Recycle Bin (Physical files)
    if (ctxDeleteFile && window.glasswaveAPI) {
      ctxDeleteFile.onclick = async () => {
        menu.style.display = 'none';
        if (this.selectedTrackForMenu?.path) {
          const isMulti = this.selectedTrackPaths.has(this.selectedTrackForMenu.path) && this.selectedTrackPaths.size > 1;
          const paths = isMulti ? Array.from(this.selectedTrackPaths) : [this.selectedTrackForMenu.path];

          const msg = isMulti
            ? `确定要将选中的 ${paths.length} 个本地音频文件移入系统回收站吗？`
            : `确定要将本地音频文件《${this.selectedTrackForMenu.title || '该歌曲'}》移入系统回收站吗？`;

          const ok = await this.showGlassConfirm({
            title: '移至系统回收站',
            message: msg,
            subtext: '高危操作：此操作将对磁盘物理文件生效！',
            confirmText: '删除文件',
            danger: true
          });

          if (ok) {
            await this.deleteTracksSafely(paths);
            if (isMulti) this.clearSelection();
          }
        }
        menu.style.display = 'none';
      };
    }
  }

  bindCenterStageContextMenu() {
    const deck = document.getElementById('parallax-deck');
    if (deck) {
      deck.addEventListener('contextmenu', (e) => {
        if (this.audioEngine.currentTrack) {
          e.preventDefault();
          this.openContextMenu(this.audioEngine.currentTrack, e.clientX, e.clientY);
        }
      });
    }
  }

  openContextMenu(track, clientX, clientY) {
    const menu = document.getElementById('glass-context-menu');
    if (!menu) return;
    this.selectedTrackForMenu = track;

    const isMulti = this.selectedTrackPaths.has(track.path) && this.selectedTrackPaths.size > 1;
    const count = isMulti ? this.selectedTrackPaths.size : 1;

    // Toggle favorite label in context menu
    const favLabel = document.getElementById('ctx-favorite-label');
    if (favLabel) favLabel.textContent = track.isFavorite ? '取消收藏' : '收藏歌曲';

    // Show/hide and label "从当前分类移除"
    const btnRemoveCat = document.getElementById('ctx-remove-from-cat');
    const labelRemoveCat = document.getElementById('ctx-remove-cat-label');
    if (btnRemoveCat) {
      btnRemoveCat.style.display = this.currentSubView.startsWith('category:') ? 'flex' : 'none';
      if (labelRemoveCat) {
        labelRemoveCat.textContent = isMulti ? `从当前分类移除 (${count} 首)` : '从当前分类移除';
      }
    }

    // Label "从音乐库移除"
    const labelRemoveLib = document.getElementById('ctx-remove-lib-label');
    if (labelRemoveLib) {
      labelRemoveLib.textContent = isMulti ? `从音乐库移除 (${count} 首)` : '从音乐库移除';
    }

    // Label "删除本地文件"
    const labelDeleteFile = document.getElementById('ctx-delete-file-label');
    if (labelDeleteFile) {
      labelDeleteFile.textContent = isMulti ? `删除 ${count} 个本地文件` : '删除本地文件';
    }

    // Populate category submenu dynamically
    const submenu = document.getElementById('ctx-category-submenu');
    const catParent = document.getElementById('ctx-category-parent');
    if (submenu) {
      submenu.innerHTML = '';
      if (this.categories.length === 0) {
        submenu.innerHTML = '<div style="font-size:12px; color:var(--text-dim); padding:4px 8px;">无可用分类</div>';
      } else {
        (this.categoryGroups || []).forEach(group => {
          const groupLabel = document.createElement('div');
          groupLabel.className = 'category-submenu-group';
          groupLabel.textContent = group.name;
          submenu.appendChild(groupLabel);
          this.categories.filter(cat => cat.groupId === group.id).forEach(cat => {
          const iconIdx = (typeof cat.iconIndex === 'number' && cat.iconIndex >= 0) ? (cat.iconIndex % CATEGORY_ICONS.length) : 0;
          const curIcon = CATEGORY_ICONS[iconIdx];
          const item = document.createElement('div');
          item.className = 'menu-item category-submenu-child';
          item.innerHTML = `<span style="display:flex;align-items:center;gap:8px;"><span style="width:15px;height:15px;color:var(--accent-primary);display:inline-flex;align-items:center;flex-shrink:0;">${curIcon.svg}</span><span>${escapeHtml(cat.name)}</span></span>`;
          item.onclick = async (ev) => {
            ev.stopPropagation();
            menu.style.display = 'none';
            let paths = [track.path];
            if (this.selectedTrackPaths.has(track.path)) {
              paths = Array.from(this.selectedTrackPaths);
            }
            paths = [...new Set(paths)].filter(p => this.allTracks.some(t => t.path === p));
            const updated = await window.glasswaveAPI.moveToCategory(cat.id, paths);
            await this.loadCategories();
            this.setTracks(updated);
            this.clearSelection();
            this.showToast(`已移到【${group.name} / ${cat.name}】，所有歌曲及原文件保持不变`);
          };
          submenu.appendChild(item);
          });
        });
      }

      // Add "+ 新建分类" item
      const itemNew = document.createElement('div');
      itemNew.className = 'menu-item';
      itemNew.innerHTML = '<span><svg style="width:14px;height:14px;vertical-align:-2px;margin-right:6px;fill:none;stroke:currentColor;stroke-width:1.8;" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>新建分类...</span>';
      itemNew.onclick = (ev) => {
        ev.stopPropagation();
        menu.style.display = 'none';
        this.openCategoryModal(null, '', this.categoryGroups?.length ? 'category' : 'group', this.categoryGroups?.[0]?.id);
      };
      submenu.appendChild(itemNew);

      // Stable mouse bridge and hover grace timer to fix disappearing submenu gap
      if (catParent && !catParent._hasBoundGraceHover) {
        catParent._hasBoundGraceHover = true;
        let subGraceTimer = null;
        const activateSub = () => {
          if (subGraceTimer) { clearTimeout(subGraceTimer); subGraceTimer = null; }
          catParent.classList.add('is-active');
          const pRect = catParent.getBoundingClientRect();
          if (pRect.right + 230 > window.innerWidth) {
            submenu.classList.add('flip-left');
          } else {
            submenu.classList.remove('flip-left');
          }
          submenu.style.top = '-4px';
          const subRect = submenu.getBoundingClientRect();
          submenu.style.top = `${-4 + Math.min(0, window.innerHeight - subRect.bottom - 10)}px`;
        };
        const deactivateSub = () => {
          if (subGraceTimer) clearTimeout(subGraceTimer);
          subGraceTimer = setTimeout(() => {
            catParent.classList.remove('is-active');
            subGraceTimer = null;
          }, 350);
        };
        catParent.addEventListener('mouseenter', activateSub);
        catParent.addEventListener('mouseleave', deactivateSub);
        submenu.addEventListener('mouseenter', activateSub);
        submenu.addEventListener('mouseleave', deactivateSub);
      }
    }


    menu.style.display = 'block';

    this.placeMenuInViewport(menu, clientX, clientY);
  }

  placeMenuInViewport(menu, x, y) {
    menu.style.left = '0px';
    menu.style.top = '0px';
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - height - 8))}px`;
  }

  // =========================================================================
  // Category Right-Click Context Menu & Theme Switcher (Requirements 2 & 4)
  // =========================================================================
  bindCategoryContextMenu() {
    const menu = document.getElementById('category-context-menu');
    if (!menu) return;

    window.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        menu.style.display = 'none';
      }
    });

    const btnAddChild = document.getElementById('cat-ctx-add-child');
    if (btnAddChild) btnAddChild.onclick = () => {
      menu.style.display = 'none';
      if (this.selectedCategoryForMenu && this.categoryContextIsGroup) {
        this.openCategoryModal(null, '', 'category', this.selectedCategoryForMenu.id);
      }
    };

    const btnPlay = document.getElementById('cat-ctx-play');
    if (btnPlay) {
      btnPlay.onclick = () => {
        menu.style.display = 'none';
        if (this.selectedCategoryForMenu) {
          this.playCategory(this.selectedCategoryForMenu);
        }
      };
    }

    const btnAddQueue = document.getElementById('cat-ctx-add-queue');
    if (btnAddQueue) {
      btnAddQueue.onclick = () => {
        menu.style.display = 'none';
        if (this.selectedCategoryForMenu) {
          this.addCategoryToQueue(this.selectedCategoryForMenu);
        }
      };
    }

    const btnRename = document.getElementById('cat-ctx-rename');
    if (btnRename) {
      btnRename.onclick = () => {
        menu.style.display = 'none';
        if (this.selectedCategoryForMenu) {
          this.openCategoryModal(this.selectedCategoryForMenu.id, this.selectedCategoryForMenu.name,
            this.categoryContextIsGroup ? 'group' : 'category', this.selectedCategoryForMenu.groupId);
        }
      };
    }

    const btnClearTracks = document.getElementById('cat-ctx-clear-tracks');
    if (btnClearTracks) {
      btnClearTracks.onclick = async () => {
        menu.style.display = 'none';
        if (this.selectedCategoryForMenu && !this.categoryContextIsGroup) {
          const cat = this.selectedCategoryForMenu;
          const ok = await this.showGlassConfirm({
            title: '清空分类歌曲',
            message: `确定清空分类【${cat.name}】中的全部歌曲吗？`,
            subtext: '仅解除分类关联，歌曲保留在本地和曲库中。',
            confirmText: '确认清空',
            danger: true
          });
          if (ok) {
            await window.glasswaveAPI.removeFromCategory(cat.id, cat.trackPaths || []);
            await this.loadCategories();
            this.applyFilterAndSort();
          }
        }
      };
    }

    const btnDelete = document.getElementById('cat-ctx-delete');
    if (btnDelete) {
      btnDelete.onclick = async () => {
        menu.style.display = 'none';
        if (this.selectedCategoryForMenu) {
          const cat = this.selectedCategoryForMenu;
          const ok = await this.showGlassConfirm({
            title: '删除分类',
            message: `确定删除分类【${cat.name}】吗？`,
            subtext: '分类下的歌曲不会从本地磁盘或曲库中删除。',
            confirmText: '确认删除',
            danger: true
          });
          if (ok) {
            if (this.categoryContextIsGroup) {
              const childCount = this.categories.filter(c => c.groupId === cat.id).length;
              const secondOk = await this.showGlassConfirm({
                title: '再次确认删除一级分类',
                message: `将删除【${cat.name}】及其 ${childCount} 个二级分类。确定继续吗？`,
                subtext: '歌曲文件与曲库中的歌曲均保留。',
                confirmText: '删除一级及二级分类',
                danger: true
              });
              if (!secondOk) return;
              await window.glasswaveAPI.deleteCategoryGroup(cat.id);
            } else {
              await window.glasswaveAPI.deleteCategory(cat.id);
            }
            if (this.categoryContextIsGroup || this.currentSubView === `category:${cat.id}`) {
              this.switchView('library', 'all');
            }
            await this.loadCategories();
            this.setTracks(await window.glasswaveAPI.getTracks());
          }
        }
      };
    }
  }

  openCategoryContextMenu(cat, clientX, clientY, isGroup = false) {
    const menu = document.getElementById('category-context-menu');
    if (!menu) return;
    this.selectedCategoryForMenu = cat;
    this.categoryContextIsGroup = isGroup;
    for (const id of ['cat-ctx-play', 'cat-ctx-add-queue', 'cat-ctx-clear-tracks']) {
      const el = document.getElementById(id);
      if (el) el.style.display = isGroup ? 'none' : 'flex';
    }
    const addChild = document.getElementById('cat-ctx-add-child');
    if (addChild) addChild.style.display = isGroup ? 'flex' : 'none';

    // Close any other open context menus
    const trackMenu = document.getElementById('glass-context-menu');
    if (trackMenu) trackMenu.style.display = 'none';

    menu.style.display = 'block';

    this.placeMenuInViewport(menu, clientX, clientY);
  }

  playCategory(catOrId) {
    const cat = typeof catOrId === 'string' ? this.categories.find(c => c.id === catOrId) : catOrId;
    if (!cat) return;
    const catTracks = this.allTracks.filter(t => (cat.trackPaths || []).includes(t.path));
    if (!catTracks.length) {
      this.showToast(`分类【${cat.name}】中暂无歌曲`);
      return;
    }
    this.audioEngine.setQueue(catTracks, 0, { type: 'category', categoryId: cat.id });
    this.audioEngine.loadTrack(catTracks[0], true);
    this.renderQueue();
  }

  addCategoryToQueue(cat) {
    if (!cat || !cat.trackPaths || cat.trackPaths.length === 0) return;
    const catTracks = this.allTracks.filter(t => cat.trackPaths.includes(t.path));
    if (catTracks.length > 0) {
      catTracks.forEach(track => this.audioEngine.addToQueue(track));
      this.renderQueue();
    }
  }

  renderThemePresets() {
    const grid = document.getElementById('theme-preset-grid');
    if (!grid || !this.colorEngine) return;

    grid.innerHTML = '';
    const themes = ColorEngine.THEMES || {};
    const activeKey = this.colorEngine.currentThemeKey || 'aurora';

    Object.entries(themes).forEach(([key, theme]) => {
      const card = document.createElement('div');
      card.className = `theme-card ${key === activeKey ? 'active' : ''}`;
      card.dataset.themeKey = key;
      card.title = `${theme.name} - ${theme.subtitle}`;
      card.innerHTML = `
        <div class="theme-swatch" style="background: ${theme.preview};"></div>
        <div class="theme-title">${escapeHtml(theme.name)}</div>
      `;

      card.onclick = () => {
        this.colorEngine.setTheme(key);
        grid.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // Automatically sync matched minimalist pure background color while keeping theme luminous orbs
        const matchedPure = this.colorEngine.getThemeMatchingPureColor(key);
        if (matchedPure) {
          this.colorEngine.setPureColor(matchedPure.hex, matchedPure.name, true, true);
          window.GlassWaveTheme?.setBackground(matchedPure.hex);
          this.updatePureColorSelection(matchedPure.hex);
        }
      };

      grid.appendChild(card);
    });
  }

  updatePureColorSelection(hex) {
    const grid = document.getElementById('pure-color-dense-grid');
    const btnReset = document.getElementById('btn-reset-pure-color');
    if (grid && hex) {
      grid.querySelectorAll('.pure-color-swatch').forEach(s => {
        const isMatch = s.dataset.hex && s.dataset.hex.toLowerCase() === hex.toLowerCase();
        s.classList.toggle('active', isMatch);
        if (isMatch) {
          s.classList.remove('swatch-bounce');
          void s.offsetWidth; // trigger reflow
          s.classList.add('swatch-bounce');
        }
      });
    }
    if (btnReset) {
      btnReset.style.display = 'inline-block';
    }
  }

  // 24 Minimalist Pure Color Palette Renderer & Interactions (Requirement: 纯色效果，小一点，密集排列，至少20种)
  renderPureColors() {
    const grid = document.getElementById('pure-color-dense-grid');
    const btnReset = document.getElementById('btn-reset-pure-color');
    if (!grid || !this.colorEngine) return;

    grid.innerHTML = '';
    const colors = ColorEngine.PURE_COLORS || [];
    const activePure = this.colorEngine.activePureColor;

    colors.forEach(c => {
      const swatch = document.createElement('div');
      const isActive = activePure && activePure.hex.toLowerCase() === c.hex.toLowerCase();
      swatch.className = `pure-color-swatch ${isActive ? 'active' : ''}`;
      swatch.style.background = c.hex;
      swatch.dataset.hex = c.hex;
      swatch.title = `${c.name} (${c.hex})`;

      swatch.onclick = () => {
        this.colorEngine.setPureColor(c.hex, c.name);
        window.GlassWaveTheme?.setBackground(c.hex);
        this.updatePureColorSelection(c.hex);
      };

      grid.appendChild(swatch);
    });

    if (btnReset) {
      btnReset.style.display = activePure ? 'inline-block' : 'none';
      btnReset.onclick = () => {
        this.colorEngine.clearPureColor();
        window.GlassWaveTheme?.setBackground("#080c16");
        grid.querySelectorAll('.pure-color-swatch').forEach(s => s.classList.remove('active', 'swatch-bounce'));
        btnReset.style.display = 'none';
      };
    }
  }

  // Ambient Glow Master Switch, Monochrome / Multi Mode & Dynamic Orbs Controls (Requirement: 炫光变单色/关闭、光球自定义)
  bindAmbientGlowControls() {
    if (!this.colorEngine) return;

    const chkEnabled = document.getElementById('setting-glow-enabled');
    const btnMono = document.getElementById('btn-glow-mono');
    const btnMulti = document.getElementById('btn-glow-multi');
    const blobBtns = document.querySelectorAll('.blob-count-btn');
    const lblBlobCount = document.getElementById('lbl-glow-blob-count');
    const sliderSpeed = document.getElementById('setting-glow-speed');
    const lblSpeed = document.getElementById('lbl-glow-speed');
    const sliderIntensity = document.getElementById('setting-glow-intensity');
    const lblIntensity = document.getElementById('lbl-glow-intensity');

    // 1. Master toggle (关闭/开启背景炫光)
    if (chkEnabled) {
      chkEnabled.checked = this.colorEngine.glowEnabled !== false;
      chkEnabled.onchange = (e) => {
        this.colorEngine.setGlowEnabled(e.target.checked);
      };
    }

    // 2. Monochrome vs Multicolor mode (炫光变单色 / 全彩)
    if (btnMono && btnMulti) {
      const updateModeButtons = (mode) => {
        btnMono.classList.toggle('active', mode === 'mono');
        btnMulti.classList.toggle('active', mode === 'multi');
      };
      updateModeButtons(this.colorEngine.glowMode || 'multi');

      btnMono.onclick = () => {
        this.colorEngine.setGlowMode('mono');
        updateModeButtons('mono');
      };
      btnMulti.onclick = () => {
        this.colorEngine.setGlowMode('multi');
        updateModeButtons('multi');
      };
    }

    // 3. Dynamic Glow Orbs Count (2 / 4 / 6 blobs)
    if (blobBtns.length > 0) {
      const curCount = this.colorEngine.blobCount || 4;
      blobBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.count, 10) === curCount);
        btn.onclick = () => {
          const count = parseInt(btn.dataset.count, 10);
          this.colorEngine.setBlobCount(count);
          blobBtns.forEach(b => b.classList.toggle('active', b === btn));
          if (lblBlobCount) {
            const labelMap = { 2: '2 个 (极简)', 4: '4 个 (标准)', 6: '6 个 (丰富)' };
            lblBlobCount.textContent = labelMap[count] || `${count} 个`;
          }
        };
      });
    }

    // 4. Dynamic Glow Speed & Static Mode
    if (sliderSpeed) {
      sliderSpeed.value = this.colorEngine.speedMultiplier !== undefined ? this.colorEngine.speedMultiplier : 1.0;
      const updateSpeedLabel = (val) => {
        if (!lblSpeed) return;
        if (val <= 0.05) lblSpeed.textContent = '0.0x (静止晕光)';
        else lblSpeed.textContent = `${Number(val).toFixed(1)}x (${val < 0.8 ? '慢速' : val > 1.4 ? '快速' : '流动'})`;
      };
      updateSpeedLabel(sliderSpeed.value);

      sliderSpeed.oninput = (e) => {
        const val = parseFloat(e.target.value);
        this.colorEngine.setSpeedMultiplier(val);
        updateSpeedLabel(val);
      };
    }

    // 5. Dynamic Glow Intensity / Brightness
    if (sliderIntensity) {
      sliderIntensity.value = this.colorEngine.intensityMultiplier !== undefined ? this.colorEngine.intensityMultiplier : 1.0;
      if (lblIntensity) lblIntensity.textContent = `${Math.round(sliderIntensity.value * 100)}%`;

      sliderIntensity.oninput = (e) => {
        const val = parseFloat(e.target.value);
        this.colorEngine.setIntensityMultiplier(val);
        if (lblIntensity) lblIntensity.textContent = `${Math.round(val * 100)}%`;
      };
    }
  }

  // =========================================================================
  // 12b. User Custom Skin Presets (Supports 8+ Presets with Custom Naming)
  // =========================================================================
  getSavedPresets() {
    try {
      const raw = localStorage.getItem('glasswave_user_presets');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    // Seed with 4 diverse default presets so user immediately has starter templates
    const initial = [
      {
        id: 'preset_default_1',
        name: '极光流光 (Aurora)',
        themeKey: 'aurora',
        customBg: null,
        bgBlur: 14,
        bgOpacity: 0.72,
        visMode: 'wave',
        visPos: 'behind',
        visOffsetY: 0,
        visScale: 1.25,
        createdAt: 1
      },
      {
        id: 'preset_default_2',
        name: '曜石翠境 (Cyber Emerald)',
        themeKey: 'emerald',
        customBg: null,
        bgBlur: 16,
        bgOpacity: 0.85,
        visMode: 'sphere',
        visPos: 'behind',
        visOffsetY: 0,
        visScale: 1.35,
        createdAt: 2
      },
      {
        id: 'preset_default_3',
        name: '霓虹暮光 (Twilight Bars)',
        themeKey: 'twilight',
        customBg: null,
        bgBlur: 10,
        bgOpacity: 0.65,
        visMode: 'bars',
        visPos: 'below',
        visOffsetY: 0,
        visScale: 1.20,
        createdAt: 3
      },
      {
        id: 'preset_default_4',
        name: '炽焰琥珀 (Warm Amber Star)',
        themeKey: 'amber',
        customBg: null,
        bgBlur: 12,
        bgOpacity: 0.75,
        visMode: 'orb',
        visPos: 'behind',
        visOffsetY: 0,
        visScale: 1.40,
        createdAt: 4
      }
    ];

    try {
      localStorage.setItem('glasswave_user_presets', JSON.stringify(initial));
    } catch (e) {}
    return initial;
  }

  renderCustomPresets() {
    const grid = document.getElementById('custom-preset-grid');
    if (!grid) return;

    grid.innerHTML = '';
    const allPresets = this.getSavedPresets();
    const count = document.getElementById('skin-preset-count'); if (count) count.textContent = `已保存 ${allPresets.length} 个`;
    const query = (document.getElementById('skin-search')?.value || '').trim().toLocaleLowerCase();
    const presets = allPresets.filter(p => String(p.name || '').toLocaleLowerCase().includes(query));

    if (presets.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 22px; text-align: center; color: var(--text-dim); font-size: 13px; background: rgba(255,255,255,0.02); border-radius: 10px; border: 1px dashed rgba(255,255,255,0.08);">
          ${query ? '没有找到匹配的皮肤' : '暂无自定义皮肤，点击「保存当前」添加。'}
        </div>
      `;
      return;
    }

    const visNames = { wave: '波形', spectrum: '环形', sphere: '球形', bars: '柱谱', orb: '粒子', ambient: '流光', reactive: '律动线', curtain: '光幕' };
    const posNames = { behind: '封面后方', below: '封面下方', center: '屏幕中心' };

    presets.forEach(p => {
      const card = document.createElement('div');
      card.className = 'custom-preset-card';
      card.dataset.presetId = p.id;
      card.classList.toggle('active', localStorage.getItem('glasswave_selected_skin') === p.id);

      const theme = (ColorEngine.THEMES && ColorEngine.THEMES[p.themeKey]) || { name: p.themeKey || '自定义配色', preview: 'linear-gradient(135deg, #1c375a 0%, #581c6e 100%)' };
      const blurInfo = `磨砂 ${p.bgBlur !== undefined ? p.bgBlur : 14}px`;
      const opInfo = `透明度 ${Math.round((p.bgOpacity !== undefined ? p.bgOpacity : 0.72) * 100)}%`;
      const visInfo = visNames[p.visMode] || '波形';
      const posInfo = posNames[p.visPos] || '封面后方';
      const bgInfo = p.customBg ? '含自定壁纸' : '纯净动态流光';

      card.innerHTML = `
        <div class="preset-card-top">
          <div class="preset-swatch" style="background: ${theme.preview};"></div>
          <div class="preset-name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
        </div>
        <div class="preset-meta-tags">
          <span class="preset-tag" style="color:var(--accent-primary); border-color:rgba(138,196,255,0.2);">${escapeHtml(theme.name)}</span>
          <span class="preset-tag">${blurInfo}</span>
          <span class="preset-tag">${visInfo} (${posInfo})</span>
          <span class="preset-tag">${bgInfo}</span>
        </div>
        <div class="preset-card-actions">
          <button class="glass-pill-btn btn-apply-preset" title="一键应用此预设">一键应用</button>
          <details class="skin-card-more"><summary aria-label="皮肤操作" title="更多操作">⋯</summary><button class="btn-delete-preset" title="删除此预设">删除预设</button></details>
        </div>
      `;

      const preview = document.createElement('button');
      preview.className = 'preset-image-preview';
      preview.title = '应用此皮肤';
      preview.style.background = theme.preview;
      const bg = p.fullSkin?.settings?.glasswave_custom_bg || p.customBg;
      if (bg) {
        const image = document.createElement('img'); image.alt = p.name + '背景预览'; image.draggable = false; image.loading = 'lazy';
        image.src = /^(data:|file:)/.test(bg) ? bg : 'file:///' + bg.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
        image.onerror = () => { image.remove(); preview.textContent = '图片暂不可用'; };
        preview.appendChild(image);
      } else { preview.textContent = '动态配色'; }
      preview.onclick = () => this.applyCustomPreset(p);
      card.prepend(preview);
      if (p.fullSkin) {
        const badge = document.createElement('span'); badge.className = 'preset-tag'; badge.textContent = '完整外观 · 含透明度与动态参数';
        card.querySelector('.preset-meta-tags').appendChild(badge);
      }
      card.querySelector('.btn-apply-preset').onclick = () => this.applyCustomPreset(p);
      card.querySelector('.btn-delete-preset').onclick = async (e) => {
        e.stopPropagation();
        const ok = await this.showGlassConfirm({
          title: '删除皮肤预设',
          message: `确定要删除自定预设「${p.name}」吗？`,
          subtext: '仅删除此预设配置条目，不会对您的歌曲库或本地图片产生任何影响。',
          confirmText: '确认删除',
          danger: true
        });
        if (ok) {
          this.deleteCustomPreset(p.id);
        }
      };

      grid.appendChild(card);
    });
  }

  bindCustomPresetActions() {
    const btnSave = document.getElementById('btn-save-custom-preset');
    const modal = document.getElementById('modal-save-preset');
    const input = document.getElementById('input-preset-name');
    const btnCancel = document.getElementById('btn-cancel-save-preset');
    const btnConfirm = document.getElementById('btn-confirm-save-preset');

    if (!btnSave || !modal) return;

    const closeModal = () => {
      modal.dataset.open = 'false';
      modal.classList.remove('active');
      setTimeout(() => { if (modal.dataset.open !== 'true') modal.style.display = 'none'; }, 200);
      document.removeEventListener('keydown', onKeyDown);
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'Enter') {
        if (input && input.value.trim()) {
          doSave();
        }
      }
    };

    const doSave = async () => {
      if (btnConfirm.disabled) return;
      const name = input ? input.value.trim() : '';
      if (!name) return;
      btnConfirm.disabled = true;
      try { await this.saveCurrentAsPreset(name); closeModal(); } catch (e) { alert(e.message); } finally { btnConfirm.disabled = false; }
    };

    btnSave.onclick = () => {
      const presets = this.getSavedPresets();
      if (input) {
        input.value = `我的预设 ${presets.length + 1}`;
      }
      modal.dataset.open = 'true';
      modal.style.display = 'flex';
      requestAnimationFrame(() => {
        if (modal.dataset.open !== 'true') return;
        modal.classList.add('active');
        if (input) {
          input.focus();
          input.select();
        }
      });
      document.addEventListener('keydown', onKeyDown);
    };

    if (btnCancel) btnCancel.onclick = closeModal;
    if (btnConfirm) btnConfirm.onclick = doSave;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  async saveCurrentAsPreset(name) {
    if (!name || !name.trim()) return;
    const finalName = name.trim();

    let presets = this.getSavedPresets();
    const currentBg = localStorage.getItem('glasswave_custom_bg') || null;
    const blurVal = Number(localStorage.getItem('glasswave_bg_blur') ?? 14);
    const opacityVal = Number(localStorage.getItem('glasswave_bg_opacity') ?? 0.72);
    const posYVal = Number(localStorage.getItem('glasswave_bg_pos_y') ?? 50);
    const posXVal = Number(localStorage.getItem('glasswave_bg_pos_x') ?? 50);
    const rotateVal = Number(localStorage.getItem('glasswave_bg_rotate') ?? 0);
    const pureVal = localStorage.getItem('glasswave_bg_pure_mode') === 'true';
    const themeKey = this.colorEngine ? this.colorEngine.currentThemeKey : 'aurora';
    const visMode = this.visualizer ? this.visualizer.mode : 'wave';
    const visPos = this.visualizer ? this.visualizer.positionPreset : 'behind';
    const visOffsetY = this.visualizer ? this.visualizer.offsetY : 0;
    const visScale = this.visualizer ? this.visualizer.visScale : 1.25;

    const newPreset = {
      fullSkin: window.GlassWaveSkin?.capture(this, false),
      id: 'preset_' + Date.now(),
      name: finalName,
      themeKey,
      customBg: currentBg,
      bgBlur: blurVal,
      bgOpacity: opacityVal,
      bgPosY: posYVal,
      bgPosX: posXVal,
      bgZoom: Number(localStorage.getItem('glasswave_bg_zoom') ?? 100),
      bgRotate: rotateVal,
      bgPureMode: pureVal,
      visMode,
      visPos,
      visOffsetY,
      visScale,
      createdAt: Date.now()
    };

    const cached = await window.glasswaveAPI.cacheSkin(newPreset.fullSkin);
    if (cached.error) throw Error(cached.error);
    newPreset.fullSkin = cached.data;
    newPreset.customBg = cached.data.settings.glasswave_custom_bg || null;
    presets.unshift(newPreset);
    try {
      localStorage.setItem('glasswave_user_presets', JSON.stringify(presets));
    } catch (e) {
      throw Error('预设保存失败：' + e.message);
    }

    this.renderCustomPresets();
  }

  deleteCustomPreset(id) {
    let presets = this.getSavedPresets();
    presets = presets.filter(p => p.id !== id);
    try {
      localStorage.setItem('glasswave_user_presets', JSON.stringify(presets));
    } catch (e) {}
    this.renderCustomPresets();
  }

  async applyCustomPreset(p) {
    if (!p) return false;
    const previousId = localStorage.getItem('glasswave_selected_skin');
    localStorage.setItem('glasswave_selected_skin', p.id);
    this.renderCustomPresets();
    if (p.fullSkin) {
      try {
        await window.GlassWaveSkin.apply(p.fullSkin);
        return true;
      } catch (e) {
        if (previousId) localStorage.setItem('glasswave_selected_skin', previousId);
        else localStorage.removeItem('glasswave_selected_skin');
        this.renderCustomPresets();
        alert(e.message);
        return false;
      }
    }

    // 1. Theme Color
    if (p.themeKey && this.colorEngine) {
      this.colorEngine.setTheme(p.themeKey);
      const themeCards = document.querySelectorAll('#theme-preset-grid .theme-card');
      themeCards.forEach(c => c.classList.toggle('active', c.dataset.themeKey === p.themeKey));
    }

    // 2. Wallpaper & Blur, Opacity, Position, Pure Mode
    if (p.customBg) {
      this.applyCustomWallpaper(p.customBg, true);
    } else {
      this.resetCustomWallpaper();
    }

    const blurVal = p.bgBlur !== undefined ? p.bgBlur : 14;
    const opacityVal = p.bgOpacity !== undefined ? p.bgOpacity : 0.72;
    const posYVal = p.bgPosY !== undefined ? p.bgPosY : 50;
    const posXVal = p.bgPosX !== undefined ? p.bgPosX : 50;
    const zoomVal = p.bgZoom !== undefined ? p.bgZoom : 100;
    const rotateVal = p.bgRotate !== undefined ? p.bgRotate : 0;
    const pureRatioVal = typeof p.bgPureRatio === 'number' ? p.bgPureRatio : (p.bgPureMode ? 100 : 0);
    const tintVal = typeof p.bgTintDegree === 'number' ? p.bgTintDegree : (typeof p.bgPureRatio === 'number' ? (100 - p.bgPureRatio) : 0);

    this.updateWallpaperBlur(blurVal);
    this.updateWallpaperOpacity(opacityVal);
    this.updateWallpaperPosY(posYVal);
    this.updateWallpaperPosX(posXVal);
    this.updateWallpaperZoom(zoomVal);
    this.updateWallpaperRotation(rotateVal);
    this.updateWallpaperPureRatio(pureRatioVal);
    this.updateWallpaperTintDegree(tintVal);

    const blurSlider = document.getElementById('setting-bg-blur');
    if (blurSlider) blurSlider.value = blurVal;
    const opacitySlider = document.getElementById('setting-bg-opacity');
    if (opacitySlider) opacitySlider.value = opacityVal;
    const posSlider = document.getElementById('setting-bg-pos-y');
    if (posSlider) posSlider.value = posYVal;
    const posXSlider = document.getElementById('setting-bg-pos-x');
    if (posXSlider) posXSlider.value = posXVal;
    const zoomSlider = document.getElementById('setting-bg-zoom');
    if (zoomSlider) zoomSlider.value = zoomVal;
    const pureSlider = document.getElementById('setting-bg-pure-ratio');
    if (pureSlider) pureSlider.value = pureRatioVal;
    const tintSlider = document.getElementById('setting-bg-tint-degree');
    if (tintSlider) tintSlider.value = tintVal;

    try {
      localStorage.setItem('glasswave_bg_blur', blurVal);
      localStorage.setItem('glasswave_bg_opacity', opacityVal);
      localStorage.setItem('glasswave_bg_pos_y', posYVal);
      localStorage.setItem('glasswave_bg_pos_x', posXVal);
      localStorage.setItem('glasswave_bg_zoom', zoomVal);
      localStorage.setItem('glasswave_bg_rotate', rotateVal);
      localStorage.setItem('glasswave_bg_pure_ratio', pureRatioVal);
      localStorage.setItem('glasswave_bg_pure_mode', pureRatioVal > 0 ? 'true' : 'false');
    } catch (e) {}


    // 3. Visualizer mode, position & scale
    if (this.visualizer) {
      if (p.visMode) {
        this.switchVisualizerMode(p.visMode);
        this.selectVisualizerTuneMode?.(p.visMode, false);
      }
      if (p.visPos) {
        this.visualizer.setPositionPreset(p.visPos);
        document.querySelectorAll('.vis-pos-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === p.visPos));
      }
      if (p.visOffsetY !== undefined) {
        this.visualizer.setOffsetY(p.visOffsetY);
        const ySlider = document.getElementById('setting-vis-offset-y');
        const yLbl = document.getElementById('lbl-vis-offset-y');
        if (ySlider) ySlider.value = p.visOffsetY;
        if (yLbl) yLbl.textContent = `${p.visOffsetY > 0 ? '+' : ''}${p.visOffsetY}px`;
      }
      if (p.visScale !== undefined) {
        this.visualizer.setScale(p.visScale);
        const sSlider = document.getElementById('setting-vis-scale');
        const sLbl = document.getElementById('lbl-vis-scale');
        if (sSlider) sSlider.value = p.visScale;
        if (sLbl) sLbl.textContent = `${p.visScale}x`;
      }
      this.saveVisualizerModeControls({
        intensity: this.visualizer.intensity,
        position: this.visualizer.positionPreset,
        offsetY: this.visualizer.offsetY,
        scale: this.visualizer.visScale
      });
    }

    // Highlight card
    const cards = document.querySelectorAll('.custom-preset-card');
    cards.forEach(c => c.classList.toggle('active', c.dataset.presetId === p.id));
    return true;
  }

  // =========================================================================
  // 13. Metadata Inspector & Track View Updates
  // =========================================================================
  removeTracksFromPlayback(paths, resumePlaying=this.audioEngine.isPlaying) {
    const e=this.audioEngine, current=e.currentTrack, playing=resumePlaying;
    e.playbackQueue=e.playbackQueue.filter(t=>!paths.includes(t.path));
    if(paths.includes(current?.path)) {
      e.pause();e.audio.removeAttribute('src');e.audio.load();e.currentTrack=null;
      e.queueIndex=e.playbackQueue.length?0:-1;
      if(e.playbackQueue.length) e.loadTrack(e.playbackQueue[0],playing);
      else { this.updateTrackView({title:'暂无曲目',artist:'选择音乐开始播放',album:'',path:''}); }
    } else e.queueIndex=e.playbackQueue.findIndex(t=>t.path===current?.path);
    if(e.onQueueChange) e.onQueueChange(e.playbackQueue);
  }

  async deleteTracksSafely(paths) {
    const e=this.audioEngine,current=e.currentTrack,playing=e.isPlaying,time=e.audio.currentTime;
    const detached=paths.includes(current?.path);
    if(detached) { e.pause();e.audio.removeAttribute('src');e.audio.load(); }
    const res=await window.glasswaveAPI.batchDeleteFiles(paths);
    this.removeTracksFromPlayback(res.deletedPaths || [],playing);
    this.setTracks(res.tracks);
    if(detached && !(res.deletedPaths || []).includes(current.path)) {
      await e.loadTrack(current,playing);e.audio.currentTime=time;
    }
    if(!res.success) this.showToast('部分文件未删除：'+res.error);
    return res;
  }

  updateTrackView(track) {
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const trackAlbum = document.getElementById('track-album');
    const currentCover = document.getElementById('current-cover');
    const defaultCover = document.getElementById('default-cover');

    const miniTitle = document.getElementById('mini-title');
    const miniArtist = document.getElementById('mini-artist');
    const miniCover = document.getElementById('mini-cover');

    if (trackTitle) trackTitle.textContent = track.title || '未知曲目';
    if (trackArtist) trackArtist.textContent = track.artist || '未知艺术家';
    if (trackAlbum) trackAlbum.textContent = track.album || 'GlassWave Archive';

    if (miniTitle) miniTitle.textContent = track.title || '未知曲目';
    if (miniArtist) miniArtist.textContent = track.artist || '未知艺术家';

    const hudTitle = document.getElementById('hud-track-title');
    const hudArtist = document.getElementById('hud-track-artist');
    if (hudTitle) hudTitle.textContent = track.title || '未知曲目';
    if (hudArtist) hudArtist.textContent = track.artist || '未知艺术家';

    const setCoverImage = (imgSrc) => {
      if (imgSrc) {
        if (currentCover) {
          currentCover.src = imgSrc;
          currentCover.style.display = 'block';
          currentCover.onload = () => {
            this.colorEngine.extractColorsFromImage(currentCover);
          };
        }
        if (defaultCover) defaultCover.style.display = 'none';
        if (miniCover) {
          miniCover.innerHTML = `<img src="${imgSrc}" alt="mini-cover">`;
        }
      } else {
        if (currentCover) currentCover.style.display = 'none';
        if (defaultCover) defaultCover.style.display = 'flex';
        if (miniCover) {
          miniCover.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
        }
      }
    };

    const target = track.coverPath || track.path;
    if (track.coverUrl) {
      setCoverImage(track.coverUrl);
    } else if (target) {
      if (this.coverCache.has(target) && this.coverCache.get(target) !== 'none') {
        setCoverImage(this.coverCache.get(target));
      } else if (window.glasswaveAPI && window.glasswaveAPI.getCoverData) {
        window.glasswaveAPI.getCoverData(target).then(dataUrl => {
          if (this.audioEngine.currentTrack && this.audioEngine.currentTrack.id === track.id) {
            if (dataUrl) {
              this.coverCache.set(target, dataUrl);
              if (track.path) this.coverCache.set(track.path, dataUrl);
              setCoverImage(dataUrl);
            } else {
              this.coverCache.set(target, 'none');
              setCoverImage(null);
            }
          }
        });
      } else {
        setCoverImage(null);
      }
    } else {
      setCoverImage(null);
    }

    this.highlightCurrentPlayingInList();
    this.updateHiFiSpec(track);
  }

  async updateHiFiSpec(track) {
    const badge = document.getElementById('hifi-badge');
    const tierLabel = document.getElementById('hifi-tier-label');
    const statusLabel = document.getElementById('hifi-status-label');
    const specFmt = document.getElementById('spec-format');
    const specSr = document.getElementById('spec-samplerate');
    const specBr = document.getElementById('spec-bitrate');
    const specLoss = document.getElementById('spec-lossless');
    const dspSub = document.getElementById('hifi-dsp-sub');

    if (!specFmt) return;

    if (!track) {
      if (badge) badge.className = 'hifi-badge-wrap';
      if (tierLabel) tierLabel.textContent = 'MASTER';
      if (statusLabel) statusLabel.textContent = 'HiFi';
      specFmt.textContent = '待机中';
      if (specSr) specSr.textContent = '--';
      if (specBr) specBr.textContent = '--';
      if (specLoss) {
        specLoss.textContent = '32 比特浮点 DSP 就绪';
        specLoss.style.color = '#cbd5e1';
      }
      if (dspSub) dspSub.textContent = '32 比特浮点';
      return;
    }

    // 1. Check or inspect audioSpec
    let audioSpec = track.audioSpec;
    if (!audioSpec && window.glasswaveAPI && typeof window.glasswaveAPI.inspectAudioSpec === 'function' && track.path) {
      try {
        const inspected = await window.glasswaveAPI.inspectAudioSpec(track.path);
        if (inspected) {
          track.audioSpec = inspected;
          audioSpec = inspected;
        }
      } catch (e) {}
    }

    // 2. Extract container, sampleRate, bitsPerSample, bitrate, isLossless
    const filePath = track.path || track.fileName || '';
    const extMatch = filePath.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? extMatch[1].toUpperCase() : '';

    let container = (audioSpec?.container || track.format || ext || 'AUDIO').toUpperCase();
    if (container === 'MPGA' || container === 'MPEG') container = 'MP3';

    const isLossless = !!(
      audioSpec?.isLossless ||
      track.lossless ||
      ['FLAC', 'WAV', 'APE', 'ALAC', 'AIFF', 'DSF', 'DFF', 'DSD'].includes(container)
    );

    let sampleRate = audioSpec?.sampleRate || track.sampleRate;
    if (!sampleRate) {
      if (['DSF', 'DFF', 'DSD'].includes(container)) sampleRate = 2822400;
      else if (isLossless) sampleRate = (container === 'WAV' || ext === 'FLAC') ? 48000 : 44100;
      else sampleRate = 44100;
    }

    let bitsPerSample = audioSpec?.bitsPerSample || track.bitsPerSample;
    if (!bitsPerSample) {
      if (['DSF', 'DFF', 'DSD'].includes(container)) bitsPerSample = 1;
      else if (isLossless) bitsPerSample = (container === 'WAV' || sampleRate >= 96000) ? 24 : 16;
      else bitsPerSample = 16;
    }

    let bitrate = audioSpec?.bitrate || track.bitrate;
    if (!bitrate) {
      if (['DSF', 'DFF', 'DSD'].includes(container)) bitrate = 5645;
      else if (isLossless) bitrate = Math.round((sampleRate * bitsPerSample * 2) / 1000);
      else bitrate = 320;
    } else if (bitrate > 10000) {
      bitrate = Math.round(bitrate / 1000);
    }

    const isDSD = ['DSF', 'DFF', 'DSD'].includes(container);
    const isHiRes = isDSD || (isLossless && (sampleRate >= 88200 || bitsPerSample >= 24));

    // 3. Audio Certification Tier Classification
    let tierClass = 'tier-standard';
    let tierTitle = 'AUDIO';
    let statusText = `${container}`;
    let certName = 'Standard Audio 标准音频认证 ★★';
    let certColor = '#94a3b8';
    let formatDesc = `${container} (标准格式)`;
    let srDesc = `${sampleRate.toLocaleString()} Hz`;

    if (isDSD) {
      tierClass = 'tier-master';
      tierTitle = 'MASTER';
      statusText = 'DSD 2.8M';
      certName = 'Master DSD Direct 母带认证 ★★★★★';
      certColor = '#fbbf24';
      formatDesc = `DSD / ${container} (Direct Stream Digital)`;
      srDesc = `${sampleRate.toLocaleString()} Hz · 1-Bit 脉冲流`;
    } else if (isHiRes) {
      tierClass = 'tier-master';
      tierTitle = 'MASTER';
      const srK = sampleRate >= 1000 ? `${Math.round(sampleRate / 1000)}k` : `${sampleRate}`;
      statusText = `${container} ${srK}`;
      certName = 'Master Hi-Res Studio 母带认证 ★★★★★';
      certColor = '#fbbf24';
      formatDesc = `${container} · 无损高解析母带`;
      srDesc = `${sampleRate.toLocaleString()} Hz · Hi-Res 解析`;
    } else if (isLossless) {
      tierClass = 'tier-lossless';
      tierTitle = 'LOSSLESS';
      const srK = sampleRate >= 1000 ? `${(sampleRate / 1000).toFixed(1).replace('.0', '')}k` : `${sampleRate}`;
      statusText = `${container} ${srK}`;
      certName = 'Hi-Fi Lossless CD 级认证 ★★★★';
      certColor = '#38bdf8';
      formatDesc = `${container} · 纯正无损压缩`;
      srDesc = `${sampleRate.toLocaleString()} Hz · CD 标准`;
    } else if (bitrate >= 250 || ['AAC', 'M4A'].includes(container)) {
      tierClass = 'tier-sq';
      tierTitle = 'HQ AUDIO';
      statusText = `${container} ${Math.round(bitrate)}k`;
      certName = 'High-Res SQ 极高音质认证 ★★★';
      certColor = '#34d399';
      formatDesc = `${container} (高码率压缩音源)`;
      srDesc = `${sampleRate.toLocaleString()} Hz · 高保真`;
    }

    // 4. Update Badge DOM
    if (badge) {
      badge.className = `hifi-badge-wrap ${tierClass}`;
      badge.title = `【${certName}】\n格式: ${container} | 采样率: ${sampleRate.toLocaleString()} Hz | 精度: ${bitsPerSample}-Bit | 码率: ${bitrate} kbps`;
    }
    if (tierLabel) tierLabel.textContent = tierTitle;
    if (statusLabel) statusLabel.textContent = statusText;

    // 5. Update Popover DOM
    specFmt.textContent = formatDesc;
    if (specSr) specSr.textContent = srDesc;
    if (specBr) specBr.textContent = `${bitsPerSample}-Bit / ${bitrate.toLocaleString()} kbps`;
    if (specLoss) {
      specLoss.textContent = certName;
      specLoss.style.color = certColor;
    }
    if (dspSub) {
      dspSub.textContent = '32 比特浮点';
    }
  }

  bindHiFiInspector() {
    const badge = document.getElementById('hifi-badge');
    const popover = document.getElementById('hifi-popover');
    if (!badge || !popover) return;

    badge.onclick = (e) => {
      e.stopPropagation();
      popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
    };

    document.addEventListener('click', (e) => {
      if (!badge.contains(e.target) && !popover.contains(e.target)) {
        popover.style.display = 'none';
      }
    });
  }

  // =========================================================================
  // 14. Hardware Equalizer, Zen Mode & Shortcuts
  // =========================================================================
  bindEqualizer() {
    const btnToggleEQ = document.getElementById('btn-toggle-eq');
    const eqModal = document.getElementById('glass-eq-modal');
    const btnCloseEQ = document.getElementById('btn-close-eq');
    const eqSwitch = document.getElementById('eq-switch-enable');
    const sliderContainer = document.getElementById('eq-sliders-container');

    if (btnToggleEQ && eqModal) {
      btnToggleEQ.onclick = () => {
        const isOpening = !eqModal.classList.contains('open') && eqModal.style.display !== 'flex';
        eqModal.classList.toggle('open', isOpening);
        eqModal.style.display = isOpening ? 'flex' : 'none';
        btnToggleEQ.classList.toggle('active', isOpening);
        if (document.body.classList.contains('zen-mode')) {
          document.body.classList.toggle('zen-interactive-open', isOpening);
          document.body.classList.toggle('zen-show-player-bar', isOpening);
        }
      };
    }

    if (btnCloseEQ && eqModal) {
      btnCloseEQ.onclick = () => {
        eqModal.classList.remove('open');
        eqModal.style.display = 'none';
        if (btnToggleEQ) btnToggleEQ.classList.remove('active');
        if (document.body.classList.contains('zen-mode')) {
          const queueDrawer = document.getElementById('glass-queue-drawer');
          const isDrawerOpen = queueDrawer && queueDrawer.classList.contains('open');
          document.body.classList.toggle('zen-interactive-open', !!isDrawerOpen);
        }
      };
    }

    // Outside click to close Equalizer modal
    document.addEventListener('pointerdown', (e) => {
      if (!eqModal || (!eqModal.classList.contains('open') && eqModal.style.display !== 'flex')) return;
      if (eqModal.contains(e.target) || (btnToggleEQ && btnToggleEQ.contains(e.target))) return;
      if (e.target.closest('#glass-context-menu, #category-context-menu, .category-icon-picker, #glass-confirm-modal, #glass-confirm-dialog')) return;
      eqModal.classList.remove('open');
      eqModal.style.display = 'none';
      if (btnToggleEQ) btnToggleEQ.classList.remove('active');
      if (document.body.classList.contains('zen-mode')) {
        const queueDrawer = document.getElementById('glass-queue-drawer');
        const isDrawerOpen = queueDrawer && queueDrawer.classList.contains('open');
        document.body.classList.toggle('zen-interactive-open', !!isDrawerOpen);
      }
    }, true);

    if (eqSwitch) {
      eqSwitch.checked = this.audioEngine.eqEnabled;
      eqSwitch.onchange = (e) => this.audioEngine.setEQEnabled(e.target.checked);
    }

    const presetsWrap = document.getElementById('eq-presets-wrap') || document.querySelector('.eq-presets-wrap');
    const eqBadge = document.getElementById('eq-preset-name-badge');
    const customTrack = document.getElementById('eq-saved-custom-track');
    let activePresetDesc = '平直原生 · 纯净监听无染色';

    const setActiveDesc = (desc) => {
      activePresetDesc = desc;
      if (eqBadge) eqBadge.textContent = desc;
    };

    const setHoverDesc = (desc) => {
      if (eqBadge && desc) eqBadge.textContent = desc;
    };

    const restoreActiveDesc = () => {
      if (eqBadge) eqBadge.textContent = activePresetDesc;
    };

    if (customTrack) {
      customTrack.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          customTrack.scrollLeft += e.deltaY * 0.85;
        }
      }, { passive: false });
    }
    const customRow = document.getElementById('eq-custom-row');
    if (customRow && customTrack) {
      customRow.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          customTrack.scrollLeft += e.deltaY * 0.85;
        }
      }, { passive: false });
    }

    const updateSlidersFromState = (gains) => {
      gains.forEach((g, idx) => {
        const s = document.querySelector(`.eq-slider-vertical[data-index="${idx}"]`);
        const b = document.getElementById(`eq-val-${idx}`);
        if (s) { s.value = g; this.updateEQSliderFill(s); }
        if (b) b.textContent = `${g > 0 ? '+' : ''}${g}dB`;
      });
    };

    const getSavedCustomPresets = () => {
      try {
        const raw = localStorage.getItem('glasswave_saved_custom_presets');
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    };

    const saveCustomPresetsList = (list) => {
      try {
        localStorage.setItem('glasswave_saved_custom_presets', JSON.stringify(list));
      } catch (e) {}
    };

    const btnCustom = document.getElementById('btn-eq-custom');
    const btnAddCustom = document.getElementById('btn-add-custom-eq');

    const markActivePresetButton = (targetBtn) => {
      if (!presetsWrap) return;
      presetsWrap.querySelectorAll('.eq-preset-btn').forEach(b => b.classList.remove('active'));
      if (targetBtn) {
        targetBtn.classList.add('active');
        const desc = targetBtn.dataset.desc || targetBtn.dataset.name || targetBtn.getAttribute('title');
        if (desc) setActiveDesc(desc);
      }
    };

    let currentPresetForRename = null;
    let activeCustomContextId = null;

    const openRenameModal = (presetItem) => {
      currentPresetForRename = presetItem;
      const modal = document.getElementById('modal-rename-eq-preset');
      const input = document.getElementById('input-rename-eq-preset');
      if (modal && input) {
        input.value = presetItem.name || '';
        modal.style.display = 'flex';
        setTimeout(() => {
          input.focus();
          input.select();
        }, 50);
      }
    };

    const closeRenameModal = () => {
      const modal = document.getElementById('modal-rename-eq-preset');
      if (modal) modal.style.display = 'none';
      currentPresetForRename = null;
    };

    const confirmRename = () => {
      const input = document.getElementById('input-rename-eq-preset');
      if (!input || !currentPresetForRename) return;
      const clean = input.value.trim();
      if (!clean) {
        this.showToast('⚠️ 预设名称不能为空');
        return;
      }
      currentPresetForRename.name = clean;
      const all = getSavedCustomPresets();
      const target = all.find(p => p.id === currentPresetForRename.id);
      if (target) {
        target.name = clean;
        saveCustomPresetsList(all);
        renderSavedCustomPresets();
        this.showToast(`✨ 预设已重命名为: ${clean}`);
      }
      closeRenameModal();
    };

    // Modal buttons wiring
    const btnConfirmRename = document.getElementById('btn-confirm-rename-eq');
    const btnCancelRename = document.getElementById('btn-cancel-rename-eq');
    const btnCloseRenameModal = document.getElementById('btn-close-rename-eq-modal');
    const inputRename = document.getElementById('input-rename-eq-preset');

    if (btnConfirmRename) btnConfirmRename.onclick = () => confirmRename();
    if (btnCancelRename) btnCancelRename.onclick = () => closeRenameModal();
    if (btnCloseRenameModal) btnCloseRenameModal.onclick = () => closeRenameModal();
    if (inputRename) {
      inputRename.onkeydown = (e) => {
        if (e.key === 'Enter') confirmRename();
        else if (e.key === 'Escape') closeRenameModal();
      };
    }

    // Context menu wiring
    const eqCtxMenu = document.getElementById('eq-preset-context-menu');
    const ctxRename = document.getElementById('eq-ctx-rename');
    const ctxDelete = document.getElementById('eq-ctx-delete');

    if (ctxRename) {
      ctxRename.onclick = (e) => {
        e.stopPropagation();
        if (eqCtxMenu) eqCtxMenu.style.display = 'none';
        const all = getSavedCustomPresets();
        const target = all.find(p => p.id === activeCustomContextId);
        if (target) openRenameModal(target);
      };
    }

    if (ctxDelete) {
      ctxDelete.onclick = (e) => {
        e.stopPropagation();
        if (eqCtxMenu) eqCtxMenu.style.display = 'none';
        const all = getSavedCustomPresets();
        const target = all.find(p => p.id === activeCustomContextId);
        const name = target ? target.name : '';
        const filtered = all.filter(p => p.id !== activeCustomContextId);
        saveCustomPresetsList(filtered);
        renderSavedCustomPresets();
        if (name) this.showToast(`已删除预设: ${name}`);
      };
    }

    const renderSavedCustomPresets = () => {
      const track = document.getElementById('eq-saved-custom-track') || presetsWrap;
      if (!track) return;
      track.querySelectorAll('.eq-custom-saved-pill').forEach(el => el.remove());

      const list = getSavedCustomPresets();
      list.forEach(item => {
        const pill = document.createElement('button');
        pill.className = 'eq-preset-btn eq-custom-saved-pill';
        pill.dataset.customId = item.id;
        pill.dataset.name = item.name;
        pill.dataset.desc = `自定义预设 · ${item.name}`;
        pill.title = `左键应用 · 右键选项 (重命名 / 删除)`;
        pill.innerHTML = `
          <span class="eq-custom-pill-name">${escapeHtml(item.name)}</span>
          <span class="eq-edit-custom" title="重命名此预设">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </span>
          <span class="eq-del-custom" title="删除此预设">&times;</span>
        `;

        pill.addEventListener('mouseenter', () => setHoverDesc(`自定义预设 · ${item.name}`));
        pill.addEventListener('mouseleave', () => restoreActiveDesc());

        pill.onclick = (e) => {
          if (e.target.closest('.eq-edit-custom')) {
            e.stopPropagation();
            openRenameModal(item);
            return;
          }
          if (e.target.classList.contains('eq-del-custom')) {
            e.stopPropagation();
            const filtered = getSavedCustomPresets().filter(p => p.id !== item.id);
            saveCustomPresetsList(filtered);
            renderSavedCustomPresets();
            this.showToast(`已删除预设: ${item.name}`);
            return;
          }
          markActivePresetButton(pill);
          this.audioEngine.applyCustomEQ(item.gains, item.name);
          updateSlidersFromState(item.gains);
          try { localStorage.setItem('glasswave_active_eq_preset', `custom_id_${item.id}`); } catch (err) {}
        };

        // Right-click opens context menu with Rename & Delete options
        pill.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          activeCustomContextId = item.id;
          if (eqCtxMenu) {
            eqCtxMenu.style.display = 'block';
            const mWidth = 150;
            const mHeight = 85;
            const x = Math.min(e.clientX, window.innerWidth - mWidth - 10);
            const y = Math.min(e.clientY, window.innerHeight - mHeight - 10);
            eqCtxMenu.style.left = `${Math.max(10, x)}px`;
            eqCtxMenu.style.top = `${Math.max(10, y)}px`;
          }
        });

        // Double-click opens rename modal
        pill.ondblclick = (e) => {
          e.stopPropagation();
          openRenameModal(item);
        };

        track.appendChild(pill);
      });
    };

    renderSavedCustomPresets();

    if (sliderContainer) {
      sliderContainer.innerHTML = '';
      const state = this.audioEngine.getEQState();

      state.labels.forEach((label, idx) => {
        const col = document.createElement('div');
        col.className = 'eq-slider-col';

        const gainVal = state.gains[idx] || 0;
        col.innerHTML = `
          <span class="eq-val-badge" id="eq-val-${idx}">${gainVal > 0 ? '+' : ''}${gainVal}dB</span>
          <div class="eq-slider-track">
            <input type="range" class="eq-slider-vertical" aria-label="${label} 增益" aria-orientation="vertical" min="-12" max="12" step="0.5" value="${gainVal}" data-index="${idx}">
          </div>
          <span class="eq-freq-label">${label}</span>
        `;

        const slider = col.querySelector('input');
        const badge = col.querySelector('.eq-val-badge');
        this.updateEQSliderFill(slider);

        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.audioEngine.setEQBand(idx, val);
          this.updateEQSliderFill(slider);
          badge.textContent = `${val > 0 ? '+' : ''}${val}dB`;

          // Switch active preset to 'custom'
          markActivePresetButton(btnCustom);
          try {
            const currentGains = this.audioEngine.getEQState().gains;
            localStorage.setItem('glasswave_custom_eq_gains', JSON.stringify(currentGains));
            localStorage.setItem('glasswave_active_eq_preset', 'custom');
          } catch (err) {}
        });

        slider.addEventListener('dblclick', () => {
          slider.value = 0;
          this.updateEQSliderFill(slider);
          this.audioEngine.setEQBand(idx, 0);
          badge.textContent = '0dB';
          markActivePresetButton(btnCustom);
          try {
            const currentGains = this.audioEngine.getEQState().gains;
            localStorage.setItem('glasswave_custom_eq_gains', JSON.stringify(currentGains));
            localStorage.setItem('glasswave_active_eq_preset', 'custom');
          } catch (err) {}
        });

        sliderContainer.appendChild(col);
      });
    }

    if (btnCustom) {
      btnCustom.addEventListener('mouseenter', () => setHoverDesc(btnCustom.dataset.desc || '自定义特调'));
      btnCustom.addEventListener('mouseleave', () => restoreActiveDesc());
      btnCustom.onclick = () => {
        markActivePresetButton(btnCustom);
        let customGains = null;
        try {
          const raw = localStorage.getItem('glasswave_custom_eq_gains');
          if (raw) customGains = JSON.parse(raw);
        } catch (e) {}
        if (customGains && Array.isArray(customGains)) {
          this.audioEngine.applyCustomEQ(customGains, 'custom');
          updateSlidersFromState(customGains);
        } else {
          const cur = this.audioEngine.getEQState();
          this.audioEngine.applyCustomEQ(cur.gains, 'custom');
        }
        try { localStorage.setItem('glasswave_active_eq_preset', 'custom'); } catch (err) {}
      };
    }

    if (btnAddCustom) {
      btnAddCustom.addEventListener('mouseenter', () => setHoverDesc('保存当前滑块参数为新的预设'));
      btnAddCustom.addEventListener('mouseleave', () => restoreActiveDesc());
      btnAddCustom.onclick = () => {
        const list = getSavedCustomPresets();
        let maxNum = 0;
        list.forEach(p => {
          const match = p.name && p.name.match(/预设\s*(\d+)/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        const cleanName = `预设 ${maxNum + 1}`;
        const curGains = [...this.audioEngine.getEQState().gains];
        const newPreset = {
          id: 'cp_' + Date.now(),
          name: cleanName,
          gains: curGains
        };
        list.push(newPreset);
        saveCustomPresetsList(list);
        renderSavedCustomPresets();

        // Activate new preset
        const track = document.getElementById('eq-saved-custom-track') || presetsWrap;
        if (track) {
          const newBtn = track.querySelector(`[data-custom-id="${newPreset.id}"]`);
          if (newBtn) {
            newBtn.click();
            try {
              newBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            } catch (e) {}
          }
        }
        this.showToast(`✨ 已新增预设: ${cleanName}`);
      };
    }

    if (presetsWrap) {
      presetsWrap.querySelectorAll('.eq-preset-btn:not(.eq-custom-pill):not(.btn-add-custom-eq):not(.eq-custom-saved-pill)').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
          const desc = btn.dataset.desc || btn.dataset.name || btn.getAttribute('title');
          if (desc) setHoverDesc(desc);
        });
        btn.addEventListener('mouseleave', () => restoreActiveDesc());

        btn.onclick = () => {
          markActivePresetButton(btn);
          const pKey = btn.dataset.preset;
          if (!pKey) return;
          this.audioEngine.applyEQPreset(pKey);

          const state = this.audioEngine.getEQState();
          updateSlidersFromState(state.gains);
          try { localStorage.setItem('glasswave_active_eq_preset', pKey); } catch (err) {}
        };
      });
    }
  }

  canDragWindowFromTarget(target) {
    if (!target || typeof target.closest !== 'function' || !target.closest('#app-shell')) return false;
    return !target.closest([
      'button', 'input', 'select', 'textarea', 'label', 'a', '[role="button"]', '[contenteditable="true"]',
      '.glass-search-box', '.search-more-popover', '.glass-hifi-popover',
      '.lyrics-settings-panel', '.lyrics-stage.is-positioning',
      '.glass-sidebar', '.glass-player-bar', '.zen-floating-toggle', '.glass-queue-drawer', '.glass-eq-modal',
      '.glass-settings-drawer', '#view-settings', '#view-visualizer-drawer', '.category-icon-picker',
      '#category-context-menu', '#glass-context-menu', '.glass-confirm-dialog', '.glass-modal',
      '.track-row', '.track-table', '.folder-card', '.folder-item', '.track-meta',
      '.alphabet-index-bar', '.custom-overlay-scrollbar-track', '.sort-dropdown-menu', '.sort-menu-item',
      '.tag-pill', '.tag-chip', '.pop-tag-chip', '.category-item', '.category-group-heading',
      '.lyrics-scroll-container', '.volume-slider-wrap', '.window-resize-handle', '.hifi-badge-wrap'
    ].join(', '));
  }

  bindZenMode() {
    const btnZenMode = document.getElementById('btn-zen-mode');
    const btnZenFloatExit = document.getElementById('btn-zen-float-exit');
    const btnZenFloatMinimize = document.getElementById('btn-zen-float-minimize');

    if (btnZenMode) {
      btnZenMode.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleZenMode();
      });
    }

    if (btnZenFloatExit) {
      const exitZen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleZenMode();
      };
      btnZenFloatExit.addEventListener('click', exitZen);
      btnZenFloatExit.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    if (btnZenFloatMinimize) {
      btnZenFloatMinimize.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.glasswaveAPI?.minimizeWindow?.();
      });
      btnZenFloatMinimize.addEventListener('mousedown', (e) => e.stopPropagation());
    }

    let sidebarTimer = null;
    let playerBarTimer = null;
    let topRightTimer = null;
    this.cancelZenAutoHide = () => {
      clearTimeout(sidebarTimer);
      clearTimeout(playerBarTimer);
      sidebarTimer = null;
      playerBarTimer = null;
    };

    const handleZenMouseMove = (e) => {
      if (!document.body.classList.contains('zen-mode') || document.body.classList.contains('zen-switching')) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (document.body.classList.contains('zen-content-view')) {
        this.cancelZenAutoHide();
        document.body.classList.add('zen-show-sidebar', 'zen-show-player-bar');
      } else {
        // 1. Left Sidebar: Super-wide Proximity & Stable Interaction Envelope (Requirement 2 & 3)
        const sidebarEl = document.getElementById('sidebar');
        const categoryMenu = document.getElementById('category-context-menu');
        const isCategoryMenuOpen = categoryMenu && categoryMenu.style.display !== 'none';
        const iconPicker = document.getElementById('category-icon-picker');
        const isIconPickerOpen = iconPicker && (iconPicker.classList.contains('visible') || iconPicker.style.display === 'block');
        const isFocusInsideSidebar = sidebarEl && sidebarEl.matches(':focus-within');
        const isSidebarLocked = isCategoryMenuOpen || isIconPickerOpen || isFocusInsideSidebar;

        // Super-wide trigger zone: 280px minimum or 22% of window width (covers the full 260px sidebar width)
        const leftTriggerZone = Math.max(280, winW * 0.22);
        const isNearLeft = mouseX <= leftTriggerZone;

        // Stable envelope: 380px (well beyond sidebar 260px width + 100px buffer)
        const sidebarRight = 228;
        const isInsideSidebarEnvelope = mouseX <= Math.max(380, sidebarRight + 100);

        if (isSidebarLocked || isNearLeft || (document.body.classList.contains('zen-show-sidebar') && isInsideSidebarEnvelope)) {
          if (sidebarTimer) {
            clearTimeout(sidebarTimer);
            sidebarTimer = null;
          }
          document.body.classList.add('zen-show-sidebar');
        } else if (document.body.classList.contains('zen-show-sidebar') && !isSidebarLocked) {
          if (!sidebarTimer) {
            sidebarTimer = setTimeout(() => {
              const curMenuOpen = categoryMenu && categoryMenu.style.display !== 'none';
              const curPickerOpen = iconPicker && (iconPicker.classList.contains('visible') || iconPicker.style.display === 'block');
              const curFocus = sidebarEl && sidebarEl.matches(':focus-within');
              if (!curMenuOpen && !curPickerOpen && !curFocus) {
                document.body.classList.remove('zen-show-sidebar');
              }
              sidebarTimer = null;
            }, 800);
          }
        }

        // 2. Bottom Player Bar: Super-wide Proximity & Stable Interaction Envelope (Requirement 3)
        const playerBarEl = document.querySelector('.glass-player-bar');
        const queueDrawer = document.getElementById('glass-queue-drawer');
        const eqModal = document.getElementById('glass-eq-modal');
        const isDrawerOpen = queueDrawer && queueDrawer.classList.contains('open');
        const isEqOpen = eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex');

        // Active interaction locks: dragging seeker, dragging volume, dragging scrollbar, focus-within
        const isFocusInsidePlayerBar = playerBarEl && playerBarEl.matches(':focus-within');
        const isDraggingBottom = this.isDraggingTimeline || this.isDraggingVolume || this.isDraggingScrollbar;
        const visualDrawer = document.getElementById('view-visualizer-drawer');
        const settingsDrawer = document.getElementById('view-settings');
        const isVisualOpen = visualDrawer?.classList.contains('open');
        const isSettingsOpen = settingsDrawer?.classList.contains('open');
        const isLyricsOpen = document.body.classList.contains('lyrics-settings-open');
        const isInteractiveActive = isDrawerOpen || isEqOpen || isVisualOpen || isSettingsOpen || isLyricsOpen || isDraggingBottom || isFocusInsidePlayerBar;
        document.body.classList.toggle('zen-interactive-open', isInteractiveActive);

        // Super-wide trigger zone: 220px minimum or 28% of window height (over 2.5x the player bar height)
        const bottomTriggerZone = Math.max(220, winH * 0.28);
        const isNearBottom = (mouseY >= winH - bottomTriggerZone);

        // Stable envelope: 240px minimum or 30% of window height
        const isInsideBottomEnvelope = mouseY >= winH - Math.max(240, winH * 0.30);

        if (isInteractiveActive || isNearBottom || (document.body.classList.contains('zen-show-player-bar') && isInsideBottomEnvelope)) {
          if (playerBarTimer) {
            clearTimeout(playerBarTimer);
            playerBarTimer = null;
          }
          document.body.classList.add('zen-show-player-bar');
        } else if (document.body.classList.contains('zen-show-player-bar') && !isInteractiveActive) {
          if (!playerBarTimer) {
            playerBarTimer = setTimeout(() => {
              if (!document.body.classList.contains('zen-interactive-open') && !this.isDraggingTimeline && !this.isDraggingVolume) {
                document.body.classList.remove('zen-show-player-bar');
              }
              playerBarTimer = null;
            }, 800);
          }
        }
      }

      // 3. Top-Right Mode Exit Button: Super-wide Proximity & 1-second retention delay (Requirement 4)
      const isNearTopRight = (mouseX >= winW - 300 && mouseY <= 200);
      const isInsideTopRight = (mouseX >= winW - 320 && mouseY <= 220);
      const zenActions = document.getElementById('zen-floating-actions');
      const isHoveringExit = zenActions && (zenActions.matches(':hover') || zenActions.matches(':focus-within'));

      if (isHoveringExit || isNearTopRight || (document.body.classList.contains('zen-show-top-right') && isInsideTopRight)) {
        if (topRightTimer) {
          clearTimeout(topRightTimer);
          topRightTimer = null;
        }
        document.body.classList.add('zen-show-top-right');
      } else if (document.body.classList.contains('zen-show-top-right') && !isHoveringExit) {
        if (!topRightTimer) {
          topRightTimer = setTimeout(() => {
            const curHover = zenActions && (zenActions.matches(':hover') || zenActions.matches(':focus-within'));
            if (!curHover) {
              document.body.classList.remove('zen-show-top-right');
            }
            topRightTimer = null;
          }, 1000); // 1-second retention delay as requested
        }
      }
    };

    let zenHoverFrame=null,zenHoverPoint=null;
    this.refreshZenPointerState = () => handleZenMouseMove(zenHoverPoint || { clientX: window.innerWidth / 2, clientY: 0 });
    window.addEventListener('mousemove',e=>{
      if(!document.body.classList.contains('zen-mode')||document.body.classList.contains('zen-switching'))return;
      zenHoverPoint={clientX:e.clientX,clientY:e.clientY};
      if(zenHoverFrame===null)zenHoverFrame=requestAnimationFrame(()=>{zenHoverFrame=null;handleZenMouseMove(zenHoverPoint);});
    },{passive:true});

    // Mouse leaves window -> hide after grace period (unless interacting with modal/drawer/slider)
    window.addEventListener('mouseout', (e) => {
      if (!document.body.classList.contains('zen-mode')) return;
      if (!e.relatedTarget && !e.toElement) {
        if (document.body.classList.contains('zen-content-view')) {
          document.body.classList.remove('zen-show-top-right');
          return;
        }
        if (!document.body.classList.contains('zen-interactive-open')) {
          if (!this.isDraggingTimeline && !this.isDraggingVolume && !this.isDraggingScrollbar) {
            document.body.classList.remove('zen-show-sidebar', 'zen-show-player-bar', 'zen-show-top-right');
          }
        }
      }
    });

    // Main-process system-cursor sampling keeps window movement independent of renderer frames.
    let isDraggingWindow = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let hasMovedWindow = false;
    let dragPointer=null,dragElement=null;

    window.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || !this.canDragWindowFromTarget(e.target)) return;

      // Never drag window when maximized or fullscreen
      if (document.body.classList.contains('window-fullscreen') || document.body.classList.contains('is-maximized')) {
        return;
      }

      // Dismiss floating overlays without changing the current page when a background drag starts.
      if (document.body.classList.contains('zen-mode')) {
        const queueDrawer = document.getElementById('glass-queue-drawer');
        if (queueDrawer && queueDrawer.classList.contains('open')) {
          queueDrawer.classList.remove('open');
          const btnToggle = document.getElementById('btn-queue-toggle');
          if (btnToggle) btnToggle.classList.remove('active');
          document.body.classList.remove('zen-interactive-open');
        }

        const eqModal = document.getElementById('glass-eq-modal');
        if (eqModal && !eqModal.classList.contains('hidden') && eqModal.style.display !== 'none') {
          eqModal.classList.add('hidden');
          eqModal.style.display = 'none';
          document.body.classList.remove('zen-interactive-open');
        }
      }

      isDraggingWindow = true;
      dragPointer=e.pointerId;dragElement=e.target;
      try{dragElement.setPointerCapture(dragPointer);}catch{}
      if (document.body.classList.contains('zen-mode')) document.body.classList.add('zen-dragging-window');
      hasMovedWindow = false;
      dragStartX = e.screenX;
      dragStartY = e.screenY;
      if (window.glasswaveAPI && window.glasswaveAPI.dragStartWindow) {
        window.glasswaveAPI.dragStartWindow({ screenX: e.screenX, screenY: e.screenY });
      }
    });

    const finishWindowDrag = () => {
      if (isDraggingWindow) {
        isDraggingWindow = false;
        try{if(dragElement?.hasPointerCapture(dragPointer))dragElement.releasePointerCapture(dragPointer);}catch{}
        dragElement=null;dragPointer=null;
        document.body.classList.remove('zen-dragging-window');
        if (window.glasswaveAPI && window.glasswaveAPI.dragEndWindow) {
          window.glasswaveAPI.dragEndWindow();
        }
      }
    };
    window.addEventListener('pointerup',finishWindowDrag);
    window.addEventListener('pointercancel',finishWindowDrag);
    window.addEventListener('blur',finishWindowDrag);
  }

  bindSidebarToggle() {
    const btnCollapse = document.getElementById('btn-collapse-sidebar');
    const btnExpand = document.getElementById('btn-expand-sidebar');

    const setCollapsed = (collapsed) => {
      if (document.body.classList.contains('zen-mode')) return;
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      try { localStorage.setItem('gw_sidebar_collapsed', collapsed ? 'true' : 'false'); } catch (e) {}
      if (this.visualizer && this.visualizer.performSyncResize) {
        setTimeout(() => this.visualizer.performSyncResize(), 50);
      }
    };

    if (btnCollapse) {
      btnCollapse.addEventListener('click', (e) => {
        e.stopPropagation();
        setCollapsed(true);
      });
    }

    if (btnExpand) {
      btnExpand.addEventListener('click', (e) => {
        e.stopPropagation();
        setCollapsed(false);
      });
    }

    // Restore saved collapse state
    try {
      if (localStorage.getItem('gw_sidebar_collapsed') === 'true') {
        document.body.classList.add('sidebar-collapsed');
      }
    } catch (e) {}

    // Mouse proximity to left edge reveals expand button (widened to 140px / 260px)
    window.addEventListener('mousemove', (e) => {
      if (document.body.classList.contains('sidebar-collapsed') && !document.body.classList.contains('zen-mode')) {
        if (e.clientX <= 140) {
          document.body.classList.add('hover-left-edge');
        } else if (e.clientX > 260) {
          document.body.classList.remove('hover-left-edge');
        }
      }
    }, { passive: true });
  }

  async toggleMiniMode(forceState) {
    if(this._miniModePending) return;
    this._miniModePending=true;
    this.beginDirectInteraction?.();
    try {
    const isCurrentlyMini = document.body.classList.contains('mini-bar-mode');
    const targetState = forceState !== undefined ? forceState : !isCurrentlyMini;

    if (targetState) {
      document.body.classList.add('mini-bar-mode');
      if (window.glasswaveAPI && window.glasswaveAPI.setMiniMode) {
        await window.glasswaveAPI.setMiniMode(true);
      }
    } else {
      document.body.classList.remove('mini-bar-mode');
      if (window.glasswaveAPI && window.glasswaveAPI.setMiniMode) {
        await window.glasswaveAPI.setMiniMode(false);
      }
    }

    // Refresh mini cover if current track exists
    if (this.audioEngine.currentTrack) {
      this.updateTrackView(this.audioEngine.currentTrack);
    }

    if (this.visualizer && this.visualizer.performSyncResize) {
      setTimeout(() => this.visualizer.performSyncResize(), 50);
    }
    } finally {this._miniModePending=false;this.endDirectInteraction?.();}
  }

  bindMiniMode() {
    const btnMini = document.getElementById('btn-mini-mode');
    const btnExitMini = document.getElementById('btn-exit-mini-mode');

    if (btnMini) {
      btnMini.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMiniMode();
      });
    }

    if (btnExitMini) {
      btnExitMini.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMiniMode(false);
      });
    }
  }

  // =========================================================================
  // Top-Right Window Pinning (Always-on-Top) System (Off, Playing, Always)
  // =========================================================================
  bindPinMode() {
    const btnPin = document.getElementById('btn-pin-mode');
    const saved = localStorage.getItem('glasswave_pin_mode');
    this.pinMode = (saved === 'playing' || saved === 'always') ? saved : 'off';
    this.updatePinModeUI(this.pinMode);
    this.syncAlwaysOnTop();

    if (btnPin) {
      btnPin.onclick = (e) => {
        e.stopPropagation();
        this.cyclePinMode();
      };
    }
  }

  cyclePinMode() {
    // 3 Options cycle: 不置顶 (off) -> 播放式置顶 (playing) -> 永久置顶 (always) -> 不置顶 (off)
    const nextModeMap = {
      'off': 'playing',
      'playing': 'always',
      'always': 'off'
    };
    const nextMode = nextModeMap[this.pinMode] || 'off';
    this.setPinMode(nextMode);
  }

  setPinMode(mode) {
    this.pinMode = (mode === 'playing' || mode === 'always') ? mode : 'off';
    try {
      localStorage.setItem('glasswave_pin_mode', this.pinMode);
    } catch (e) {}
    this.updatePinModeUI(this.pinMode);
    this.syncAlwaysOnTop();
  }

  updatePinModeUI(mode) {
    const btnPin = document.getElementById('btn-pin-mode');
    if (!btnPin) return;

    btnPin.classList.remove('mode-off', 'mode-playing', 'mode-always');
    btnPin.classList.add(`mode-${mode}`);

    const iconOff = btnPin.querySelector('.pin-icon-off');
    const iconPlaying = btnPin.querySelector('.pin-icon-playing');
    const iconAlways = btnPin.querySelector('.pin-icon-always');

    if (iconOff) iconOff.style.display = mode === 'off' ? 'block' : 'none';
    if (iconPlaying) iconPlaying.style.display = mode === 'playing' ? 'block' : 'none';
    if (iconAlways) iconAlways.style.display = mode === 'always' ? 'block' : 'none';

    if (mode === 'off') {
      btnPin.title = '窗口置顶: 不置顶 (点击切换播放时置顶)';
    } else if (mode === 'playing') {
      btnPin.title = '窗口置顶: 播放式置顶 (仅播放音乐时保持窗口最前，点击切换永久置顶)';
    } else if (mode === 'always') {
      btnPin.title = '窗口置顶: 永久置顶 (窗口始终保持最前，点击取消置顶)';
    }
  }

  syncAlwaysOnTop(forcePlayingState) {
    const isPlaying = forcePlayingState !== undefined ? forcePlayingState : (this.audioEngine ? this.audioEngine.isPlaying : false);
    let shouldBeOnTop = false;
    if (this.pinMode === 'always') {
      shouldBeOnTop = true;
    } else if (this.pinMode === 'playing') {
      shouldBeOnTop = !!isPlaying;
    } else {
      shouldBeOnTop = false;
    }

    if (window.glasswaveAPI && window.glasswaveAPI.setAlwaysOnTop) {
      window.glasswaveAPI.setAlwaysOnTop(shouldBeOnTop);
    }
  }

  toggleZenMode(forceState) {
    const wasZen = document.body.classList.contains('zen-mode');
    const targetState = typeof forceState === 'boolean' ? forceState : !wasZen;
    if(targetState===wasZen)return;
    clearTimeout(this._zenSettleTimer);
    document.body.classList.add('zen-switching');
    if (targetState) {
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
      this._preZenSidebarCollapsed = document.body.classList.contains('sidebar-collapsed');
      document.body.classList.remove('sidebar-collapsed');
      document.body.classList.add('zen-mode');
      this.switchView('player');
      const appShellEl = document.getElementById('app-shell');
      if (appShellEl) appShellEl.scrollLeft = 0;
      window.scrollTo(0, 0);
      const popover = document.getElementById('search-more-popover');
      if (popover) popover.style.display = 'none';
      const hifiPop = document.getElementById('hifi-popover');
      if (hifiPop) hifiPop.style.display = 'none';
    } else {
      document.body.classList.remove('zen-mode', 'zen-content-view', 'zen-show-sidebar', 'zen-show-player-bar', 'zen-show-top-right', 'zen-show-top-bar', 'zen-interactive-open');
      const appShellEl = document.getElementById('app-shell');
      if (appShellEl) appShellEl.scrollLeft = 0;
      window.scrollTo(0, 0);
      if (this._preZenSidebarCollapsed) {
        document.body.classList.add('sidebar-collapsed');
      }
    }

    this._zenSettleTimer=setTimeout(()=>{
      document.body.classList.remove('zen-switching');
      this.visualizer?.performSyncResize?.();
    },160);
  }

  bindKeyboardShortcuts() {
    window.GlassWaveShortcuts?.bind(this);
    window.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.code !== 'Escape') return;
      if (window.GlassWaveShortcuts?.closePage?.(true)) return;
      if (e.code === 'Escape') {
        const visDrawer = document.getElementById('view-visualizer-drawer');
        if (visDrawer && visDrawer.classList.contains('open')) {
          this.toggleVisualizerDrawer(false);
          return;
        }
        const settingsDrawer = document.getElementById('view-settings');
        if (settingsDrawer && settingsDrawer.classList.contains('open')) {
          this.toggleSettingsDrawer(false);
          return;
        }
        const queueDrawer = document.getElementById('glass-queue-drawer');
        if (queueDrawer && queueDrawer.classList.contains('open')) {
          queueDrawer.classList.remove('open');
          const btnQueue = document.getElementById('btn-queue-toggle');
          if (btnQueue) btnQueue.classList.remove('active');
          if (document.body.classList.contains('zen-mode')) {
            const eqModal = document.getElementById('glass-eq-modal');
            const isEqOpen = eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex');
            document.body.classList.toggle('zen-interactive-open', !!isEqOpen);
          }
          return;
        }
        const eqModal = document.getElementById('glass-eq-modal');
        if (eqModal && (eqModal.classList.contains('open') || eqModal.style.display === 'flex')) {
          eqModal.classList.remove('open');
          eqModal.style.display = 'none';
          const btnEq = document.getElementById('btn-toggle-eq');
          if (btnEq) btnEq.classList.remove('active');
          if (document.body.classList.contains('zen-mode')) {
            document.body.classList.remove('zen-interactive-open');
          }
          return;
        }
        if (window.glasswaveAPI && window.glasswaveAPI.isFullscreen) {
          window.glasswaveAPI.isFullscreen().then(isFs => {
            if (isFs) {
              window.glasswaveAPI.setFullscreen(false);
            } else if (document.body.classList.contains('mini-bar-mode')) {
              this.toggleMiniMode(false);
            } else if (document.body.classList.contains('zen-mode')) {
              this.toggleZenMode();
            }
          });
        } else if (document.body.classList.contains('mini-bar-mode')) {
          this.toggleMiniMode(false);
        } else if (document.body.classList.contains('zen-mode')) {
          this.toggleZenMode();
        }
      }
    });
  }


  bindSettings() {
    const api = window.glasswaveAPI;
    const settingAutoplay = document.getElementById('setting-autoplay');
    const settingLaunchShuffle = document.getElementById('setting-launch-shuffle');
    const settingRememberProgress = document.getElementById('setting-remember-progress');
    const itemRememberProgress = document.getElementById('setting-item-remember-progress');
    const descRememberProgress = document.getElementById('setting-desc-remember-progress');
    const settingParallax = document.getElementById('setting-parallax');
    const settingAutoAddDropped = document.getElementById('setting-auto-add-dropped');
    const settingCompactNav = document.getElementById('setting-compact-sidebar-nav');
    const btnUnhideAll = document.getElementById('btn-unhide-all');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    if (btnCloseSettings) {
      btnCloseSettings.onclick = (e) => {
        e.stopPropagation();
        this.toggleSettingsDrawer(false);
      };
    }

    // Direct wheel scrolling on Settings Drawer & settings-content (support sub-panel)
    const settingsDrawer = document.getElementById('view-settings');
    if (settingsDrawer) {
      settingsDrawer.addEventListener('wheel', (e) => {
        const sContent = settingsDrawer.classList.contains('shortcuts-page-open')
          ? settingsDrawer.querySelector('.shortcut-page-scroll')
          : settingsDrawer.classList.contains('skin-manager-open')
            ? settingsDrawer.querySelector('#skin-manager-scroll')
            : settingsDrawer.querySelector('#settings-panel-main');
        if (sContent) {
          e.stopPropagation();
          const step = e.deltaMode === 1 ? e.deltaY * 40 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
          sContent.scrollTop += step;
          e.preventDefault();
        }
      }, { passive: false });
    }

    const btnCloseSettingsSub = document.getElementById('btn-close-settings-sub');
    if (btnCloseSettingsSub) {
      btnCloseSettingsSub.onclick = (e) => {
        e.stopPropagation();
        this.toggleSettingsDrawer(false);
      };
    }

    // Update linkage between Launch Shuffle and Remember Progress
    const updateLaunchSettingsLinkage = () => {
      const isShuffle = settingLaunchShuffle ? settingLaunchShuffle.checked : false;
      if (settingRememberProgress && itemRememberProgress) {
        if (isShuffle) {
          settingRememberProgress.checked = false;
          settingRememberProgress.disabled = true;
          itemRememberProgress.style.opacity = '0.45';
          itemRememberProgress.style.pointerEvents = 'none';
          if (descRememberProgress) {
            descRememberProgress.textContent = '已开启软件随机播放（随机曲目固定从 00:00 从头开始播放）';
          }
        } else {
          settingRememberProgress.disabled = false;
          itemRememberProgress.style.opacity = '1';
          itemRememberProgress.style.pointerEvents = 'auto';
          const savedRemember = localStorage.getItem('glasswave_remember_progress');
          settingRememberProgress.checked = savedRemember === 'true';
          if (descRememberProgress) {
            descRememberProgress.textContent = '关闭后，打开软件重新播放歌曲时将一律从 00:00 从头起播，不再恢复上次听了一半的秒数';
          }
        }
      }
    };

    // Immediate local persistence restore
    try {
      const savedCompact = localStorage.getItem('glasswave_compact_sidebar_nav');
      if (savedCompact !== 'false') {
        document.body.classList.add('compact-sidebar-nav');
        document.documentElement.classList.add('compact-sidebar-nav');
        if (settingCompactNav) settingCompactNav.checked = true;
      }
      const savedAutoplay = localStorage.getItem('glasswave_autoplay');
      if (savedAutoplay !== null && settingAutoplay) {
        settingAutoplay.checked = savedAutoplay === 'true';
      }
      const savedShuffle = localStorage.getItem('glasswave_launch_shuffle');
      if (savedShuffle !== null && settingLaunchShuffle) {
        settingLaunchShuffle.checked = savedShuffle === 'true';
      }
      const savedRemember = localStorage.getItem('glasswave_remember_progress');
      if (savedRemember !== null && settingRememberProgress) {
        settingRememberProgress.checked = savedRemember === 'true';
      }
      updateLaunchSettingsLinkage();
    } catch (e) {}

    if (api) {
      api.getConfig().then(cfg => {
        if (!cfg) return;
        if (settingAutoplay) {
          settingAutoplay.checked = cfg.autoplayOnLaunch !== false;
          try { localStorage.setItem('glasswave_autoplay', settingAutoplay.checked ? 'true' : 'false'); } catch (e) {}
        }
        if (settingLaunchShuffle) {
          settingLaunchShuffle.checked = !!cfg.launchShuffle;
          try { localStorage.setItem('glasswave_launch_shuffle', settingLaunchShuffle.checked ? 'true' : 'false'); } catch (e) {}
        }
        if (settingRememberProgress) {
          const val = cfg.rememberProgress === true;
          try { localStorage.setItem('glasswave_remember_progress', val ? 'true' : 'false'); } catch (e) {}
        }
        updateLaunchSettingsLinkage();

        if (settingParallax) settingParallax.checked = cfg.mouseParallax !== false;
        if (settingAutoAddDropped) {
          settingAutoAddDropped.checked = !!cfg.autoAddDroppedToLibrary;
        }
        if (settingCompactNav && cfg.compactSidebarNav !== undefined) {
          settingCompactNav.checked = !!cfg.compactSidebarNav;
          document.body.classList.toggle('compact-sidebar-nav', !!cfg.compactSidebarNav);
          document.documentElement.classList.toggle('compact-sidebar-nav', !!cfg.compactSidebarNav);
        }
      });
    }

    if (settingCompactNav) {
      settingCompactNav.onchange = (e) => {
        const isChecked = e.target.checked;
        document.body.classList.toggle('compact-sidebar-nav', isChecked);
        document.documentElement.classList.toggle('compact-sidebar-nav', isChecked);
        try { localStorage.setItem('glasswave_compact_sidebar_nav', isChecked ? 'true' : 'false'); } catch (err) {}
        if (api) api.saveConfig({ compactSidebarNav: isChecked });
      };
    }

    if (settingAutoplay) {
      settingAutoplay.onchange = (e) => {
        const val = e.target.checked;
        try { localStorage.setItem('glasswave_autoplay', val ? 'true' : 'false'); } catch (err) {}
        if (api) api.saveConfig({ autoplayOnLaunch: val });
      };
    }

    if (settingLaunchShuffle) {
      settingLaunchShuffle.onchange = (e) => {
        const val = e.target.checked;
        try { localStorage.setItem('glasswave_launch_shuffle', val ? 'true' : 'false'); } catch (err) {}
        updateLaunchSettingsLinkage();
        if (api) {
          api.saveConfig({
            launchShuffle: val,
            rememberProgress: val ? false : (settingRememberProgress ? settingRememberProgress.checked : false)
          });
        }
      };
    }

    if (settingRememberProgress) {
      settingRememberProgress.onchange = (e) => {
        const val = e.target.checked;
        try { localStorage.setItem('glasswave_remember_progress', val ? 'true' : 'false'); } catch (err) {}
        if (api) api.saveConfig({ rememberProgress: val });
      };
    }
    if (settingParallax && api) {
      settingParallax.onchange = (e) => {
        api.saveConfig({ mouseParallax: e.target.checked });
        this.parallax?.setEnabled(e.target.checked);
      };
    }
    if (settingAutoAddDropped && api) {
      settingAutoAddDropped.onchange = (e) => {
        api.saveConfig({ autoAddDroppedToLibrary: e.target.checked });
      };
    }

    if (btnUnhideAll && api) {
      btnUnhideAll.onclick = async () => {
        btnUnhideAll.textContent = '恢复中...';
        try {
          const restored = await api.unhideAllTracks();
          this.setTracks(restored);
          btnUnhideAll.textContent = '已全部恢复显示';
          setTimeout(() => { btnUnhideAll.textContent = '恢复仍在目录中的歌曲'; }, 2000);
        } catch (e) {
          btnUnhideAll.textContent = '恢复失败';
        }
      };
    }

    // Display Elements Switches: Album Cover & Track Meta
    const btnToggleCover = document.getElementById('btn-toggle-cover');
    const btnToggleTrackMeta = document.getElementById('btn-toggle-track-meta');

    const setCoverVisible = (visible) => {
      document.body.classList.toggle('hide-cover', !visible);
      if (btnToggleCover) {
        btnToggleCover.classList.toggle('active', !!visible);
        const lbl = btnToggleCover.querySelector('.dot-label');
        if (lbl) lbl.textContent = visible ? '显示' : '隐藏';
      }
      if (this.visualizer) {
        this.visualizer.invalidateCoverMetrics();
      }
    };

    const setTrackMetaVisible = (visible) => {
      document.body.classList.toggle('hide-track-meta', !visible);
      if (btnToggleTrackMeta) {
        btnToggleTrackMeta.classList.toggle('active', !!visible);
        const lbl = btnToggleTrackMeta.querySelector('.dot-label');
        if (lbl) lbl.textContent = visible ? '显示' : '隐藏';
      }
    };

    if (btnToggleCover) {
      btnToggleCover.addEventListener('click', () => {
        const willShow = !btnToggleCover.classList.contains('active');
        setCoverVisible(willShow);
        try { localStorage.setItem('glasswave_display_cover', willShow ? 'true' : 'false'); } catch (e) {}
      });
    }

    if (btnToggleTrackMeta) {
      btnToggleTrackMeta.addEventListener('click', () => {
        const willShow = !btnToggleTrackMeta.classList.contains('active');
        setTrackMetaVisible(willShow);
        try { localStorage.setItem('glasswave_display_meta', willShow ? 'true' : 'false'); } catch (e) {}
      });
    }

    // Restore saved display element states
    try {
      const savedCover = localStorage.getItem('glasswave_display_cover');
      if (savedCover !== null) {
        setCoverVisible(savedCover === 'true');
      }
      const savedMeta = localStorage.getItem('glasswave_display_meta');
      if (savedMeta !== null) {
        setTrackMetaVisible(savedMeta === 'true');
      }
    } catch (e) {}
  }

  bindLibraryActions() {
    const btnScan = document.getElementById('btn-scan-library');
    const btnAddFolder = document.getElementById('btn-add-music-folder');
    const btnRefreshAllMeta = document.getElementById('btn-refresh-all-meta');

    if (btnScan && window.glasswaveAPI) {
      btnScan.onclick = async () => {
        btnScan.textContent = '扫描中...';
        await window.glasswaveAPI.scanNow();
        btnScan.textContent = '立即扫描';
      };
    }

    if (btnAddFolder && window.glasswaveAPI) {
      btnAddFolder.onclick = async () => {
        const res = await window.glasswaveAPI.addMusicFolder();
        if (res && res.tracks) {
          this.setTracks(res.tracks);
        }
      };
    }

    if (btnRefreshAllMeta && window.glasswaveAPI) {
      btnRefreshAllMeta.onclick = async () => {
        btnRefreshAllMeta.textContent = '读取内嵌封面中...';
        btnRefreshAllMeta.disabled = true;
        try {
          if (window.glasswaveAPI.rescanEmbeddedCovers) {
            await window.glasswaveAPI.rescanEmbeddedCovers();
          }
          await window.glasswaveAPI.unhideAllTracks();
          const tracks = await window.glasswaveAPI.getTracks();
          this.coverCache.clear();
          this.setTracks(tracks);
          btnRefreshAllMeta.textContent = '内嵌封面已更新';
        } catch (e) {
          btnRefreshAllMeta.textContent = '刷新完成';
        }
        setTimeout(() => {
          btnRefreshAllMeta.textContent = '刷新封面与标签';
          btnRefreshAllMeta.disabled = false;
        }, 2200);
      };
    }
  }

  async renderFoldersList() {
    const container = document.getElementById('folder-list-container');
    if (!container || !window.glasswaveAPI) return;

    container.innerHTML = '<div class="empty-hint">正在读取监控目录...</div>';
    const folders = await window.glasswaveAPI.getFolders();
    const tracks = this.allTracks;

    const btnAddManage = document.getElementById('btn-add-folder-manage');
    if(btnAddManage)btnAddManage.onclick=async()=>{
      const res=await window.glasswaveAPI.addMusicFolder();
      if(res){this.setTracks(res.tracks);await this.renderFoldersList();}
    };
    if (!folders || folders.length === 0) {
      container.innerHTML = '<div class="empty-hint">暂无监控目录，请点击上方“+ 添加新目录”按钮选择音乐文件夹。</div>';
      return;
    }

    container.innerHTML = '';
    folders.forEach(folder => {
      const prefix=folder.replace(/[\\/]+$/,'').toLowerCase()+'\\';
      const count=tracks.filter(t=>t.path && t.path.split('/').join('\\').toLowerCase().startsWith(prefix)).length;
      const card = document.createElement('div');
      card.className = 'setting-item';
      card.style.justifyContent = 'space-between';
      card.style.padding = '18px 24px';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; overflow:hidden;">
          <div style="color:var(--accent-primary); flex-shrink:0; display:flex; align-items:center;">
            <svg style="width:26px; height:26px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div style="min-width:0;">
            <div style="font-weight:600; font-size:14px; color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${escapeHtml(folder)}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">包含已发现曲目：<strong>${count}</strong> 首</div>
          </div>
        </div>
        <div style="display:flex; gap:10px; flex-shrink:0; margin-left:14px;">
          <button class="glass-pill-btn btn-remove-folder" style="padding:6px 14px;font-size:12px;">移除监控</button>
          <button class="glass-pill-btn btn-open-folder" data-path="${escapeHtml(folder)}" style="padding:6px 14px; font-size:12px;">在资源管理器中打开</button>
        </div>
      `;

      card.querySelector('.btn-remove-folder').onclick=async()=>{
        if(!await this.showGlassConfirm({title:'移除监控目录',message:'停止监控这个目录，并移出仅属于此目录的曲目？',subtext:'不会删除本地音乐文件；其他监控目录仍覆盖的曲目会保留。',confirmText:'移除监控'}))return;
        const res=await window.glasswaveAPI.removeMusicFolder(folder);
        if(res){this.setTracks(res.tracks);await this.renderFoldersList();}
      };
      card.querySelector('.btn-open-folder').onclick = () => {
        window.glasswaveAPI.openFolderInExplorer(folder);
      };

      container.appendChild(card);
    });


  }

  // =========================================================================
  // 19. Glassmorphic Confirmation Modal Dialog (Requirement 1)
  // =========================================================================
  showGlassConfirm({ title = '确认操作', message = '确定要继续此操作吗？', subtext = '', confirmText = '确认删除', cancelText = '取消', danger = true } = {}) {
    return new Promise((resolve) => {
      if (this.confirmHideTimer) clearTimeout(this.confirmHideTimer);
      const backdrop = document.getElementById('glass-confirm-dialog');
      const titleEl = document.getElementById('confirm-title');
      const msgEl = document.getElementById('confirm-msg');
      const subEl = document.getElementById('confirm-sub');
      const btnCancel = document.getElementById('confirm-btn-cancel');
      const btnOk = document.getElementById('confirm-btn-ok');

      if (!backdrop || !btnOk || !btnCancel) {
        resolve(confirm(message));
        return;
      }

      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.textContent = message;
      if (subEl) {
        subEl.textContent = subtext || '';
        subEl.style.display = subtext ? 'block' : 'none';
      }
      if (btnCancel) btnCancel.textContent = cancelText;
      if (btnOk) {
        btnOk.textContent = confirmText;
        if (danger) {
          btnOk.className = 'confirm-btn confirm-btn-danger';
        } else {
          btnOk.className = 'confirm-btn confirm-btn-primary';
        }
      }

      let resolved = false;
      const cleanup = (result) => {
        if (resolved) return;
        resolved = true;
        backdrop.classList.remove('active');
        this.confirmHideTimer = setTimeout(() => {
          if (!backdrop.classList.contains('active')) backdrop.style.display = 'none';
          this.confirmHideTimer = null;
        }, 220);
        document.removeEventListener('keydown', onKeyDown);
        backdrop.onclick = null;
        btnCancel.onclick = null;
        btnOk.onclick = null;
        resolve(result);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          cleanup(false);
        } else if (e.key === 'Enter') {
          e.stopPropagation();
          cleanup(true);
        }
      };

      btnCancel.onclick = (e) => {
        e.stopPropagation();
        cleanup(false);
      };

      btnOk.onclick = (e) => {
        e.stopPropagation();
        cleanup(true);
      };

      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          cleanup(false);
        }
      };

      document.addEventListener('keydown', onKeyDown);
      backdrop.style.display = 'flex';
      requestAnimationFrame(() => {
        backdrop.classList.add('active');
        btnOk.focus();
      });
    });
  }

  // =========================================================================
  // 20. Window Wireframe Resize Handles (Requirement 3)
  // =========================================================================
  bindWindowResizing() {
    const api=window.glasswaveAPI;
    if(!api?.startWireframeResize)return;
    let drag=null,raf=null;
    const boundsAt=(d,e)=>{
      const b=d.bounds,dx=e.screenX-d.x,dy=e.screenY-d.y;
      let {x,y,width,height}=b;
      const minW=document.body.classList.contains('mini-mode')?480:900;
      const minH=document.body.classList.contains('mini-mode')?88:640;
      if(d.edge.includes('r'))width=Math.max(minW,b.width+dx);
      if(d.edge.includes('b'))height=Math.max(minH,b.height+dy);
      if(d.edge.includes('l')){width=Math.max(minW,b.width-dx);x=b.x+b.width-width;}
      if(d.edge.includes('t')){height=Math.max(minH,b.height-dy);y=b.y+b.height-height;}
      return {x:Math.round(x),y:Math.round(y),width:Math.round(width),height:Math.round(height)};
    };
    const finish=(e,cancel=false)=>{
      if(!drag)return;
      const d=drag;drag=null;
      if(raf)cancelAnimationFrame(raf);raf=null;
      try{if(d.handle.hasPointerCapture(d.id))d.handle.releasePointerCapture(d.id);}catch{}
      if(d.bounds)api.endWireframeResize(cancel?null:boundsAt(d,e));
      this.endDirectInteraction?.();
    };
    window.addEventListener('pointermove',e=>{
      if(!drag?.bounds||e.pointerId!==drag.id)return;
      e.preventDefault();drag.pending=boundsAt(drag,e);
      if(!raf)raf=requestAnimationFrame(()=>{raf=null;if(drag?.pending)api.moveWireframeResize(drag.pending);});
    },{capture:true,passive:false});
    window.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)finish(e);},true);
    window.addEventListener('pointercancel',e=>finish(e,true),true);
    window.addEventListener('blur',e=>finish(e,true));
    window.addEventListener('keydown',e=>{if(e.key==='Escape')finish(e,true);},true);
    document.querySelectorAll('.window-resize-handle').forEach(handle=>{
      handle.addEventListener('pointerdown',async e=>{
        if(e.button!==0||document.body.matches('.window-fullscreen,.is-maximized,.visualizer-fullscreen-active,.maximized'))return;
        e.preventDefault();e.stopPropagation();
        const d={handle,id:e.pointerId,edge:handle.dataset.edge,x:e.screenX,y:e.screenY,bounds:null};drag=d;
        this.beginDirectInteraction?.();
        try{handle.setPointerCapture(e.pointerId);}catch{}
        const bounds=await api.getWindowBounds();
        if(drag!==d)return;
        if(!bounds){finish(e,true);return;}
        d.bounds=bounds;api.startWireframeResize(bounds);
      });
    });
    api.onWindowResizedFinal?.(()=>this.visualizer?.performSyncResize?.());
  }

  // =========================================================================
  // 21. Custom Wallpaper Background System (Requirement 4)
  // =========================================================================
  // =========================================================================
  // 21. Custom Wallpaper Background System (Requirements: Blur & Opacity Sliders)
  // =========================================================================
  initCustomWallpaper() {
    const btnChoose = document.getElementById('btn-choose-custom-bg');
    const btnReset = document.getElementById('btn-reset-custom-bg');
    const popChoose = document.getElementById('pop-custom-bg');
    const popReset = document.getElementById('pop-reset-bg');
    const blurSlider = document.getElementById('setting-bg-blur');
    const opacitySlider = document.getElementById('setting-bg-opacity');
    const posSlider = document.getElementById('setting-bg-pos-y');
    const tintSlider = document.getElementById('setting-bg-tint-degree');
    const pureSlider = document.getElementById('setting-bg-pure-ratio');
    const pureSwitch = document.getElementById('setting-bg-pure-mode');

    // Restore tint degree setting (default: 0% - 完全无染色 / 纯净高饱和原色)
    const savedTint = localStorage.getItem('glasswave_bg_tint_degree');
    let initialTint = 0;
    if (savedTint !== null) {
      initialTint = Number(savedTint);
    } else {
      const savedRatio = localStorage.getItem('glasswave_bg_pure_ratio');
      if (savedRatio !== null) {
        initialTint = 100 - Number(savedRatio);
      } else {
        initialTint = 0; // Default: zero dye / pure photo
      }
    }

    this.updateWallpaperTintDegree(initialTint);

    if (tintSlider) {
      tintSlider.value = initialTint;
      tintSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperTintDegree(val);
      };
    }

    if (pureSlider) {
      pureSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperPureRatio(val);
      };
    }
    if (pureSwitch) {
      pureSwitch.onchange = (e) => {
        const checked = e.target.checked;
        this.updateWallpaperPureRatio(checked ? 100 : 0);
      };
    }

    // Restore vertical position setting (0% top to 100% bottom, default 50%)
    const savedPosY = localStorage.getItem('glasswave_bg_pos_y');
    if (savedPosY !== null && posSlider) {
      posSlider.value = savedPosY;
      this.updateWallpaperPosY(Number(savedPosY));
    } else {
      this.updateWallpaperPosY(50);
    }

    if (posSlider) {
      posSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperPosY(val);
        try { localStorage.setItem('glasswave_bg_pos_y', val); } catch (err) {}
      };
    }

    // Restore horizontal position setting (0% left to 100% right, default 50%)
    const posXSlider = document.getElementById('setting-bg-pos-x');
    const savedPosX = localStorage.getItem('glasswave_bg_pos_x');
    if (savedPosX !== null && posXSlider) {
      posXSlider.value = savedPosX;
      this.updateWallpaperPosX(Number(savedPosX));
    } else {
      this.updateWallpaperPosX(50);
    }

    if (posXSlider) {
      posXSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperPosX(val);
        try { localStorage.setItem('glasswave_bg_pos_x', val); } catch (err) {}
      };
    }


    // Restore blur setting
    const savedBlur = localStorage.getItem('glasswave_bg_blur');
    if (savedBlur !== null && blurSlider) {
      blurSlider.value = savedBlur;
      this.updateWallpaperBlur(Number(savedBlur));
    } else {
      this.updateWallpaperBlur(14);
    }

    if (blurSlider) {
      blurSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperBlur(val);
        try { localStorage.setItem('glasswave_bg_blur', val); } catch (err) {}
      };
    }

    // Restore opacity setting
    const savedOpacity = localStorage.getItem('glasswave_bg_opacity');
    if (savedOpacity !== null && opacitySlider) {
      opacitySlider.value = savedOpacity;
      this.updateWallpaperOpacity(Number(savedOpacity));
    } else {
      this.updateWallpaperOpacity(0.72);
    }

    if (opacitySlider) {
      opacitySlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWallpaperOpacity(val);
        try { localStorage.setItem('glasswave_bg_opacity', val); } catch (err) {}
      };
    }

    if (btnChoose) {
      btnChoose.onclick = () => this.chooseCustomWallpaper();
    }
    if (popChoose) {
      popChoose.onclick = () => {
        const popover = document.getElementById('search-more-popover');
        const btnSearchMore = document.getElementById('btn-search-more');
        if (popover) popover.classList.remove('open');
        if (btnSearchMore) btnSearchMore.classList.remove('active');
        this.chooseCustomWallpaper();
      };
    }
    if (btnReset) {
      btnReset.style.display = 'inline-flex';
      btnReset.onclick = () => this.resetCustomWallpaper();
    }
    if (popReset) {
      popReset.onclick = () => {
        const popover = document.getElementById('search-more-popover');
        const btnSearchMore = document.getElementById('btn-search-more');
        if (popover) popover.classList.remove('open');
        if (btnSearchMore) btnSearchMore.classList.remove('active');
        this.resetCustomWallpaper();
      };
    }

    // Restore zoom setting (50% to 250%, default 100% minimal adaptive fill)
    this.wallpaperFitMode = localStorage.getItem('glasswave_bg_fit_mode') !== 'manual';
    const zoomSlider = document.getElementById('setting-bg-zoom');
    const savedZoom = localStorage.getItem('glasswave_bg_zoom');
    if (savedZoom !== null && zoomSlider) {
      zoomSlider.value = savedZoom;
      this.updateWallpaperZoom(Number(savedZoom), this.wallpaperFitMode);
    } else {
      this.updateWallpaperZoom(100, true);
    }

    if (zoomSlider) {
      zoomSlider.oninput = (e) => {
        const val = Number(e.target.value);
        this.wallpaperFitMode = (val === 100);
        this.updateWallpaperZoom(val, this.wallpaperFitMode);
      };
    }

    const btnZoomIn = document.getElementById('btn-bg-zoom-in');
    const btnZoomOut = document.getElementById('btn-bg-zoom-out');
    const btnZoomFit = document.getElementById('btn-bg-zoom-fit');
    const btnZoomReset = document.getElementById('btn-bg-zoom-reset');

    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        const cur = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
        this.wallpaperFitMode = false;
        this.updateWallpaperZoom(Math.min(250, cur + 5), false);
      };
    }
    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        const cur = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
        this.wallpaperFitMode = false;
        this.updateWallpaperZoom(Math.max(50, cur - 5), false);
      };
    }
    if (btnZoomFit) {
      btnZoomFit.onclick = () => {
        this.wallpaperFitMode = true;
        this.updateWallpaperZoom(100, true);
      };
    }
    if (btnZoomReset) {
      btnZoomReset.onclick = () => {
        this.wallpaperFitMode = true;
        this.updateWallpaperZoom(100, true);
      };
    }

    // Window resize adaptive update
    if (!this._hasWallpaperResizeListener) {
      this._hasWallpaperResizeListener = true;
      window.addEventListener('resize', () => {
        const curRot = Number(localStorage.getItem('glasswave_bg_rotate') || 0);
        const curZoom = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
        this.recomputeWallpaperTransform(curRot, curZoom);
      });
    }

    // Restore rotation setting
    const savedRotate = localStorage.getItem('glasswave_bg_rotate');
    this.updateWallpaperRotation(savedRotate !== null ? Number(savedRotate) : 0);

    const btnRotate = document.getElementById('btn-rotate-custom-bg');
    if (btnRotate) {
      btnRotate.onclick = () => {
        const cur = Number(localStorage.getItem('glasswave_bg_rotate') || 0);
        const next = (cur + 90) % 360;
        this.updateWallpaperRotation(next);
      };
    }

    // Black and white cutout share one edge control and keep separate thresholds.
    const btnLumaKey = document.getElementById('btn-bg-luma-key');
    const sliderLuma = document.getElementById('setting-bg-luma-threshold');
    const btnLumaModeToggle = document.getElementById('btn-luma-mode-toggle');
    const btnLumaPresetPure = document.getElementById('btn-luma-preset-pure');
    const btnLumaPresetDark = document.getElementById('btn-luma-preset-dark');
    const btnLumaColorOff = document.getElementById('btn-luma-color-off');
    const btnLumaColorBlack = document.getElementById('btn-luma-color-black');
    const btnLumaColorWhite = document.getElementById('btn-luma-color-white');

    const savedLumaThreshold = localStorage.getItem('glasswave_bg_luma_threshold');
    const savedWhiteThreshold = localStorage.getItem('glasswave_bg_white_threshold');
    const savedLumaMode = localStorage.getItem('glasswave_bg_luma_mode') || 'cutout';
    const savedKeyColor = localStorage.getItem('glasswave_bg_key_color');
    this.bgLumaColor = ['off', 'black', 'white'].includes(savedKeyColor)
      ? savedKeyColor : (Number(savedLumaThreshold) > 0 ? 'black' : 'off');
    const initialThreshold = this.bgLumaColor === 'white' ? Number(savedWhiteThreshold) || 3
      : this.bgLumaColor === 'black' ? Number(savedLumaThreshold) || 16 : 0;
    this.updateWallpaperLumaThreshold(initialThreshold, savedLumaMode);

    if (btnLumaKey) {
      btnLumaKey.onclick = () => {
        const nextColor = this.bgLumaColor === 'off' ? 'black' : this.bgLumaColor === 'black' ? 'white' : 'off';
        this.setWallpaperKeyColor(nextColor);
      };
    }
    if (btnLumaColorOff) btnLumaColorOff.onclick = () => this.setWallpaperKeyColor('off');
    if (btnLumaColorBlack) btnLumaColorBlack.onclick = () => this.setWallpaperKeyColor('black');
    if (btnLumaColorWhite) btnLumaColorWhite.onclick = () => this.setWallpaperKeyColor('white');

    if (sliderLuma) {
      sliderLuma.oninput = (e) => {
        const val = Number(e.target.value);
        if (val > 0 && this.bgLumaColor === 'off') this.bgLumaColor = 'black';
        this.updateWallpaperLumaThreshold(val);
      };
    }

    if (btnLumaModeToggle) {
      btnLumaModeToggle.onclick = () => {
        const nextMode = this.bgLumaMode === 'soft' ? 'cutout' : 'soft';
        this.updateWallpaperLumaThreshold(this.bgLumaThreshold || 16, nextMode);
      };
    }

    if (btnLumaPresetPure) {
      btnLumaPresetPure.onclick = () => { if(this.bgLumaColor === 'off')this.bgLumaColor = 'black'; this.updateWallpaperLumaThreshold(3, 'cutout'); this.updateDesktopReveal(100); }
    }
    if (btnLumaPresetDark) {
      btnLumaPresetDark.onclick = () => { if(this.bgLumaColor === 'off')this.bgLumaColor = 'black'; this.updateWallpaperLumaThreshold(16, 'soft'); this.updateDesktopReveal(100); }
    }

    // Restore saved custom wallpaper from localStorage
    try {
      const savedPath = localStorage.getItem('glasswave_custom_bg');
      if (savedPath) {
        this.applyCustomWallpaper(savedPath, false);
      }
    } catch (e) {}
  }

  updateWallpaperZoom(val, isFit = undefined) {
    if (isFit !== undefined) {
      this.wallpaperFitMode = !!isFit;
    } else if (val === 100) {
      this.wallpaperFitMode = true;
    }
    const zoom = Math.max(50, Math.min(250, Number(val) || 100));
    const lblZoom = document.getElementById('lbl-bg-zoom');
    if (lblZoom) {
      lblZoom.textContent = (zoom === 100 && this.wallpaperFitMode) ? '100% (自适应 Fit)' : `${zoom}%`;
    }
    const zoomSlider = document.getElementById('setting-bg-zoom');
    if (zoomSlider && Number(zoomSlider.value) !== zoom) {
      zoomSlider.value = zoom;
    }
    try {
      localStorage.setItem('glasswave_bg_zoom', zoom);
      localStorage.setItem('glasswave_bg_fit_mode', this.wallpaperFitMode ? 'auto' : 'manual');
    } catch (e) {}

    const curRot = Number(localStorage.getItem('glasswave_bg_rotate') || 0);
    this.recomputeWallpaperTransform(curRot, zoom);
  }

  updateWallpaperRotation(deg) {
    const rot = (Number(deg) || 0) % 360;
    try {
      localStorage.setItem('glasswave_bg_rotate', rot);
    } catch (e) {}

    const lbl = document.getElementById('lbl-bg-rotate');
    if (lbl) lbl.textContent = `${rot}°`;

    const btn = document.getElementById('btn-rotate-custom-bg');
    if (btn) btn.title = `顺时针旋转背景图片 90° (当前：${rot}°)`;

    // Each rotation recomputes/adapts fit so wide images rotated 90/270 degrees fit cleanly without blow-up
    if (this.wallpaperFitMode !== false) {
      this.updateWallpaperZoom(100, true);
    } else {
      const zoom = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
      this.recomputeWallpaperTransform(rot, zoom);
    }
  }

  recomputeWallpaperTransform(rot = 0, zoom = 100, inPosX = undefined, inPosY = undefined) {
    const isTransposed = (rot % 180 !== 0);

    // Dynamic container dimension transposition
    // When rot is 90° or 270°, transpose width and height to match the rotated viewport
    if (isTransposed) {
      document.documentElement.style.setProperty('--custom-bg-width', 'calc(100vh + 80px)');
      document.documentElement.style.setProperty('--custom-bg-height', 'calc(100vw + 80px)');
      document.documentElement.style.setProperty('--custom-bg-left', 'calc(50% - (100vh + 80px) / 2)');
      document.documentElement.style.setProperty('--custom-bg-top', 'calc(50% - (100vw + 80px) / 2)');
    } else {
      document.documentElement.style.setProperty('--custom-bg-width', 'calc(100% + 80px)');
      document.documentElement.style.setProperty('--custom-bg-height', 'calc(100% + 80px)');
      document.documentElement.style.setProperty('--custom-bg-left', '-40px');
      document.documentElement.style.setProperty('--custom-bg-top', '-40px');
    }

    // Base scale is 1.04 to provide a clean minimal 4% margin for smooth parallax translate without exposing black edges
    const baseScale = 1.04;
    const effectiveScale = Number((baseScale * (zoom / 100)).toFixed(4));

    document.documentElement.style.setProperty('--custom-bg-rotate', `${rot}deg`);
    document.documentElement.style.setProperty('--custom-bg-scale', effectiveScale);

    // Adaptive focal panning calculation across zoom levels while preserving mouse parallax safety buffer
    const w = window.innerWidth || 1180;
    const h = window.innerHeight || 780;
    const containerW = isTransposed ? (h + 80) : (w + 80);
    const containerH = isTransposed ? (w + 80) : (h + 80);

    // Extra scale beyond 100% that creates zoomable horizontal & vertical overflow
    const extraScale = Math.max(0, (zoom - 100) / 100);
    const extraOverflowX = containerW * extraScale;
    const extraOverflowY = containerH * extraScale;

    // Available focal panning travel: half the extra overflow
    const zoomMaxPanX = extraOverflowX / 2;
    const zoomMaxPanY = extraOverflowY / 2;

    const posX = inPosX !== undefined ? inPosX : Number(localStorage.getItem('glasswave_bg_pos_x') !== null ? localStorage.getItem('glasswave_bg_pos_x') : 50);
    const posY = inPosY !== undefined ? inPosY : Number(localStorage.getItem('glasswave_bg_pos_y') !== null ? localStorage.getItem('glasswave_bg_pos_y') : 50);

    const normX = (posX - 50) / 50; // -1 (left) to +1 (right)
    const normY = (posY - 50) / 50; // -1 (top) to +1 (bottom)

    // Negative sign so normX = -1 (0% left) shifts image rightwards (+X) to reveal the left portion
    const focalX = Number((-normX * zoomMaxPanX).toFixed(2));
    const focalY = Number((-normY * zoomMaxPanY).toFixed(2));

    document.documentElement.style.setProperty('--custom-bg-trans-x', `${focalX}px`);
    document.documentElement.style.setProperty('--custom-bg-trans-y', `${focalY}px`);

    if (this.parallax) {
      this.parallax.customBgRotation = rot;
      this.parallax.customBgScale = effectiveScale;
      this.parallax.customBgFocalX = focalX;
      this.parallax.customBgFocalY = focalY;
    }

    const bgImage = document.getElementById('custom-bg-image');
    if (bgImage && (!this.parallax || !this.parallax.enabled)) {
      bgImage.style.transform = `translate3d(${focalX}px, ${focalY}px, 0) scale(${effectiveScale}) rotate(${rot}deg)`;
    }
  }

  resetWallpaperRotation() {
    this.updateWallpaperRotation(0);
  }

  resetWallpaperFocusPosition() {
    const posXSlider = document.getElementById('setting-bg-pos-x');
    const posYSlider = document.getElementById('setting-bg-pos-y');
    const zoomSlider = document.getElementById('setting-bg-zoom');
    if (posXSlider) posXSlider.value = 50;
    if (posYSlider) posYSlider.value = 50;
    if (zoomSlider) zoomSlider.value = 100;
    try {
      localStorage.setItem('glasswave_bg_pos_x', 50);
      localStorage.setItem('glasswave_bg_pos_y', 50);
      localStorage.setItem('glasswave_bg_zoom', 100);
    } catch (e) {}
    this.updateWallpaperPosX(50);
    this.updateWallpaperPosY(50);
    this.updateWallpaperZoom(100);
  }

  updateWallpaperPosY(val) {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    try { localStorage.setItem('glasswave_bg_pos_y', num); } catch (e) {}
    const posLabel = document.getElementById('lbl-bg-pos-y');
    document.documentElement.style.setProperty('--custom-bg-pos-y', `${num}%`);
    const posYSlider = document.getElementById('setting-bg-pos-y');
    if (posYSlider && Number(posYSlider.value) !== num) posYSlider.value = num;
    if (posLabel) {
      if (num === 0) {
        posLabel.textContent = '0% (顶部焦点 / 角色面部)';
      } else if (num === 50) {
        posLabel.textContent = '50% (居中)';
      } else if (num === 100) {
        posLabel.textContent = '100% (底部焦点)';
      } else if (num < 50) {
        posLabel.textContent = `${num}% (偏顶部)`;
      } else {
        posLabel.textContent = `${num}% (偏底部)`;
      }
    }
    const curRot = Number(localStorage.getItem('glasswave_bg_rotate') || 0);
    const curZoom = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
    this.recomputeWallpaperTransform(curRot, curZoom, undefined, num);
  }

  updateWallpaperPosX(val) {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    try { localStorage.setItem('glasswave_bg_pos_x', num); } catch (e) {}
    const posLabel = document.getElementById('lbl-bg-pos-x');
    document.documentElement.style.setProperty('--custom-bg-pos-x', `${num}%`);
    const posXSlider = document.getElementById('setting-bg-pos-x');
    if (posXSlider && Number(posXSlider.value) !== num) posXSlider.value = num;
    if (posLabel) {
      if (num === 0) {
        posLabel.textContent = '0% (靠左)';
      } else if (num === 50) {
        posLabel.textContent = '50% (居中)';
      } else if (num === 100) {
        posLabel.textContent = '100% (靠右)';
      } else if (num < 50) {
        posLabel.textContent = `${num}% (偏左)`;
      } else {
        posLabel.textContent = `${num}% (偏右)`;
      }
    }
    const curRot = Number(localStorage.getItem('glasswave_bg_rotate') || 0);
    const curZoom = Number(localStorage.getItem('glasswave_bg_zoom') || 100);
    this.recomputeWallpaperTransform(curRot, curZoom, num);
  }


  updateWallpaperTintDegree(val) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(val) || 0)));
    const tintSlider = document.getElementById('setting-bg-tint-degree');
    const tintLabel = document.getElementById('lbl-bg-tint-degree');
    const pureSlider = document.getElementById('setting-bg-pure-ratio');
    const pureLabel = document.getElementById('lbl-bg-pure-ratio');

    if (tintSlider && Math.abs(Number(tintSlider.value) - clamped) > 0.001) {
      tintSlider.value = clamped;
    }

    if (tintLabel) {
      if (clamped === 0) {
        tintLabel.textContent = '0% (完全无染色 / 纯净高饱和原色)';
      } else if (clamped === 100) {
        tintLabel.textContent = '100% (完全融入主题氛围光)';
      } else {
        tintLabel.textContent = `${clamped}% (适度融合)`;
      }
    }

    const tintDecimal = clamped / 100;
    document.documentElement.style.setProperty('--custom-tint-degree', tintDecimal);

    // Sync pure ratio: 0% tint = 100% pure, 100% tint = 0% pure
    const pureVal = 100 - clamped;
    const pureDecimal = pureVal / 100;
    document.documentElement.style.setProperty('--custom-pure-ratio', pureDecimal);
    if (pureSlider && Math.abs(Number(pureSlider.value) - pureVal) > 0.001) {
      pureSlider.value = pureVal;
    }
    if (pureLabel) {
      if (pureVal === 0) {
        pureLabel.textContent = '0% (默认毛玻璃)';
      } else if (pureVal === 100) {
        pureLabel.textContent = '100% (极度纯透)';
      } else {
        pureLabel.textContent = `${pureVal}%`;
      }
    }

    if (pureVal > 0) {
      document.body.classList.add('custom-wallpaper-pure');
    } else {
      document.body.classList.remove('custom-wallpaper-pure');
    }

    if (clamped === 0) {
      document.body.classList.add('wallpaper-tint-zero');
      document.documentElement.style.setProperty('--custom-bg-brightness', '1.0');
      document.documentElement.style.setProperty('--custom-bg-saturate', '115%');
    } else {
      document.body.classList.remove('wallpaper-tint-zero');
      const b = (1.0 - (clamped / 100) * 0.28).toFixed(2);
      document.documentElement.style.setProperty('--custom-bg-brightness', b);
      document.documentElement.style.setProperty('--custom-bg-saturate', `${Math.round(115 + (clamped / 100) * 10)}%`);
    }

    try {
      localStorage.setItem('glasswave_bg_tint_degree', clamped);
      localStorage.setItem('glasswave_bg_pure_ratio', pureVal);
      localStorage.setItem('glasswave_bg_pure_mode', pureVal > 0 ? 'true' : 'false');
    } catch (e) {}
  }

  updateWallpaperPureRatio(ratio) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(ratio) || 0)));
    const decimal = clamped / 100;
    const pureSlider = document.getElementById('setting-bg-pure-ratio');
    const pureLabel = document.getElementById('lbl-bg-pure-ratio');
    const pureSwitch = document.getElementById('setting-bg-pure-mode');

    if (pureSlider && Math.abs(Number(pureSlider.value) - clamped) > 0.001) pureSlider.value = clamped;
    if (pureLabel) {
      if (clamped === 0) {
        pureLabel.textContent = '0% (默认毛玻璃)';
      } else if (clamped === 100) {
        pureLabel.textContent = '100% (极度纯透)';
      } else {
        pureLabel.textContent = `${clamped}%`;
      }
    }
    if (pureSwitch) pureSwitch.checked = clamped > 0;

    // Set CSS custom property for continuous proportional interpolation (0.0 to 1.0)
    document.documentElement.style.setProperty('--custom-pure-ratio', decimal);

    // Sync tint degree: 100% pure = 0% tint, 0% pure = 100% tint
    const tintVal = 100 - clamped;
    const tintDecimal = tintVal / 100;
    document.documentElement.style.setProperty('--custom-tint-degree', tintDecimal);

    const tintSlider = document.getElementById('setting-bg-tint-degree');
    const tintLabel = document.getElementById('lbl-bg-tint-degree');
    if (tintSlider && Math.abs(Number(tintSlider.value) - tintVal) > 0.001) tintSlider.value = tintVal;
    if (tintLabel) {
      if (tintVal === 0) {
        tintLabel.textContent = '0% (完全无染色 / 纯净高饱和原色)';
      } else if (tintVal === 100) {
        tintLabel.textContent = '100% (完全融入主题氛围光)';
      } else {
        tintLabel.textContent = `${tintVal}% (适度融合)`;
      }
    }

    if (clamped > 0) {
      document.body.classList.add('custom-wallpaper-pure');
    } else {
      document.body.classList.remove('custom-wallpaper-pure');
    }

    if (tintVal === 0) {
      document.body.classList.add('wallpaper-tint-zero');
      document.documentElement.style.setProperty('--custom-bg-brightness', '1.0');
      document.documentElement.style.setProperty('--custom-bg-saturate', '115%');
    } else {
      document.body.classList.remove('wallpaper-tint-zero');
      const b = (0.72 + decimal * 0.28).toFixed(2);
      document.documentElement.style.setProperty('--custom-bg-brightness', b);
      document.documentElement.style.setProperty('--custom-bg-saturate', `${Math.round(115 + (tintVal / 100) * 10)}%`);
    }

    try {
      localStorage.setItem('glasswave_bg_pure_ratio', clamped);
      localStorage.setItem('glasswave_bg_tint_degree', tintVal);
      localStorage.setItem('glasswave_bg_pure_mode', clamped > 0 ? 'true' : 'false');
    } catch (e) {}
  }

  updateWallpaperPureMode(enabled) {
    this.updateWallpaperPureRatio(enabled ? 100 : 0);
  }

  updateWallpaperBlur(val) {
    const blurLabel = document.getElementById('lbl-bg-blur');
    document.documentElement.style.setProperty('--custom-bg-blur', `${val}px`);
    document.documentElement.style.setProperty('--custom-tint-blur', `${Math.min(val, 6)}px`);
    if (blurLabel) {
      blurLabel.textContent = val === 0 ? '0px (关闭磨砂)' : `${val}px`;
    }
    if (val === 0) {
      document.body.classList.add('wallpaper-blur-zero');
    } else {
      document.body.classList.remove('wallpaper-blur-zero');
    }
  }

  updateWallpaperOpacity(val) {
    const num = Math.max(0, Math.min(1.0, Math.round((Number(val) || 0) * 100) / 100));
    const opacityLabel = document.getElementById('lbl-bg-opacity');
    const opacitySlider = document.getElementById('setting-bg-opacity');
    if (opacitySlider && Math.abs(Number(opacitySlider.value) - num) > 0.001) {
      opacitySlider.value = num;
    }
    document.documentElement.style.setProperty('--custom-bg-opacity', num);
    if (opacityLabel) {
      if (num === 0) {
        opacityLabel.textContent = '0% (完全透明)';
      } else if (num === 1.0) {
        opacityLabel.textContent = '100% (实体不透明)';
      } else {
        opacityLabel.textContent = `${Math.round(num * 100)}% (半透明透光)`;
      }
    }
    if (num === 0) {
      document.body.classList.add('wallpaper-opacity-zero');
    } else {
      document.body.classList.remove('wallpaper-opacity-zero');
    }
    try { localStorage.setItem('glasswave_bg_opacity', num); } catch (e) {}
  }

  // =========================================================================
  // 21.5 Hardware Luma Key / Black Cutout & Blend Mode System (Requirement)
  // =========================================================================
  setWallpaperKeyColor(color) {
    const nextColor = color === 'black' || color === 'white' ? color : 'off';
    this.bgLumaColor = nextColor;
    const saved = nextColor === 'white'
      ? Number(localStorage.getItem('glasswave_bg_white_threshold'))
      : Number(localStorage.getItem('glasswave_bg_luma_threshold'));
    const threshold = nextColor === 'off' ? 0 : (saved > 0 ? saved : (nextColor === 'white' ? 3 : 16));
    this.updateWallpaperLumaThreshold(threshold);
  }

  updateWallpaperLumaThreshold(thresholdPct, mode = undefined) {
    const clamped = Math.max(0, Math.min(80, Math.round(Number(thresholdPct) || 0)));
    if (clamped === 0) this.bgLumaColor = 'off';
    else if (this.bgLumaColor !== 'white' && this.bgLumaColor !== 'black') this.bgLumaColor = 'black';
    this.bgLumaThreshold = clamped;
    if (mode !== undefined) {
      this.bgLumaMode = mode === 'soft' || mode === 'screen' ? 'soft' : 'cutout';
    } else if (!this.bgLumaMode) {
      this.bgLumaMode = 'cutout';
    }

    const color = this.bgLumaColor;
    const active = color !== 'off' && clamped > 0;
    const white = color === 'white';
    const btnKey = document.getElementById('btn-bg-luma-key');
    const lblKey = document.getElementById('lbl-bg-luma-status');
    const slider = document.getElementById('setting-bg-luma-threshold');
    const lblThreshold = document.getElementById('lbl-bg-luma-threshold');
    const lblTitle = document.getElementById('lbl-bg-luma-title');
    const btnModeToggle = document.getElementById('btn-luma-mode-toggle');
    const btnPresetPure = document.getElementById('btn-luma-preset-pure');
    const btnPresetDark = document.getElementById('btn-luma-preset-dark');
    const funcA = document.getElementById('luma-key-func-a');

    if (slider) {
      slider.value = clamped;
      slider.setAttribute('aria-label', white ? '白底透光阈值' : color === 'black' ? '黑底透光阈值' : '背景抠图阈值');
    }
    if (lblThreshold) lblThreshold.textContent = clamped + '%';
    if (lblTitle) lblTitle.textContent = white ? '白底透光阈值' : color === 'black' ? '黑底透光阈值' : '背景抠图阈值';
    if (btnModeToggle) btnModeToggle.textContent = this.bgLumaMode === 'soft' ? '边缘：柔和' : '边缘：清晰';
    if (btnPresetPure) btnPresetPure.textContent = white ? '纯白底' : '纯黑底';
    if (btnPresetDark) btnPresetDark.textContent = white ? '浅灰底' : '深灰底';
    if (btnKey) {
      btnKey.classList.toggle('active', active);
      btnKey.setAttribute('aria-pressed', String(active));
    }
    if (lblKey) lblKey.textContent = active ? (white ? '白底' : '黑底') : '关';
    for (const name of ['off', 'black', 'white']) {
      const button = document.getElementById('btn-luma-color-' + name);
      if (button) {
        button.classList.toggle('active', color === name);
        button.setAttribute('aria-pressed', String(color === name));
      }
    }
    document.body.classList.toggle('wallpaper-luma-key-active', active);
    document.body.classList.remove('wallpaper-blend-screen');

    if (active && funcA) {
      const threshold = clamped / 100;
      const feather = this.bgLumaMode === 'soft' ? 0.10 : 0.035;
      const slope = Number(((white ? -1 : 1) / feather).toFixed(2));
      const intercept = Number(((white ? 1 - threshold : -threshold) / feather).toFixed(2));
      funcA.setAttribute('slope', slope);
      funcA.setAttribute('intercept', intercept);
    }

    try {
      localStorage.setItem('glasswave_bg_key_color', color);
      localStorage.setItem('glasswave_bg_luma_mode', this.bgLumaMode);
      if (active) localStorage.setItem(white ? 'glasswave_bg_white_threshold' : 'glasswave_bg_luma_threshold', clamped);
    } catch (e) {}
  }

  setPictureFirstDefaults() {
    // Automatically set picture-first default parameters (Requirement 1):
    // 1. Picture fully opaque (100% / 1.0)
    this.updateWallpaperOpacity(1.0);
    // 2. Theme tint degree 0% (pure vibrant original colors, zero tinting/filter wash)
    this.updateWallpaperTintDegree(0);
    // 3. Window acrylic glass ratio 0% (solid background, non-transparent to desktop)
    this.updateWindowGlassRatio(0);
    this.updateDesktopReveal(0);
    // 4. Blur 0px (crisp sharp original image, no frosted blur by default)
    this.updateWallpaperBlur(0);
    // 5. Center focus and fit zoom
    this.resetWallpaperFocusPosition();
    this.resetWallpaperRotation();
    this.wallpaperFitMode = true;
    this.updateWallpaperZoom(100, true);
    // 6. Reset active pure color swatch if any
    if (this.colorEngine && this.colorEngine.clearPureColor) {
      this.colorEngine.clearPureColor();
    }
  }

  // =========================================================================
  // 22. Global Window Acrylic Glass Opacity System
  // =========================================================================
  updateDesktopReveal(value) {
    const amount = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    document.documentElement.style.setProperty('--desktop-reveal', amount / 100);
    const slider = document.getElementById('setting-desktop-reveal');
    const label = document.getElementById('lbl-desktop-reveal');
    if (slider) slider.value = amount;
    if (label) label.textContent = amount + '%';
    try { localStorage.setItem('glasswave_desktop_reveal', amount); } catch (e) {}
  }

  initWindowGlassOpacity() {
    this.updateDesktopReveal(localStorage.getItem('glasswave_desktop_reveal') || 0);
    const desktopSlider = document.getElementById('setting-desktop-reveal');
    if (desktopSlider) desktopSlider.addEventListener('input', e => this.updateDesktopReveal(e.target.value));
    const slider = document.getElementById('setting-window-glass-ratio');
    const btnReset = document.getElementById('btn-reset-window-glass');

    const saved = localStorage.getItem('glasswave_window_glass_ratio');
    const initialVal = saved !== null ? Number(saved) : 0;
    this.updateWindowGlassRatio(initialVal);

    if (slider) {
      slider.value = initialVal;
      slider.oninput = (e) => {
        const val = Number(e.target.value);
        this.updateWindowGlassRatio(val);
      };
    }

    if (btnReset) {
      btnReset.onclick = () => {
        this.updateWindowGlassRatio(0);
      };
    }
  }

  updateWindowGlassRatio(ratio) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(ratio) || 0)));
    const decimal = Number((clamped / 100).toFixed(4));
    const slider = document.getElementById('setting-window-glass-ratio');
    const label = document.getElementById('lbl-window-glass-ratio');

    if (slider) slider.value = clamped;
    if (label) {
      if (clamped === 0) {
        label.textContent = '0%';
      } else if (clamped === 100) {
        label.textContent = '100%';
      } else {
        label.textContent = `${clamped}%`;
      }
    }

    document.documentElement.style.setProperty('--window-glass-ratio', decimal);

    document.body.classList.add('window-glass-active');
    document.documentElement.classList.add('window-glass-active');

    if (clamped >= 80) {
      document.body.classList.add('window-glass-full');
      document.documentElement.classList.add('window-glass-full');
    } else {
      document.body.classList.remove('window-glass-full');
      document.documentElement.classList.remove('window-glass-full');
    }

    try {
      localStorage.setItem('glasswave_window_glass_ratio', clamped);
    } catch (e) {}
  }

  async chooseCustomWallpaper() {
    if (!window.glasswaveAPI || !window.glasswaveAPI.chooseWallpaperImage) return;
    try {
      const filePath = await window.glasswaveAPI.chooseWallpaperImage();
      if (filePath) {
        // Automatically set picture-first default parameters (Requirement 1)
        this.setPictureFirstDefaults();
        this.applyCustomWallpaper(filePath, true);
      }
    } catch (e) {
      console.warn('Failed to choose custom wallpaper:', e);
    }
  }

  applyCustomWallpaper(filePath, saveToStorage = true) {
    if (!filePath) return;
    const bgLayer = document.getElementById('custom-bg-layer');
    const bgImage = document.getElementById('custom-bg-image');
    const btnReset = document.getElementById('btn-reset-custom-bg');
    const popReset = document.getElementById('pop-reset-bg');
    const statusLabel = document.getElementById('custom-bg-status');

    const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;

    if (bgImage) {
      bgImage.style.backgroundImage = `url("${fileUrl}")`;
    }
    if (bgLayer) {
      bgLayer.classList.add('active');
    }
    document.body.classList.add('custom-wallpaper-active');

    if (saveToStorage) {
      try {
        localStorage.setItem('glasswave_custom_bg', filePath);
      } catch (e) {}
    }

    if (btnReset) btnReset.style.display = 'inline-flex';
    if (popReset) popReset.style.display = 'flex';
    if (statusLabel) {
      const fileName = filePath.split(/[/\\]/).pop();
      statusLabel.textContent = `当前壁纸：${fileName}`;
    }

    // Refresh parallax instance reference
    if (this.parallax && this.parallax.updateCustomBgRef) {
      this.parallax.updateCustomBgRef();
    }
  }

  resetCustomWallpaper() {
    this.colorEngine?.clearPureColor();
    this.colorEngine?.setGlowEnabled(true);
    this.colorEngine?.setGlowMode('multi');
    this.colorEngine?.setBlobCount(4);
    this.colorEngine?.setSpeedMultiplier(1);
    this.colorEngine?.setIntensityMultiplier(1);
    window.GlassWaveTheme?.setBackground('#080c16');
    this.bindAmbientGlowControls();
    const bgLayer = document.getElementById('custom-bg-layer');
    const bgImage = document.getElementById('custom-bg-image');
    const btnReset = document.getElementById('btn-reset-custom-bg');
    const popReset = document.getElementById('pop-reset-bg');
    const statusLabel = document.getElementById('custom-bg-status');

    if (bgLayer) {
      bgLayer.classList.remove('active');
    }
    if (bgImage) {
      bgImage.style.backgroundImage = '';
    }
    document.body.classList.remove('custom-wallpaper-active', 'custom-wallpaper-pure', 'wallpaper-tint-zero');

    // 1. Fully restore Theme & Filter Tint Degree to 100% (深度融入主题光 / 默认流光环境)
    this.updateWallpaperTintDegree(100);
    this.updateWallpaperPureRatio(0);

    // 2. Fully restore Wallpaper Opacity to 100% (1.0 - 实体不透明)
    this.updateWallpaperOpacity(1.0);

    // 3. Reset only wallpaper geometry; interface transparency is independent.
    this.updateWallpaperZoom(100, true);
    this.resetWallpaperFocusPosition();
    this.resetWallpaperRotation();

    // Reset blur to default (14px)
    this.updateWallpaperBlur(14);
    const blurSlider = document.getElementById('setting-bg-blur');
    if (blurSlider) blurSlider.value = 14;

    // Reset pure color selection if active
    const activePure = document.querySelector('.pure-color-swatch.active');
    if (activePure) activePure.classList.remove('active');

    // Reset background cutout to off and clear both saved thresholds.
    this.updateWallpaperLumaThreshold(0, 'cutout');

    try {
      localStorage.removeItem('glasswave_custom_bg');
      localStorage.removeItem('glasswave_bg_rotate');
      localStorage.removeItem('glasswave_bg_zoom');
      localStorage.removeItem('glasswave_bg_blur');
      localStorage.removeItem('glasswave_pure_color');
      localStorage.removeItem('glasswave_bg_luma_threshold');
      localStorage.removeItem('glasswave_bg_white_threshold');
      localStorage.removeItem('glasswave_bg_key_color');
      localStorage.removeItem('glasswave_bg_luma_mode');
    } catch (e) {}

    // Permanent small red button: always keep displayed
    if (btnReset) btnReset.style.display = 'inline-flex';
    if (popReset) popReset.style.display = 'flex';
    if (statusLabel) {
      statusLabel.textContent = '当前：默认流体光效';
    }
    this.showToast('已恢复默认背景光球，视觉模式设置保持不变');
  }

  // =========================================================================
  // 22. Visualizer Position & Scale Customization (Requirement 2 & Fullscreen Expansion)
  // =========================================================================
  bindVisualizerCustomization() {
    if (!this.visualizer) return;
    const key = 'glasswave_visualizer_mode_controls_v1';
    const initialMode = this.visualizer.mode;
    let savedMap = null;
    try { savedMap = JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) {}
    this.visualizerModeControls = savedMap && typeof savedMap === 'object' && !Array.isArray(savedMap) ? savedMap : {};

    // Migrate the old global sliders into the mode that was active at startup.
    const legacyPosition = localStorage.getItem('glasswave_vis_pos');
    const legacyOffset = localStorage.getItem('glasswave_vis_offset_y');
    const legacyScale = localStorage.getItem('glasswave_vis_scale');
    const hasLegacy = legacyPosition !== null || legacyOffset !== null || legacyScale !== null;
    if (!savedMap && hasLegacy) {
      this.visualizerModeControls[initialMode] = {
        ...(legacyPosition !== null ? { position: legacyPosition } : {}),
        ...(legacyOffset !== null ? { offsetY: Number(legacyOffset) } : {}),
        ...(legacyScale !== null ? { scale: Number(legacyScale) } : {})
      };
      try { localStorage.setItem(key, JSON.stringify(this.visualizerModeControls)); } catch (e) {}
    }
    this.applyVisualizerModeControls(initialMode);

    document.querySelectorAll('.vis-pos-btn').forEach(button => {
      button.onclick = () => {
        const position = button.dataset.pos;
        this.visualizer.setPositionPreset(position);
        this.saveVisualizerModeControls({ position });
        this.syncVisualizerCustomizationUI();
      };
    });
    const bindSlider = (id, field, setter) => {
      const slider = document.getElementById(id);
      if (!slider) return;
      slider.oninput = () => {
        const value = Number(slider.value);
        setter.call(this.visualizer, value);
        this.saveVisualizerModeControls({ [field]: value });
        this.syncVisualizerCustomizationUI();
      };
    };
    bindSlider('setting-intensity', 'intensity', this.visualizer.setIntensity);
    bindSlider('setting-vis-offset-y', 'offsetY', this.visualizer.setOffsetY);
    bindSlider('setting-vis-scale', 'scale', this.visualizer.setScale);

    // Migrate native sensitivity too; the old slider stored it only in config.
    if (!savedMap && window.glasswaveAPI?.getConfig) {
      window.glasswaveAPI.getConfig().then(config => {
        if (!config || this._visualizerModeControlsChanged) return;
        if (config.visualizerModeControls && typeof config.visualizerModeControls === 'object' && Object.keys(config.visualizerModeControls).length) {
          this.visualizerModeControls = config.visualizerModeControls;
        } else {
          const legacy = this.visualizerModeControls[initialMode] || {};
          this.visualizerModeControls[initialMode] = {
            intensity: config.visualizerIntensity,
            position: legacy.position ?? config.visualizerPosition,
            offsetY: legacy.offsetY ?? config.visualizerOffsetY,
            scale: legacy.scale ?? config.visualizerScale
          };
        }
        try { localStorage.setItem(key, JSON.stringify(this.visualizerModeControls)); } catch (e) {}
        if (this.visualizer.mode === initialMode) this.applyVisualizerModeControls(initialMode);
      }).catch(() => {});
    }
  }

  syncVisualizerCustomizationUI() {
    if (!this.visualizer) return;
    this.syncIntensityControl(this.visualizer.intensity);
    const pos = this.visualizer.positionPreset || this.visualizer.getDefaultPositionForMode(this.visualizer.mode);
    const offsetY = this.visualizer.offsetY || 0;
    const scale = this.visualizer.visScale || 1.25;

    const posButtons = document.querySelectorAll('.vis-pos-btn');
    posButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pos === pos);
    });

    const offsetYSlider = document.getElementById('setting-vis-offset-y');
    const offsetYLabel = document.getElementById('lbl-vis-offset-y');
    if (offsetYSlider) offsetYSlider.value = offsetY;
    if (offsetYLabel) offsetYLabel.textContent = `${offsetY > 0 ? '+' : ''}${offsetY}px`;

    const scaleSlider = document.getElementById('setting-vis-scale');
    const scaleLabel = document.getElementById('lbl-vis-scale');
    if (scaleSlider) scaleSlider.value = scale;
    if (scaleLabel) {
      scaleLabel.textContent = (Math.round(scale * 100) / 100).toFixed(2).replace(/\.?0+$/, '') + 'x';
    }
  }

  // =========================================================================
  // 24. Visualizer Dedicated Drawer & Fine-Tuning Controls (All 6 Modes + Audio Response)
  // =========================================================================
  bindVisualizerTuning() {
    if (!this.visualizer) return;

    const tuneTabs = document.querySelectorAll('.vis-tune-tab');
    const sections = {
      wave: document.getElementById('vis-tune-sec-wave'),
      spectrum: document.getElementById('vis-tune-sec-spectrum'),
      sphere: document.getElementById('vis-tune-sec-sphere'),
      bars: document.getElementById('vis-tune-sec-bars'),
      orb: document.getElementById('vis-tune-sec-orb'),
      ambient: document.getElementById('vis-tune-sec-ambient'),
      reactive: document.getElementById('vis-tune-sec-reactive'),
      curtain: document.getElementById('vis-tune-sec-curtain'),
      audio: document.getElementById('vis-tune-sec-audio')
    };

    let activeTuneMode = 'wave';
    const sharedModeControls = document.getElementById('vis-mode-common-controls');

    const switchTuneMode = (mode, syncLiveVis = true) => {
      if (!sections[mode]) return;
      activeTuneMode = mode;
      tuneTabs.forEach(t => t.classList.toggle('active', t.dataset.tuneMode === mode));
      if (mode !== 'audio' && sharedModeControls) sections[mode].prepend(sharedModeControls);
      Object.keys(sections).forEach(k => {
        if (sections[k]) sections[k].style.display = (k === mode ? 'block' : 'none');
      });
      if (syncLiveVis && this.visualizer && mode !== 'audio') {
        this.switchVisualizerMode(mode);
      }
      if (mode !== 'audio') this.syncVisualizerTuningUI();
    };
    this.selectVisualizerTuneMode = switchTuneMode;
    switchTuneMode(this.visualizer.mode, false);

    tuneTabs.forEach(tab => {
      tab.onclick = () => {
        const m = tab.dataset.tuneMode;
        if (m) switchTuneMode(m, true);
      };
    });

    const btnOpenVisAdv = document.getElementById('btn-open-vis-advanced');
    if (btnOpenVisAdv) {
      btnOpenVisAdv.onclick = () => {
        this.toggleSettingsDrawer(false);
        this.toggleVisualizerDrawer();
        const curMode = this.visualizer?.mode;
        if (curMode && ['wave', 'spectrum', 'sphere', 'bars', 'orb', 'ambient', 'reactive', 'curtain'].includes(curMode)) {
          switchTuneMode(curMode, false);
        }
      };
    }

    const btnBackMain = document.getElementById('btn-back-settings-main');
    if (btnBackMain) {
      btnBackMain.onclick = () => {
        this.toggleVisualizerDrawer(false);
        this.toggleSettingsDrawer(true);
      };
    }

    const btnCloseVisDrawer = document.getElementById('btn-close-vis-drawer');
    if (btnCloseVisDrawer) {
      btnCloseVisDrawer.onclick = () => {
        this.toggleVisualizerDrawer(false);
      };
    }

    const btnVisTuneShortcut = document.getElementById('btn-vis-tune-shortcut');
    if (btnVisTuneShortcut) {
      btnVisTuneShortcut.onclick = (e) => {
        e.stopPropagation();
        this.toggleVisualizerDrawer();
      };
    }

    // Direct wheel scrolling on Visualizer Drawer
    const visDrawer = document.getElementById('view-visualizer-drawer');
    if (visDrawer) {
      visDrawer.addEventListener('wheel', (e) => {
        const sContent = visDrawer.querySelector('.settings-content');
        if (sContent) {
          e.stopPropagation();
          const step = e.deltaMode === 1 ? e.deltaY * 40 : (e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY);
          sContent.scrollTop += step;
          e.preventDefault();
        }
      }, { passive: false });
    }

    // Helpers for binding controls
    const bindSlider = (id, labelId, mode, key, formatFn, parseFn = parseFloat) => {
      const slider = document.getElementById(id);
      const label = document.getElementById(labelId);
      if (!slider) return;

      slider.addEventListener('input', (e) => {
        const val = parseFn(e.target.value);
        this.visualizer.setTuningParam(mode, key, val);
        if (label) label.textContent = formatFn(val);
      });
    };

    const bindSelect = (id, mode, key) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', (e) => {
        this.visualizer.setTuningParam(mode, key, e.target.value);
        this.syncCurveControlVisibility();
      });
    };

    const bindToggle = (id, labelId, mode, key, onText = '开启', offText = '关闭') => {
      const el = document.getElementById(id);
      const lbl = document.getElementById(labelId);
      if (!el) return;
      el.addEventListener('change', (e) => {
        const checked = e.target.checked;
        this.visualizer.setTuningParam(mode, key, checked);
        if (lbl) lbl.textContent = checked ? onText : offText;
      });
    };

    const palette = document.getElementById('vis-palette');
    const solid = document.getElementById('vis-solid-color');
    if (palette) palette.addEventListener('change', () => { this.visualizer.setPalette(palette.value); this.syncVisualizerTuningUI(); });
    if (solid) solid.addEventListener('input', () => { this.visualizer.setSolidColor(solid.value); this.syncVisualizerTuningUI(); });
    document.querySelectorAll('[data-vis-solid]').forEach(button => button.addEventListener('click', () => {
      this.visualizer.setSolidColor(button.dataset.visSolid); this.syncVisualizerTuningUI();
    }));

    bindSlider('vis-wave-density','lbl-vis-wave-density','wave','density',v=>Number(v).toFixed(1));
    bindSlider('vis-reactive-density','lbl-vis-reactive-density','reactive','density',v=>Number(v).toFixed(1));
    bindSlider('vis-wave-response','lbl-vis-wave-response','wave','response',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-response','lbl-vis-reactive-response','reactive','response',v=>Math.round(v*100)+'%');
    bindSlider('vis-wave-gain','lbl-vis-wave-gain','wave','gain',v=>Number(v).toFixed(2));
    bindSlider('vis-wave-detail','lbl-vis-wave-detail','wave','detail',v=>Number(v).toFixed(2));
    bindSlider('vis-wave-divergence','lbl-vis-wave-divergence','wave','divergence',v=>Number(v).toFixed(2));
    bindSlider('vis-reactive-gain','lbl-vis-reactive-gain','reactive','gain',v=>Number(v).toFixed(2));
    bindSlider('vis-reactive-detail','lbl-vis-reactive-detail','reactive','detail',v=>Number(v).toFixed(2));
    bindSlider('vis-reactive-divergence','lbl-vis-reactive-divergence','reactive','divergence',v=>Number(v).toFixed(2));
    bindSlider('vis-wave-separation','lbl-vis-wave-separation','wave','separation',v=>Math.round(v*100)+'%');
    bindSlider('vis-wave-idleMotion','lbl-vis-wave-idleMotion','wave','idleMotion',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-separation','lbl-vis-reactive-separation','reactive','separation',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-idleMotion','lbl-vis-reactive-idleMotion','reactive','idleMotion',v=>Math.round(v*100)+'%');
    bindSlider('vis-wave-flowSeparation','lbl-vis-wave-flowSeparation','wave','flowSeparation',v=>Math.round(v*100)+'%');
    bindSlider('vis-wave-driftSpeed','lbl-vis-wave-driftSpeed','wave','driftSpeed',v=>Math.round(v*100)+'%');
    bindSelect('vis-wave-driftDirection','wave','driftDirection');
    bindSlider('vis-reactive-flowSeparation','lbl-vis-reactive-flowSeparation','reactive','flowSeparation',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-driftSpeed','lbl-vis-reactive-driftSpeed','reactive','driftSpeed',v=>Math.round(v*100)+'%');
    bindSelect('vis-reactive-driftDirection','reactive','driftDirection');
    bindSlider('vis-wave-curveSmooth','lbl-vis-wave-curveSmooth','wave','curveSmooth',v=>Math.round(v*100)+'%');
    bindSlider('vis-wave-edgeStability','lbl-vis-wave-edgeStability','wave','edgeStability',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-curveSmooth','lbl-vis-reactive-curveSmooth','reactive','curveSmooth',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-edgeStability','lbl-vis-reactive-edgeStability','reactive','edgeStability',v=>Math.round(v*100)+'%');
    bindSelect('vis-sphere-lightMode','sphere','lightMode');
    bindSlider('vis-sphere-lightSensitivity','lbl-vis-sphere-lightSensitivity','sphere','lightSensitivity',v=>Number(v).toFixed(2));
    bindSlider('vis-sphere-lightDecay','lbl-vis-sphere-lightDecay','sphere','lightDecay',v=>Number(v).toFixed(2));
    bindSlider('vis-sphere-idleLight','lbl-vis-sphere-idleLight','sphere','idleLight',v=>Number(v).toFixed(2));
    bindSelect('vis-wave-style','wave','style');
    bindSlider('vis-wave-musicMix','lbl-vis-wave-musicMix','wave','musicMix',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-musicMix','lbl-vis-reactive-musicMix','reactive','musicMix',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-glow','lbl-vis-reactive-glow','reactive','glow',v=>Math.round(v*100)+'%');
    bindSlider('vis-reactive-spread','lbl-vis-reactive-spread','reactive','spread',v=>Math.round(v*100)+'%');
    bindSelect('vis-reactive-layout', 'reactive', 'layout');
    bindSlider('vis-reactive-strength', 'lbl-vis-reactive-strength', 'reactive', 'strength', v => Number(v).toFixed(2));
    bindSlider('vis-reactive-smoothing', 'lbl-vis-reactive-smoothing', 'reactive', 'smoothing', v => Number(v).toFixed(2));
    bindSlider('vis-reactive-lineWidth', 'lbl-vis-reactive-lineWidth', 'reactive', 'lineWidth', v => Number(v).toFixed(2));
    bindSlider('vis-curtain-strength', 'lbl-vis-curtain-strength', 'curtain', 'strength', v => Number(v).toFixed(2));
    bindSlider('vis-curtain-width', 'lbl-vis-curtain-width', 'curtain', 'width', v => Number(v).toFixed(2));
    bindSlider('vis-curtain-speed', 'lbl-vis-curtain-speed', 'curtain', 'speed', v => Number(v).toFixed(2));

    // 0. Visual Quality & Target FPS Selectors
    const qSelect = document.getElementById('vis-quality-select');
    if (qSelect) {
      qSelect.addEventListener('change', (e) => {
        this.visualizer.setQuality(e.target.value);
      });
    }

    const fpsSelect = document.getElementById('vis-target-fps-select');
    if (fpsSelect) {
      fpsSelect.value = String(this.visualizer.tuning?.targetFps || 90);
      fpsSelect.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        this.visualizer.setTargetFps(val);
      });
    }

    if (!this._liveFpsInterval) {
      this._liveFpsInterval = setInterval(() => {
        const badge = document.getElementById('vis-live-fps-badge');
        if (badge && this.visualizer) {
          const fps = Math.round(this.visualizer.currentFps || 60);
          badge.textContent = `实时 ${fps} FPS`;
        }
      }, 400);
    }

    // 1. Waveform Sliders & Anti-Moiré Controls
    const chkAntiMoire = document.getElementById('vis-tune-wave-anti-moire');
    if (chkAntiMoire) {
      chkAntiMoire.checked = this.visualizer.tuning?.wave?.antiMoire !== false;
      chkAntiMoire.addEventListener('change', (e) => {
        this.visualizer.setTuningParam('wave', 'antiMoire', e.target.checked);
      });
    }
    bindSlider('vis-tune-wave-moire-damping', 'lbl-vis-tune-wave-moire-damping', 'wave', 'moireDamping', (v) => `${Math.round(v * 100)}%`);

    bindSlider('vis-tune-wave-line-width', 'lbl-vis-tune-wave-line-width', 'wave', 'lineWidth', (v) => `${Number(v).toFixed(1)}px`);
    bindSlider('vis-tune-wave-amplitude', 'lbl-vis-tune-wave-amplitude', 'wave', 'amplitude', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-pitch', 'lbl-vis-tune-wave-pitch', 'wave', 'perspectivePitch', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-wave-yaw', 'lbl-vis-tune-wave-yaw', 'wave', 'yaw', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-wave-tilt', 'lbl-vis-tune-wave-tilt', 'wave', 'tilt', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-wave-smoothing', 'lbl-vis-tune-wave-smoothing', 'wave', 'smoothing', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-line-count', 'lbl-vis-tune-wave-line-count', 'wave', 'lineCount', (v) => `${Math.round(v)} 条`, parseInt);
    bindSlider('vis-tune-wave-depth-len', 'lbl-vis-tune-wave-depth-len', 'wave', 'depthLength', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-span', 'lbl-vis-tune-wave-span', 'wave', 'horizontalSpan', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-near-width', 'lbl-vis-tune-wave-near-width', 'wave', 'nearLineWidth', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-far-fade', 'lbl-vis-tune-wave-far-fade', 'wave', 'farFade', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-flow-speed', 'lbl-vis-tune-wave-flow-speed', 'wave', 'flowSpeed', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-wave-glow', 'lbl-vis-tune-wave-glow', 'wave', 'glowBlur', (v) => `${Math.round(v)}px`, parseInt);
    bindSlider('vis-tune-wave-companion', 'lbl-vis-tune-wave-companion', 'wave', 'companionAlpha', (v) => `${Math.round(v * 100)}%`);

    // 2. Circular Spectrum Sliders & Controls
    bindSlider('vis-tune-spec-inner-radius', 'lbl-vis-tune-spec-inner-radius', 'spectrum', 'innerRadiusRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-spec-bar-len', 'lbl-vis-tune-spec-bar-len', 'spectrum', 'barLengthRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-spec-bar-width', 'lbl-vis-tune-spec-bar-width', 'spectrum', 'barWidth', (v) => `${Number(v).toFixed(1)}px`);
    bindSlider('vis-tune-spec-bar-count', 'lbl-vis-tune-spec-bar-count', 'spectrum', 'barCount', (v) => `${v} 柱`, parseInt);
    bindSlider('vis-tune-spec-rot', 'lbl-vis-tune-spec-rot', 'spectrum', 'rotAngle', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-spec-smooth', 'lbl-vis-tune-spec-smooth', 'spectrum', 'smoothFactor', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-spec-compression', 'lbl-vis-tune-spec-compression', 'spectrum', 'radialCompression', (v) => `${Math.round(v * 100)}%`);
    bindSelect('vis-tune-spec-symmetry', 'spectrum', 'symmetry');
    bindSlider('vis-tune-spec-taper', 'lbl-vis-tune-spec-taper', 'spectrum', 'taper', (v) => `${Math.round(v * 100)}%`);

    // 3. Spherical 3D Spectrum Sliders & Controls
    bindSlider('vis-tune-sphere-radius', 'lbl-vis-tune-sphere-radius', 'sphere', 'radiusRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-sphere-rot-speed', 'lbl-vis-tune-sphere-rot-speed', 'sphere', 'rotSpeed', (v) => `${Number(v).toFixed(1)}x`);
    bindSlider('vis-tune-sphere-core-glow', 'lbl-vis-tune-sphere-core-glow', 'sphere', 'coreGlow', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-sphere-node-size', 'lbl-vis-tune-sphere-node-size', 'sphere', 'nodeSize', (v) => `${Math.round(v * 100)}%`);
    bindSelect('vis-tune-sphere-symmetry', 'sphere', 'symmetry');
    bindSlider('vis-tune-sphere-rot', 'lbl-vis-tune-sphere-rot', 'sphere', 'rotAngle', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-sphere-bass-diff', 'lbl-vis-tune-sphere-bass-diff', 'sphere', 'bassDiffusion', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-sphere-smooth', 'lbl-vis-tune-sphere-smooth', 'sphere', 'sphereSmoothing', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-sphere-back-alpha', 'lbl-vis-tune-sphere-back-alpha', 'sphere', 'backAlpha', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-sphere-depth', 'lbl-vis-tune-sphere-depth', 'sphere', 'depthRatio', (v) => `${Math.round(v * 100)}%`);

    // 4. Horizontal Bars Sliders & Controls
    bindSlider('vis-tune-bars-width', 'lbl-vis-tune-bars-width', 'bars', 'barWidthRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-bars-height', 'lbl-vis-tune-bars-height', 'bars', 'heightRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-bars-reflection', 'lbl-vis-tune-bars-reflection', 'bars', 'reflectionAlpha', (v) => `${Math.round(v * 100)}%`);
    bindToggle('vis-tune-bars-peak-hold', 'lbl-vis-tune-bars-peak-hold', 'bars', 'peakHold');
    bindSelect('vis-tune-bars-freq-order', 'bars', 'freqOrder');
    bindSlider('vis-tune-bars-count', 'lbl-vis-tune-bars-count', 'bars', 'barCount', (v) => `${Math.round(v)} 柱`, parseInt);
    bindSlider('vis-tune-bars-gap', 'lbl-vis-tune-bars-gap', 'bars', 'barGap', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-bars-corner', 'lbl-vis-tune-bars-corner', 'bars', 'cornerRadius', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-bars-peak-hold-ms', 'lbl-vis-tune-bars-peak-hold-ms', 'bars', 'peakHoldMs', (v) => `${Math.round(v)}ms`, parseInt);
    bindSlider('vis-tune-bars-peak-decay', 'lbl-vis-tune-bars-peak-decay', 'bars', 'peakDecaySpeed', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-bars-ref-soft', 'lbl-vis-tune-bars-ref-soft', 'bars', 'reflectionSoftness', (v) => `${Math.round(v * 100)}%`);

    // 5. Particle Field Sliders & Controls
    bindSlider('vis-tune-orb-count', 'lbl-vis-tune-orb-count', 'orb', 'particleCount', (v) => `${Math.round(v)}`, parseInt);
    bindSlider('vis-tune-orb-size', 'lbl-vis-tune-orb-size', 'orb', 'size', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-depth', 'lbl-vis-tune-orb-depth', 'orb', 'depthRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-horizon', 'lbl-vis-tune-orb-horizon', 'orb', 'horizonRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-spread', 'lbl-vis-tune-orb-spread', 'orb', 'perspectiveSpread', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-direction', 'lbl-vis-tune-orb-direction', 'orb', 'viewDirection', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-orb-rot', 'lbl-vis-tune-orb-rot', 'orb', 'fieldRotation', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-orb-speed', 'lbl-vis-tune-orb-speed', 'orb', 'speed', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-turb', 'lbl-vis-tune-orb-turb', 'orb', 'turbulence', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-music-inf', 'lbl-vis-tune-orb-music-inf', 'orb', 'musicInfluence', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-bass-thrust', 'lbl-vis-tune-orb-bass-thrust', 'orb', 'bassThrust', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-fg-blur', 'lbl-vis-tune-orb-fg-blur', 'orb', 'fgBlur', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-orb-far-alpha', 'lbl-vis-tune-orb-far-alpha', 'orb', 'farAlpha', (v) => `${Math.round(v * 100)}%`);

    // 6. Flow Field Sliders & Controls
    bindSlider('vis-tune-ambient-count', 'lbl-vis-tune-ambient-count', 'ambient', 'ribbonCount', (v) => `${Math.round(v)} 条`, parseInt);
    bindSlider('vis-tune-ambient-width', 'lbl-vis-tune-ambient-width', 'ambient', 'ribbonWidth', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-trail', 'lbl-vis-tune-ambient-trail', 'ambient', 'trailLength', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-speed', 'lbl-vis-tune-ambient-speed', 'ambient', 'speed', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-curve', 'lbl-vis-tune-ambient-curve', 'ambient', 'curvature', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-turb', 'lbl-vis-tune-ambient-turb', 'ambient', 'turbulence', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-dir', 'lbl-vis-tune-ambient-dir', 'ambient', 'direction', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-ambient-spread', 'lbl-vis-tune-ambient-spread', 'ambient', 'spreadAngle', (v) => `${Math.round(v)}°`, parseInt);
    bindSlider('vis-tune-ambient-inertia', 'lbl-vis-tune-ambient-inertia', 'ambient', 'inertia', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-depth', 'lbl-vis-tune-ambient-depth', 'ambient', 'depthRatio', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-music-inf', 'lbl-vis-tune-ambient-music-inf', 'ambient', 'musicInfluence', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-glow', 'lbl-vis-tune-ambient-glow', 'ambient', 'glowIntensity', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-ambient-fade', 'lbl-vis-tune-ambient-fade', 'ambient', 'fadeSpeed', (v) => `${Math.round(v * 100)}%`);
    bindToggle('vis-tune-ambient-orbs', 'lbl-vis-tune-ambient-orbs', 'ambient', 'enableOrbs');

    // 7. Audio Response Sliders & Controls
    bindSlider('vis-tune-audio-smooth', 'lbl-vis-tune-audio-smooth', 'audioResponse', 'smoothFactor', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-audio-attack', 'lbl-vis-tune-audio-attack', 'audioResponse', 'attackMs', (v) => `${Math.round(v)}ms`, parseInt);
    bindSlider('vis-tune-audio-release', 'lbl-vis-tune-audio-release', 'audioResponse', 'releaseMs', (v) => `${Math.round(v)}ms`, parseInt);
    bindSlider('vis-tune-audio-comp', 'lbl-vis-tune-audio-comp', 'audioResponse', 'compression', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-audio-bass', 'lbl-vis-tune-audio-bass', 'audioResponse', 'bassScale', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-audio-mid', 'lbl-vis-tune-audio-mid', 'audioResponse', 'midScale', (v) => `${Math.round(v * 100)}%`);
    bindSlider('vis-tune-audio-high', 'lbl-vis-tune-audio-high', 'audioResponse', 'highScale', (v) => `${Math.round(v * 100)}%`);
    bindSelect('vis-tune-audio-dist', 'audioResponse', 'distribution');
    bindSelect('vis-tune-audio-soft', 'audioResponse', 'peakSoftening');

    // Reset Buttons
    const btnResetCurrent = document.getElementById('btn-reset-current-mode-tuning');
    if (btnResetCurrent) {
      btnResetCurrent.onclick = () => {
        const modeMap = {
          wave: '波形',
          spectrum: '环形',
          sphere: '球形',
          bars: '柱谱',
          orb: '粒子',
          ambient: '流光', reactive: '律动线', curtain: '光幕',
          audio: '音频响应'
        };
        this.visualizer.resetModeTuning(activeTuneMode);
        if (activeTuneMode !== 'audio') {
          this.saveVisualizerModeControls(this.getDefaultVisualizerModeControls(activeTuneMode), activeTuneMode);
          this.applyVisualizerModeControls(activeTuneMode);
        }
        this.syncVisualizerTuningUI();
        this.showToast(`✨ 已恢复当前【${modeMap[activeTuneMode] || activeTuneMode}】微调参数为默认值`);
      };
    }

    const btnResetAll = document.getElementById('btn-reset-all-vis-tuning');
    if (btnResetAll) {
      btnResetAll.onclick = () => {
        this.visualizer.resetAllVisualTuning();
        this.visualizerModeControls = {};
        this._visualizerModeControlsChanged = true;
        try { localStorage.setItem('glasswave_visualizer_mode_controls_v1', '{}'); } catch (e) {}
        clearTimeout(this._saveVisualizerModeControlsTimer);
        window.glasswaveAPI?.saveConfig?.({ visualizerModeControls: {} });
        this.applyVisualizerModeControls();
        this.syncVisualizerTuningUI();
        this.showToast('✨ 已恢复全部视觉模式及音频响应为出厂默认值');
      };
    }

    // Keep legacy reset button functional for existing Test 76
    const btnResetTuning = document.getElementById('btn-reset-vis-tuning');
    if (btnResetTuning) {
      btnResetTuning.onclick = () => {
        this.visualizer.resetTuning();
        this.syncVisualizerTuningUI();
        this.showToast('✨ 视觉微调已重置为出厂默认值');
      };
    }

    // Initial sync
    this.syncVisualizerTuningUI();
  }

  syncCurveControlVisibility() {
    for(const mode of ['wave','reactive']){
      const style=mode==='wave'?this.visualizer.tuning.wave.style:this.visualizer.tuning.reactive.layout;
      document.querySelectorAll('#vis-tune-sec-'+mode+' [data-curve-style]').forEach(row=>{
        const allowed=row.dataset.curveStyle;
        row.style.setProperty('display',(allowed==='all'||allowed===style||(allowed==='legacy'&&style!=='ribbon'))?'':'none','important');
      });
    }
  }

  syncVisualizerTuningUI() {
    this.syncCurveControlVisibility();
    if (!this.visualizer || !this.visualizer.tuning) return;
    const t = this.visualizer.tuning;

    const setSliderVal = (id, labelId, val, formatFn) => {
      const slider = document.getElementById(id);
      const label = document.getElementById(labelId);
      if (slider && val !== undefined) slider.value = val;
      if (label && val !== undefined) label.textContent = formatFn(val);
    };

    const setSelectVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined) el.value = val;
    };

    const setToggleVal = (id, labelId, checked, onText = '开启', offText = '关闭') => {
      const el = document.getElementById(id);
      const lbl = document.getElementById(labelId);
      if (el && checked !== undefined) el.checked = !!checked;
      if (lbl && checked !== undefined) lbl.textContent = checked ? onText : offText;
    };

    const modeColor = t.modeColors?.[this.visualizer.mode] || { palette: t.palette, solidColor: t.solidColor };
    setSelectVal('vis-palette', modeColor.palette || 'original');
    const solidInput = document.getElementById('vis-solid-color');
    if (solidInput) solidInput.value = modeColor.solidColor || '#38bdf8';
    document.querySelectorAll('[data-vis-solid]').forEach(button => {
      const active = modeColor.palette === 'solid' && button.dataset.visSolid === modeColor.solidColor;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    setSliderVal('vis-wave-density','lbl-vis-wave-density',t.wave.density,v=>Number(v).toFixed(1));
    setSliderVal('vis-reactive-density','lbl-vis-reactive-density',t.reactive.density,v=>Number(v).toFixed(1));
    setSliderVal('vis-wave-response','lbl-vis-wave-response',t.wave.response,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-response','lbl-vis-reactive-response',t.reactive.response,v=>Math.round(v*100)+'%');
    setSliderVal('vis-wave-gain','lbl-vis-wave-gain',t.wave.gain,v=>Number(v).toFixed(2));
    setSliderVal('vis-wave-detail','lbl-vis-wave-detail',t.wave.detail,v=>Number(v).toFixed(2));
    setSliderVal('vis-wave-divergence','lbl-vis-wave-divergence',t.wave.divergence,v=>Number(v).toFixed(2));
    setSliderVal('vis-reactive-gain','lbl-vis-reactive-gain',t.reactive.gain,v=>Number(v).toFixed(2));
    setSliderVal('vis-reactive-detail','lbl-vis-reactive-detail',t.reactive.detail,v=>Number(v).toFixed(2));
    setSliderVal('vis-reactive-divergence','lbl-vis-reactive-divergence',t.reactive.divergence,v=>Number(v).toFixed(2));
    setSliderVal('vis-wave-separation','lbl-vis-wave-separation',t.wave.separation,v=>Math.round(v*100)+'%');
    setSliderVal('vis-wave-idleMotion','lbl-vis-wave-idleMotion',t.wave.idleMotion,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-separation','lbl-vis-reactive-separation',t.reactive.separation,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-idleMotion','lbl-vis-reactive-idleMotion',t.reactive.idleMotion,v=>Math.round(v*100)+'%');
    setSliderVal('vis-wave-flowSeparation','lbl-vis-wave-flowSeparation',t.wave.flowSeparation,v=>Math.round(v*100)+'%');
    setSliderVal('vis-wave-driftSpeed','lbl-vis-wave-driftSpeed',t.wave.driftSpeed,v=>Math.round(v*100)+'%');
    setSelectVal('vis-wave-driftDirection',t.wave.driftDirection);
    setSliderVal('vis-reactive-flowSeparation','lbl-vis-reactive-flowSeparation',t.reactive.flowSeparation,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-driftSpeed','lbl-vis-reactive-driftSpeed',t.reactive.driftSpeed,v=>Math.round(v*100)+'%');
    setSelectVal('vis-reactive-driftDirection',t.reactive.driftDirection);
    setSliderVal('vis-wave-curveSmooth','lbl-vis-wave-curveSmooth',t.wave.curveSmooth,v=>Math.round(v*100)+'%');
    setSliderVal('vis-wave-edgeStability','lbl-vis-wave-edgeStability',t.wave.edgeStability,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-curveSmooth','lbl-vis-reactive-curveSmooth',t.reactive.curveSmooth,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-edgeStability','lbl-vis-reactive-edgeStability',t.reactive.edgeStability,v=>Math.round(v*100)+'%');
    setSelectVal('vis-sphere-lightMode',t.sphere.lightMode);
    setSliderVal('vis-sphere-lightSensitivity','lbl-vis-sphere-lightSensitivity',t.sphere.lightSensitivity,v=>Number(v).toFixed(2));
    setSliderVal('vis-sphere-lightDecay','lbl-vis-sphere-lightDecay',t.sphere.lightDecay,v=>Number(v).toFixed(2));
    setSliderVal('vis-sphere-idleLight','lbl-vis-sphere-idleLight',t.sphere.idleLight,v=>Number(v).toFixed(2));
    setSelectVal('vis-wave-style',t.wave.style);
    setSliderVal('vis-wave-musicMix','lbl-vis-wave-musicMix',t.wave.musicMix,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-musicMix','lbl-vis-reactive-musicMix',t.reactive.musicMix,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-glow','lbl-vis-reactive-glow',t.reactive.glow,v=>Math.round(v*100)+'%');
    setSliderVal('vis-reactive-spread','lbl-vis-reactive-spread',t.reactive.spread,v=>Math.round(v*100)+'%');
    setSelectVal('vis-reactive-layout', t.reactive.layout);
    setSliderVal('vis-reactive-strength', 'lbl-vis-reactive-strength', t.reactive.strength, v => Number(v).toFixed(2));
    setSliderVal('vis-reactive-smoothing', 'lbl-vis-reactive-smoothing', t.reactive.smoothing, v => Number(v).toFixed(2));
    setSliderVal('vis-reactive-lineWidth', 'lbl-vis-reactive-lineWidth', t.reactive.lineWidth, v => Number(v).toFixed(2));
    setSliderVal('vis-curtain-strength', 'lbl-vis-curtain-strength', t.curtain.strength, v => Number(v).toFixed(2));
    setSliderVal('vis-curtain-width', 'lbl-vis-curtain-width', t.curtain.width, v => Number(v).toFixed(2));
    setSliderVal('vis-curtain-speed', 'lbl-vis-curtain-speed', t.curtain.speed, v => Number(v).toFixed(2));

    // Quality & Target FPS
    setSelectVal('vis-quality-select', t.quality || 'balanced');
    setSelectVal('vis-target-fps-select', String(t.targetFps || 90));

    // Wave
    if (t.wave) {
      const chkMoire = document.getElementById('vis-tune-wave-anti-moire');
      if (chkMoire) chkMoire.checked = t.wave.antiMoire !== false;
      setSliderVal('vis-tune-wave-moire-damping', 'lbl-vis-tune-wave-moire-damping', t.wave.moireDamping !== undefined ? t.wave.moireDamping : 0.75, v => `${Math.round(v * 100)}%`);

      setSliderVal('vis-tune-wave-line-width', 'lbl-vis-tune-wave-line-width', t.wave.lineWidth, v => `${Number(v).toFixed(1)}px`);
      setSliderVal('vis-tune-wave-amplitude', 'lbl-vis-tune-wave-amplitude', t.wave.amplitude, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-pitch', 'lbl-vis-tune-wave-pitch', t.wave.perspectivePitch, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-wave-yaw', 'lbl-vis-tune-wave-yaw', t.wave.yaw, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-wave-tilt', 'lbl-vis-tune-wave-tilt', t.wave.tilt, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-wave-smoothing', 'lbl-vis-tune-wave-smoothing', t.wave.smoothing, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-line-count', 'lbl-vis-tune-wave-line-count', t.wave.lineCount, v => `${Math.round(v)} 条`);
      setSliderVal('vis-tune-wave-depth-len', 'lbl-vis-tune-wave-depth-len', t.wave.depthLength, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-span', 'lbl-vis-tune-wave-span', t.wave.horizontalSpan, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-near-width', 'lbl-vis-tune-wave-near-width', t.wave.nearLineWidth, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-far-fade', 'lbl-vis-tune-wave-far-fade', t.wave.farFade, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-flow-speed', 'lbl-vis-tune-wave-flow-speed', t.wave.flowSpeed, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-wave-glow', 'lbl-vis-tune-wave-glow', t.wave.glowBlur, v => `${Math.round(v)}px`);
      setSliderVal('vis-tune-wave-companion', 'lbl-vis-tune-wave-companion', t.wave.companionAlpha, v => `${Math.round(v * 100)}%`);
    }

    // Spectrum
    if (t.spectrum) {
      setSliderVal('vis-tune-spec-inner-radius', 'lbl-vis-tune-spec-inner-radius', t.spectrum.innerRadiusRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-spec-bar-len', 'lbl-vis-tune-spec-bar-len', t.spectrum.barLengthRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-spec-bar-width', 'lbl-vis-tune-spec-bar-width', t.spectrum.barWidth, v => `${Number(v).toFixed(1)}px`);
      setSliderVal('vis-tune-spec-bar-count', 'lbl-vis-tune-spec-bar-count', t.spectrum.barCount, v => `${v} 柱`);
      setSliderVal('vis-tune-spec-rot', 'lbl-vis-tune-spec-rot', t.spectrum.rotAngle, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-spec-smooth', 'lbl-vis-tune-spec-smooth', t.spectrum.smoothFactor, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-spec-compression', 'lbl-vis-tune-spec-compression', t.spectrum.radialCompression, v => `${Math.round(v * 100)}%`);
      setSelectVal('vis-tune-spec-symmetry', t.spectrum.symmetry || 'none');
      setSliderVal('vis-tune-spec-taper', 'lbl-vis-tune-spec-taper', t.spectrum.taper, v => `${Math.round(v * 100)}%`);
    }

    // Sphere
    if (t.sphere) {
      setSliderVal('vis-tune-sphere-radius', 'lbl-vis-tune-sphere-radius', t.sphere.radiusRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-sphere-rot-speed', 'lbl-vis-tune-sphere-rot-speed', t.sphere.rotSpeed, v => `${Number(v).toFixed(1)}x`);
      setSliderVal('vis-tune-sphere-core-glow', 'lbl-vis-tune-sphere-core-glow', t.sphere.coreGlow, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-sphere-node-size', 'lbl-vis-tune-sphere-node-size', t.sphere.nodeSize, v => `${Math.round(v * 100)}%`);
      setSelectVal('vis-tune-sphere-symmetry', t.sphere.symmetry || '2x');
      setSliderVal('vis-tune-sphere-rot', 'lbl-vis-tune-sphere-rot', t.sphere.rotAngle, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-sphere-bass-diff', 'lbl-vis-tune-sphere-bass-diff', t.sphere.bassDiffusion, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-sphere-smooth', 'lbl-vis-tune-sphere-smooth', t.sphere.sphereSmoothing, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-sphere-back-alpha', 'lbl-vis-tune-sphere-back-alpha', t.sphere.backAlpha, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-sphere-depth', 'lbl-vis-tune-sphere-depth', t.sphere.depthRatio, v => `${Math.round(v * 100)}%`);
    }

    // Bars
    if (t.bars) {
      setSliderVal('vis-tune-bars-width', 'lbl-vis-tune-bars-width', t.bars.barWidthRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-bars-height', 'lbl-vis-tune-bars-height', t.bars.heightRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-bars-reflection', 'lbl-vis-tune-bars-reflection', t.bars.reflectionAlpha, v => `${Math.round(v * 100)}%`);
      setToggleVal('vis-tune-bars-peak-hold', 'lbl-vis-tune-bars-peak-hold', t.bars.peakHold !== false);
      setSelectVal('vis-tune-bars-freq-order', t.bars.freqOrder || 'asc');
      setSliderVal('vis-tune-bars-count', 'lbl-vis-tune-bars-count', t.bars.barCount, v => `${Math.round(v)} 柱`);
      setSliderVal('vis-tune-bars-gap', 'lbl-vis-tune-bars-gap', t.bars.barGap, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-bars-corner', 'lbl-vis-tune-bars-corner', t.bars.cornerRadius, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-bars-peak-hold-ms', 'lbl-vis-tune-bars-peak-hold-ms', t.bars.peakHoldMs, v => `${Math.round(v)}ms`);
      setSliderVal('vis-tune-bars-peak-decay', 'lbl-vis-tune-bars-peak-decay', t.bars.peakDecaySpeed, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-bars-ref-soft', 'lbl-vis-tune-bars-ref-soft', t.bars.reflectionSoftness, v => `${Math.round(v * 100)}%`);
    }

    // Orb (Particle)
    if (t.orb) {
      setSliderVal('vis-tune-orb-count', 'lbl-vis-tune-orb-count', t.orb.particleCount, v => `${Math.round(v)}`);
      setSliderVal('vis-tune-orb-size', 'lbl-vis-tune-orb-size', t.orb.size, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-depth', 'lbl-vis-tune-orb-depth', t.orb.depthRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-horizon', 'lbl-vis-tune-orb-horizon', t.orb.horizonRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-spread', 'lbl-vis-tune-orb-spread', t.orb.perspectiveSpread, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-direction', 'lbl-vis-tune-orb-direction', t.orb.viewDirection, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-orb-rot', 'lbl-vis-tune-orb-rot', t.orb.fieldRotation, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-orb-speed', 'lbl-vis-tune-orb-speed', t.orb.speed, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-turb', 'lbl-vis-tune-orb-turb', t.orb.turbulence, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-music-inf', 'lbl-vis-tune-orb-music-inf', t.orb.musicInfluence, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-bass-thrust', 'lbl-vis-tune-orb-bass-thrust', t.orb.bassThrust, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-fg-blur', 'lbl-vis-tune-orb-fg-blur', t.orb.fgBlur, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-orb-far-alpha', 'lbl-vis-tune-orb-far-alpha', t.orb.farAlpha, v => `${Math.round(v * 100)}%`);
    }

    // Ambient (Flow)
    if (t.ambient) {
      setSliderVal('vis-tune-ambient-count', 'lbl-vis-tune-ambient-count', t.ambient.ribbonCount, v => `${Math.round(v)} 条`);
      setSliderVal('vis-tune-ambient-width', 'lbl-vis-tune-ambient-width', t.ambient.ribbonWidth, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-trail', 'lbl-vis-tune-ambient-trail', t.ambient.trailLength, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-speed', 'lbl-vis-tune-ambient-speed', t.ambient.speed, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-curve', 'lbl-vis-tune-ambient-curve', t.ambient.curvature, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-turb', 'lbl-vis-tune-ambient-turb', t.ambient.turbulence, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-dir', 'lbl-vis-tune-ambient-dir', t.ambient.direction, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-ambient-spread', 'lbl-vis-tune-ambient-spread', t.ambient.spreadAngle, v => `${Math.round(v)}°`);
      setSliderVal('vis-tune-ambient-inertia', 'lbl-vis-tune-ambient-inertia', t.ambient.inertia, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-depth', 'lbl-vis-tune-ambient-depth', t.ambient.depthRatio, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-music-inf', 'lbl-vis-tune-ambient-music-inf', t.ambient.musicInfluence, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-glow', 'lbl-vis-tune-ambient-glow', t.ambient.glowIntensity, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-ambient-fade', 'lbl-vis-tune-ambient-fade', t.ambient.fadeSpeed, v => `${Math.round(v * 100)}%`);
      setToggleVal('vis-tune-ambient-orbs', 'lbl-vis-tune-ambient-orbs', t.ambient.enableOrbs);
    }

    // Audio Response
    if (t.audioResponse) {
      setSliderVal('vis-tune-audio-smooth', 'lbl-vis-tune-audio-smooth', t.audioResponse.smoothFactor, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-audio-attack', 'lbl-vis-tune-audio-attack', t.audioResponse.attackMs, v => `${Math.round(v)}ms`);
      setSliderVal('vis-tune-audio-release', 'lbl-vis-tune-audio-release', t.audioResponse.releaseMs, v => `${Math.round(v)}ms`);
      setSliderVal('vis-tune-audio-comp', 'lbl-vis-tune-audio-comp', t.audioResponse.compression, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-audio-bass', 'lbl-vis-tune-audio-bass', t.audioResponse.bassScale, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-audio-mid', 'lbl-vis-tune-audio-mid', t.audioResponse.midScale, v => `${Math.round(v * 100)}%`);
      setSliderVal('vis-tune-audio-high', 'lbl-vis-tune-audio-high', t.audioResponse.highScale, v => `${Math.round(v * 100)}%`);
      setSelectVal('vis-tune-audio-dist', t.audioResponse.distribution || 'log');
      setSelectVal('vis-tune-audio-soft', t.audioResponse.peakSoftening || 'soft');
    }
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.UIController = UIController;
