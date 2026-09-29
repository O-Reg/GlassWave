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
