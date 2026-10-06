const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('fullscreen and maximize fill native corners and restore rounding at the same size', () => {
  const handlers = {}, shapes = [];
  let fullscreen = false, maximized = false;
  const bounds = { x: 0, y: 0, width: 3440, height: 1440 };
  const win = {
    isDestroyed: () => false, isMinimized: () => false,
    isFullScreen: () => fullscreen, isMaximized: () => maximized,
    getBounds: () => bounds, setShape: shape => shapes.push(JSON.parse(JSON.stringify(shape))),
    on: (event, fn) => { handlers[event] = fn; }
  };
  const context = { module: { exports: {} }, require: name => {
    assert.equal(name, 'electron');
    return { screen: { getDisplayMatching: () => ({ scaleFactor: 1.5 }) } };
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/main/roundedWindow.js'), 'utf8'), context);
  const refresh = context.module.exports.attach(win);
  const rounded = shapes.at(-1);
  assert.ok(rounded.length > 1);
  const rectangle = [{ x: 0, y: 0, width: 3440, height: 1440 }];
  fullscreen = true;
  refresh(); // State changes must invalidate the shape even without a size change.
  assert.deepEqual(shapes.at(-1), rectangle);
  fullscreen = false;
  handlers['leave-full-screen']();
  assert.deepEqual(shapes.at(-1), rounded);
  maximized = true;
  handlers.maximize();
  assert.deepEqual(shapes.at(-1), rectangle);
  maximized = false;
  handlers.unmaximize();
  assert.deepEqual(shapes.at(-1), rounded);
});
