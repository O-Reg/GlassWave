const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('visual sensitivity and placement survive switching modes without leaking to another mode', () => {
  const values = new Map();
  const store = { setItem: (key, value) => values.set(key, value), getItem: key => values.get(key) ?? null };
  const nodes = new Map([
    ['setting-intensity', { min: '0.5', max: '2', value: '1', style: { setProperty() {} } }],
    ['lbl-visualizer-intensity', { textContent: '' }],
    ['setting-vis-offset-y', { value: '0' }],
    ['lbl-vis-offset-y', { textContent: '' }],
    ['setting-vis-scale', { value: '1.25' }],
    ['lbl-vis-scale', { textContent: '' }]
  ]);
  const context = {
    window: { glasswaveAPI: null }, localStorage: store, console,
    setTimeout: () => 1, clearTimeout() {},
    document: { getElementById: id => nodes.get(id), querySelectorAll: () => [] }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/ui.js'), 'utf8'), context);
  const ui = Object.create(context.window.UIController.prototype);
  ui.visualizerModeControls = {};
  ui.visualizer = {
    mode: 'wave', intensity: 1, positionPreset: 'center', offsetY: 0, visScale: 1.25,
    getDefaultPositionForMode: mode => mode === 'bars' ? 'below' : 'center',
    setMode(mode) { this.mode = mode; this.positionPreset = this.getDefaultPositionForMode(mode); },
    setIntensity(value) { this.intensity = value; },
    setPositionPreset(value) { this.positionPreset = value; },
    setOffsetY(value) { this.offsetY = value; },
    setScale(value) { this.visScale = value; }
  };

  ui.saveVisualizerModeControls({ intensity: 1.8, position: 'behind', offsetY: 45, scale: 1.8 });
  ui.switchVisualizerMode('bars');
  assert.equal(ui.visualizer.intensity, 1);
  assert.equal(ui.visualizer.positionPreset, 'below');
  assert.equal(ui.visualizer.offsetY, 0);
  ui.saveVisualizerModeControls({ intensity: 0.6, position: 'center', offsetY: -30, scale: 0.8 });
  ui.switchVisualizerMode('wave');
  assert.deepEqual([ui.visualizer.intensity, ui.visualizer.positionPreset, ui.visualizer.offsetY, ui.visualizer.visScale], [1.8, 'behind', 45, 1.8]);
  assert.equal(nodes.get('setting-intensity').value, '1.8');
  assert.equal(nodes.get('lbl-vis-offset-y').textContent, '+45px');
  assert.equal(JSON.parse(values.get('glasswave_visualizer_mode_controls_v1')).bars.intensity, 0.6);
});
