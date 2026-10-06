const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeUI() {
  const handlers = {};
  const container = { addEventListener: (name, callback) => { handlers[name] = callback; } };
  const context = {
    window: { innerWidth: 640, innerHeight: 400 },
    document: { getElementById: id => id === 'track-list-container' ? container : null },
    console
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/renderer/js/ui.js'), 'utf8');
  vm.runInNewContext(source, context, { filename: 'ui.js' });
  const ui = Object.create(context.window.UIController.prototype);
  return { ui, handlers, context };
}

function makeImportUI() {
  const { ui, context } = makeUI();
  const events = {};
  const scans = [];
  const overlay = { style: { display: 'none' } };
  context.document.getElementById = id => id === 'drag-drop-overlay' ? overlay : null;
  context.window.addEventListener = (name, handler) => { events[name] = handler; };
  context.window.glasswaveAPI = {
    scanDroppedItems: async paths => { scans.push(Array.from(paths)); return { tracks: [] }; }
  };
  ui.bindDragAndDropImport();
  const event = (types, files = []) => ({
    prevented: false,
    preventDefault() { this.prevented = true; },
    dataTransfer: { types, files, dropEffect: 'move', getData() { throw Error('protected drag payload'); } }
  });
  return { ui, events, scans, overlay, event };
}

test('search result playback records its base category separately from the filtered queue', () => {
  const { ui, handlers } = makeUI();
  let scope;
  ui.filteredTracks = [{ path: 'a.wav' }];
  ui.searchQuery = 'a'; ui.currentSubView = 'all'; ui._prevSubViewBeforeSearch = 'category:warm';
  ui.audioEngine = { setQueue(tracks, index, source) { scope = source; }, loadTrack() {} };
  ui.bindTrackListEvents();
  handlers.dblclick({ target: { closest: selector => selector === '.track-row' ? { dataset: { index: '0' } } : null } });
  assert.equal(scope.type, 'category'); assert.equal(scope.categoryId, 'warm');
  ui._prevSubViewBeforeSearch = null;
  handlers.dblclick({ target: { closest: selector => selector === '.track-row' ? { dataset: { index: '0' } } : null } });
  assert.equal(scope.type, 'library');
});

test('Zen bottom bar stays during lyric editing and resumes timed hiding afterward', () => {
  const { ui, context } = makeUI(); const classes = new Set(['zen-mode', 'lyrics-settings-open']); const timers = [];
  context.window.addEventListener = () => {}; context.document.getElementById = () => null;
  context.document.querySelector = () => ({ matches: () => false });
  context.document.body = { classList: { contains: k => classes.has(k), add: (...ks) => ks.forEach(k => classes.add(k)), remove: (...ks) => ks.forEach(k => classes.delete(k)), toggle: (k, yes) => yes ? classes.add(k) : classes.delete(k) } };
  context.setTimeout = callback => { timers.push(callback); return timers.length; }; context.clearTimeout = () => {};
  ui.bindZenMode(); ui.refreshZenPointerState();
  assert.equal(classes.has('zen-show-player-bar'), true); assert.equal(classes.has('zen-interactive-open'), true);
  classes.delete('lyrics-settings-open'); ui.refreshZenPointerState();
  assert.equal(classes.has('zen-interactive-open'), false); timers.forEach(callback => callback());
  assert.equal(classes.has('zen-show-player-bar'), false);
});

test('wheel inside lyric settings is excluded from global playback volume adjustment', () => {
  const { ui, context } = makeUI();
  let wheel, volume = 0, prevented = false;
  context.window.addEventListener = (name, callback) => { if (name === 'wheel') wheel = callback; };
  ui.currentView = 'player'; ui.adjustVolumeByWheel = () => volume++;
  ui.bindGlobalVolumeWheel();
  wheel({ target: { closest: selector => selector.includes('.lyrics-settings-panel') ? {} : null }, deltaY: 100, preventDefault: () => { prevented = true; } });
  assert.equal(volume, 0); assert.equal(prevented, false);
  wheel({ target: { closest: () => null }, deltaY: 100, preventDefault: () => { prevented = true; } });
  assert.equal(volume, 1); assert.equal(prevented, true);
});

test('internal library and queue drags never show import UI or change drop effects', async () => {
  const { events, scans, overlay, event } = makeImportUI();
  for (const types of [['application/x-glasswave-tracks', 'text/plain', 'Files'], ['text/queue-index', 'Files']]) {
    const drag = event(types, [{ path: 'C:\\music\\existing.wav' }]);
    events.dragenter(drag);
    events.dragover(drag);
    assert.equal(overlay.style.display, 'none');
    assert.equal(drag.dataTransfer.dropEffect, 'move');
    await events.drop(drag);
  }
  // Any drag initiated inside this renderer, including image drags, is internal.
  events.dragstart();
  const image = event(['Files'], [{ path: 'C:\\art\\cover.png' }]);
  events.dragenter(image);
  events.dragover(image);
  await events.drop(image);
  assert.equal(overlay.style.display, 'none');
  assert.equal(scans.length, 0);
  events.dragend();
  const external = event(['Files']);
  events.dragenter(external);
  assert.equal(overlay.style.display, 'flex');
});

test('external file and folder drags show import UI while text drags do not', async () => {
  const { events, scans, overlay, event } = makeImportUI();
  const text = event(['text/plain', 'text/uri-list']);
  events.dragenter(text);
  events.dragover(text);
  assert.equal(overlay.style.display, 'none');
  // Files are not readable until drop, so Files type alone must show the hint.
  const drag = event(['Files']);
  events.dragenter(drag);
  events.dragenter(drag);
  events.dragover(drag);
  assert.equal(overlay.style.display, 'flex');
  assert.equal(drag.dataTransfer.dropEffect, 'copy');
  events.dragleave(drag);
  assert.equal(overlay.style.display, 'flex');
  events.dragleave(drag);
  assert.equal(overlay.style.display, 'none');
  events.dragenter(drag);
  await events.drop(event(['Files'], [{ path: 'C:\\music\\new.wav' }, { path: 'C:\\music\\album' }]));
  assert.deepEqual(scans, [['C:\\music\\new.wav', 'C:\\music\\album']]);
  assert.equal(overlay.style.display, 'none');
});

test('dragging selected library songs retains the full category payload', () => {
  const { ui, handlers } = makeUI();
  ui.filteredTracks = [{ path: 'one.wav' }, { path: 'two.wav' }];
  ui.selectedTrackPaths = new Set(['one.wav', 'two.wav']);
  ui.bindTrackListEvents();
  const payloads = new Map();
  handlers.dragstart({
    target: { closest: () => ({ dataset: { index: '0' } }) },
    dataTransfer: { setData: (type, data) => payloads.set(type, data) }
  });
  assert.deepEqual(JSON.parse(payloads.get('text/plain')), ['one.wav', 'two.wav']);
  assert.deepEqual(JSON.parse(payloads.get('application/x-glasswave-tracks')), ['one.wav', 'two.wav']);
});

test('double clicks on search decorations or audio specs do not fullscreen the window', () => {
  const { ui, context } = makeUI();
  let doubleClick;
  let fullscreen = 0;
  context.window.glasswaveAPI = {};
  context.document.getElementById = () => ({ addEventListener: (_, handler) => { doubleClick = handler; } });
  ui.toggleVisualizerFullscreen = () => { fullscreen++; };
  ui.bindTitlebarDoubleClick();
  for (const control of ['.search-cluster', '.glass-hifi-popover', '.hifi-badge-wrap']) {
    doubleClick({ target: { closest: selectors => selectors.includes(control) ? {} : null } });
  }
  assert.equal(fullscreen, 0);
  doubleClick({ target: { closest: () => null }, preventDefault() {}, stopPropagation() {} });
  assert.equal(fullscreen, 1);
});

test('opening visual settings in Zen mode keeps the bottom dock visible', () => {
  const { ui, context } = makeUI();
  const classes = initial => {
    const names = new Set(initial);
    return {
      contains: name => names.has(name),
      add: (...items) => items.forEach(item => names.add(item)),
      remove: (...items) => items.forEach(item => names.delete(item)),
      toggle: (name, active) => active ? names.add(name) : names.delete(name)
    };
  };
  const drawer = { classList: classes([]), style: { display: 'none' } };
  const body = { classList: classes(['zen-mode']) };
  context.document.body = body;
  context.document.getElementById = id => id === 'view-visualizer-drawer' ? drawer : null;
  ui.normalizeParameterRows = () => {};
  ui.selectVisualizerTuneMode = () => {};
  ui.syncVisualizerCustomizationUI = () => {};
  ui.syncVisualizerTuningUI = () => {};
  ui.visualizer = { mode: 'wave' };
  let canceled = false;
  ui.cancelZenAutoHide = () => { canceled = true; };
  ui.toggleVisualizerDrawer(true);
  assert.equal(drawer.classList.contains('open'), true);
  assert.equal(body.classList.contains('zen-interactive-open'), true);
  assert.equal(body.classList.contains('zen-show-player-bar'), true);
  assert.equal(canceled, true);
});

test('background reset restores light orbs without changing visual mode or interface opacity', () => {
  const { ui, context } = makeUI();
  const values = new Map([
    ['glasswave_custom_bg', 'C:\\art\\cover.png'],
    ['glasswave_visualizer_mode_controls_v1', '{"wave":{"scale":1.8}}'],
    ['glasswave_window_glass_ratio', '45'],
    ['glasswave_desktop_reveal', '20']
  ]);
  context.localStorage = { removeItem: key => values.delete(key) };
  context.window.GlassWaveTheme = { setBackground() {} };
  const removedClasses = [];
  context.document.body = { classList: { remove: (...names) => removedClasses.push(...names) } };
  context.document.querySelector = () => null;
  context.document.getElementById = id => id === 'custom-bg-layer'
    ? { classList: { remove: () => {} } }
    : id === 'custom-bg-image' ? { style: { backgroundImage: 'before' } } : null;
  const calls = [];
  ui.colorEngine = Object.fromEntries(['clearPureColor','setGlowEnabled','setGlowMode','setBlobCount','setSpeedMultiplier','setIntensityMultiplier']
    .map(name => [name, (...args) => calls.push([name, ...args])]));
  for (const name of ['bindAmbientGlowControls','updateWallpaperTintDegree','updateWallpaperPureRatio','updateWallpaperOpacity','updateWallpaperZoom','resetWallpaperFocusPosition','resetWallpaperRotation','updateWallpaperBlur','updateWallpaperLumaThreshold','showToast']) ui[name] = () => {};
  ui.visualizerModeControls = { wave: { scale: 1.8 } };
  ui.updateWindowGlassRatio = () => { throw new Error('interface opacity changed'); };
  ui.updateDesktopReveal = () => { throw new Error('desktop reveal changed'); };
  ui.applyVisualizerModeControls = () => { throw new Error('visual mode changed'); };
  ui.resetCustomWallpaper();
  assert.equal(values.has('glasswave_custom_bg'), false);
  assert.equal(values.get('glasswave_window_glass_ratio'), '45');
  assert.equal(values.get('glasswave_desktop_reveal'), '20');
  assert.deepEqual(ui.visualizerModeControls, { wave: { scale: 1.8 } });
  assert.ok(calls.some(call => call[0] === 'setBlobCount' && call[1] === 4));
  assert.ok(removedClasses.includes('custom-wallpaper-active'));
});

test('single click anchors Shift range selection in any song list; double click plays', async () => {
  const { ui, handlers } = makeUI();
  const played = [];
  ui.filteredTracks = ['a', 'b', 'c'].map(path => ({ path }));
  ui.selectedTrackPaths = new Set();
  ui.lastSelectedTrackIndex = -1;
  ui.updateSelectionUI = () => {};
  ui.audioEngine = {
    setQueue: (_, index) => played.push(`queue:${index}`),
    loadTrack: track => played.push(`play:${track.path}`)
  };
  ui.bindTrackListEvents();
  const event = (index, shiftKey = false) => ({
    shiftKey, ctrlKey: false, metaKey: false,
    target: { closest: selector => selector === '.track-row' ? { dataset: { index: String(index) } } : null }
  });
  await handlers.click(event(0));
  assert.deepEqual([...ui.selectedTrackPaths], ['a']);
  assert.deepEqual(played, []);
  await handlers.click(event(2, true));
  assert.deepEqual([...ui.selectedTrackPaths], ['a', 'b', 'c']);
  handlers.dblclick(event(1));
  assert.deepEqual(played, ['queue:1', 'play:b']);
});

test('context menu is clamped to visible window bounds using its real size', () => {
  const { ui } = makeUI();
  const menu = { offsetWidth: 220, offsetHeight: 350, style: {} };
  ui.placeMenuInViewport(menu, 620, 390);
  assert.equal(menu.style.left, '412px');
  assert.equal(menu.style.top, '42px');
});

test('two consecutive confirmations keep the second dialog visible', async () => {
  const { ui, context } = makeUI();
  const active = new Set();
  const backdrop = {
    style: {},
    classList: {
      add: value => active.add(value),
      remove: value => active.delete(value),
      contains: value => active.has(value)
    }
  };
  const nodes = new Map([
    ['glass-confirm-dialog', backdrop],
    ...['confirm-title', 'confirm-msg', 'confirm-sub', 'confirm-btn-cancel', 'confirm-btn-ok']
      .map(id => [id, { style: {}, focus() {} }])
  ]);
  context.document.getElementById = id => nodes.get(id);
  context.document.addEventListener = () => {};
  context.document.removeEventListener = () => {};
  context.requestAnimationFrame = callback => callback();
  const timers = new Map();
  let nextTimer = 1;
  context.setTimeout = callback => { const id = nextTimer++; timers.set(id, callback); return id; };
  context.clearTimeout = id => timers.delete(id);
  const first = ui.showGlassConfirm({ title: '第一次' });
  nodes.get('confirm-btn-ok').onclick({ stopPropagation() {} });
  assert.equal(await first, true);
  const second = ui.showGlassConfirm({ title: '第二次' });
  for (const timer of timers.values()) timer();
  assert.equal(backdrop.style.display, 'flex');
  assert.equal(active.has('active'), true);
  nodes.get('confirm-btn-ok').onclick({ stopPropagation() {} });
  assert.equal(await second, true);
});

test('Zen mode keeps navigation and player controls visible on every content page', () => {
  const { ui, context } = makeUI();
  const classes = new Set(['zen-mode']);
  context.document.body = { classList: {
    contains: value => classes.has(value),
    add: (...values) => values.forEach(value => classes.add(value)),
    remove: (...values) => values.forEach(value => classes.delete(value)),
    toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value)
  } };
  let canceled = 0;
  ui.cancelZenAutoHide = () => canceled++;
  for (const view of ['library', 'folders', 'settings']) {
    ui.currentView = view;
    ui.syncZenChromeForView();
    assert.equal(classes.has('zen-content-view'), true);
    assert.equal(classes.has('zen-show-sidebar'), true);
    assert.equal(classes.has('zen-show-player-bar'), true);
  }
  assert.equal(canceled, 3);
  ui.currentView = 'player';
  ui.syncZenChromeForView();
  assert.equal(classes.has('zen-content-view'), false);
  assert.equal(classes.has('zen-show-sidebar'), false);
  assert.equal(classes.has('zen-show-player-bar'), false);
});

test('entering a Zen library page measures its full-width start before pushing content aside', () => {
  const { ui, context } = makeUI();
  const classes = new Set(['zen-mode']);
  context.document.body = { classList: {
    contains: value => classes.has(value),
    add: (...values) => values.forEach(value => classes.add(value)),
    remove: (...values) => values.forEach(value => classes.delete(value)),
    toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value)
  } };
  let measuredAtStart = false;
  const stage = { style: {}, get offsetWidth() { measuredAtStart = !classes.has('zen-content-view'); return 900; } };
  const nodes = new Map([
    ['view-player', { style: {} }], ['view-library', stage], ['view-folders', { style: {} }],
    ['app-shell', { scrollLeft: 0 }]
  ]);
  context.document.getElementById = id => nodes.get(id);
  context.document.querySelectorAll = () => [];
  context.window.scrollX = 0;
  ui.currentView = 'player';
  ui.currentSubView = 'all';
  ui.toggleSettingsDrawer = () => {};
  ui.toggleVisualizerDrawer = () => {};
  ui.clearSelection = () => {};
  ui.updateLibraryHeader = () => {};
  ui.applyFilterAndSort = () => {};
  ui.switchView('library', 'favorites');
  assert.equal(stage.style.display, 'flex');
  assert.equal(measuredAtStart, true);
  assert.equal(classes.has('zen-content-view'), true);
});

test('blank library background starts a window drag without leaving the library', () => {
  const { ui, context } = makeUI();
  const events = {};
  const classes = new Set(['zen-mode', 'zen-content-view']);
  const moves = [];
  context.window.addEventListener = (name, handler) => { events[name] = handler; };
  context.window.glasswaveAPI = {
    dragStartWindow: coords => moves.push(['start', coords.screenX, coords.screenY]),
    dragEndWindow: () => moves.push(['end'])
  };
  context.document.body = { classList: {
    contains: value => classes.has(value),
    add: (...values) => values.forEach(value => classes.add(value)),
    remove: (...values) => values.forEach(value => classes.delete(value))
  } };
  context.document.getElementById = () => null;
  ui.currentView = 'library';
  ui.switchView = () => { throw Error('background drag must not return to player'); };
  const background = {
    closest: selector => selector === '#app-shell' ? {} : null,
    setPointerCapture() {}, hasPointerCapture: () => false
  };
  ui.bindZenMode();
  events.pointerdown({ button: 0, pointerId: 3, target: background, screenX: 340, screenY: 170 });
  assert.deepEqual(moves, [['start', 340, 170]]);
  assert.equal(classes.has('zen-dragging-window'), true);
  events.pointerup();
  assert.deepEqual(moves.at(-1), ['end']);
  assert.equal(classes.has('zen-dragging-window'), false);
  const song = { closest: selector => selector === '#app-shell' || selector.includes('.track-row') ? {} : null };
  events.pointerdown({ button: 0, target: song, screenX: 340, screenY: 170 });
  assert.equal(moves.length, 2);
  const settingsPanel = { closest: selector => selector === '#app-shell' || selector.includes('.glass-settings-drawer') ? {} : null };
  events.pointerdown({ button: 0, target: settingsPanel, screenX: 340, screenY: 170 });
  assert.equal(moves.length, 2);
  classes.delete('zen-mode');
  events.pointerdown({ button: 0, pointerId: 4, target: background, screenX: 450, screenY: 200 });
  assert.deepEqual(moves.at(-1), ['start', 450, 200]);
  assert.equal(classes.has('zen-dragging-window'), false);
  events.pointerup();
  assert.deepEqual(moves.at(-1), ['end']);
});

test('titlebar gaps allow background dragging while search and audio controls stay interactive', () => {
  const { ui } = makeUI();
  const target = ancestors => ({ closest: selectors => selectors.split(',').some(s => ancestors.includes(s.trim())) ? {} : null });
  for (const ancestors of [
    ['#app-shell', '#titlebar', '.titlebar-center'],
    ['#app-shell', '#titlebar', '.titlebar-center', '.search-cluster'],
    ['#app-shell', '#titlebar', '.titlebar-left']
  ]) assert.equal(ui.canDragWindowFromTarget(target(ancestors)), true);
  for (const control of ['.glass-search-box', 'input', 'button', '.search-more-popover', '.hifi-badge-wrap', '.glass-hifi-popover']) {
    assert.equal(ui.canDragWindowFromTarget(target(['#app-shell', '#titlebar', control])), false);
  }
});

test('Zen content pages keep their pinned sidebar when the background is pressed', () => {
  const { ui, context } = makeUI();
  const classes = new Set(['zen-mode', 'zen-show-sidebar']);
  let pointerdown;
  context.document.body = { classList: {
    contains: value => classes.has(value),
    remove: value => classes.delete(value)
  } };
  context.document.getElementById = id => id === 'sidebar' ? { contains: () => false } : null;
  context.document.addEventListener = (name, handler) => { if (name === 'pointerdown') pointerdown = handler; };
  ui.bindQueueDrawer();
  const event = { target: { closest: () => null } };
  ui.currentView = 'library';
  pointerdown(event);
  assert.equal(classes.has('zen-show-sidebar'), true);
  ui.currentView = 'player';
  pointerdown(event);
  assert.equal(classes.has('zen-show-sidebar'), false);
});
