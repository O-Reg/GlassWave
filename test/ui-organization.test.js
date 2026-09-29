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
