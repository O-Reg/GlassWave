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
