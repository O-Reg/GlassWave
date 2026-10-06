const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(workArea = { x: 0, y: 0, width: 3440, height: 1400 }) {
  const handlers = {}, ipc = {}, hooks = {}, applied = [], messages = [];
  let cursor = { x: 900, y: 400 };
  let bounds = { x: 200, y: 150, width: 1180, height: 780 };
  let visible = false, previews = 0, tick;
  const ghost = { setBounds() { previews++; }, showInactive() { visible = true; },
    hide() { visible = false; }, isDestroyed: () => false, isVisible: () => visible };
  const context = {
    process: { platform: 'win32' },
    mainWindow: {
      on: (name, fn) => { handlers[name] = fn; },
      hookWindowMessage: (message, fn) => { hooks[message] = fn; },
      isDestroyed: () => false, getBounds: () => ({ ...bounds }), setMinimumSize() {},
      setBounds(value) { bounds = { ...value }; applied.push({ ...value }); },
      setPosition(x, y) { bounds = { ...bounds, x, y }; },
      webContents: { send: (name, value) => messages.push([name, JSON.parse(JSON.stringify(value))]) }
    },
    screen: { getCursorScreenPoint: () => cursor,
      getDisplayNearestPoint: () => ({ workArea }), getDisplayMatching: () => ({ displayFrequency: 90 }) },
    ipcMain: { on: (name, fn) => { ipc[name] = fn; }, handle() {} },
    getOrCreateWireframeWindow: () => ghost, wireframeWindow: ghost,
    normalBounds: null, isMiniMode: false, isWindowFullscreen: false, isWindowMaximized: false,
    updateNormalBounds() {}, setInterval(fn) { tick = fn; return 1; }, clearInterval() {}
  };
  const source = fs.readFileSync(path.join(__dirname, '../src/main/main.js'), 'utf8');
  vm.runInNewContext(source.slice(source.indexOf('  // Windows 11 Snapping State'),
    source.indexOf("  ipcMain.handle('window-set-mini-mode'")), context);
  return { handlers, hooks, ipc, applied, messages, context,
    moveTo(x, y) { cursor = { x, y }; }, tick: () => tick(),
    visible: () => visible, previews: () => previews };
}

test('native titlebar drag snaps to both halves and all four quarters on release', () => {
  for (const [x, y, type, bx, by, height] of [
    [0, 600, 'left-half', 0, 0, 1400], [3439, 600, 'right-half', 1720, 0, 1400],
    [0, 0, 'top-left', 0, 0, 700], [3439, 0, 'top-right', 1720, 0, 700],
    [0, 1439, 'bottom-left', 0, 700, 700], [3439, 1439, 'bottom-right', 1720, 700, 700]
  ]) {
    const f = fixture();
    f.moveTo(x, y); f.handlers['will-move']();
    assert.equal(f.visible(), true);
    assert.equal(f.applied.length, 0, 'never resize during the drag');
    f.hooks[0x0232]();
    assert.deepEqual(f.applied.at(-1), { x: bx, y: by, width: 1720, height });
    assert.equal(f.messages.at(-1)[1].snapType, type);
    assert.equal(f.visible(), false);
  }
});

test('native release rechecks the cursor and retains the original restore bounds', () => {
  const f = fixture();
  f.moveTo(0, 600); f.handlers['will-move']();
  f.moveTo(3439, 0); f.hooks[0x0232]();
  assert.equal(f.messages.at(-1)[1].snapType, 'top-right');
  vm.runInNewContext("applySnap('restore')", f.context);
  assert.deepEqual(f.applied.at(-1), { x: 200, y: 150, width: 1180, height: 780 });
});

test('programmatic moves and focus cancellation never trigger native snap', () => {
  const f = fixture();
  f.moveTo(0, 0); f.hooks[0x0232]();
  assert.equal(f.applied.length, 0);
  f.handlers['will-move'](); f.handlers.blur(); f.hooks[0x0232]();
  assert.equal(f.applied.length, 0);
  assert.equal(f.visible(), false);
});

test('native snap uses the destination monitor work area, including negative coordinates', () => {
  const f = fixture({ x: -1920, y: -200, width: 1920, height: 1040 });
  f.moveTo(-1920, -200); f.handlers['will-move'](); f.hooks[0x0232]();
  assert.deepEqual(f.applied.at(-1), { x: -1920, y: -200, width: 960, height: 520 });
});

test('background pointer drag still snaps and cannot start a concurrent native move', () => {
  const f = fixture();
  f.ipc['window-drag-start']({}, { screenX: 900, screenY: 400 });
  f.moveTo(0, 600); f.tick(); f.handlers['will-move']();
  f.hooks[0x0232]();
  assert.equal(f.applied.length, 0);
  f.ipc['window-drag-end']();
  assert.equal(f.messages.at(-1)[1].snapType, 'left-half');
});

test('native preview clears when leaving the edge and stays disabled in mini/fullscreen modes', () => {
  const f = fixture();
  f.moveTo(0, 600); f.handlers['will-move']();
  f.handlers['will-move'](); assert.equal(f.previews(), 1);
  f.moveTo(900, 400); f.handlers['will-move'](); f.hooks[0x0232]();
  assert.equal(f.visible(), false); assert.equal(f.applied.length, 0);
  for (const flag of ['isMiniMode', 'isWindowFullscreen', 'isWindowMaximized']) {
    f.context[flag] = true;
    f.moveTo(0, 600); f.handlers['will-move'](); f.hooks[0x0232]();
    assert.equal(f.applied.length, 0);
    f.context[flag] = false;
  }
});
