const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const baseline = require('./fixtures/visual-defaults-1.2.1.json');

function loadPreviewClasses() {
  const storage = new Map();
  const context = {
    window: { devicePixelRatio: 1 },
    document: { getElementById: () => null },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    performance: { now: () => 0 },
    requestAnimationFrame: () => {},
    setTimeout,
    clearTimeout,
    Float32Array,
    Int32Array,
    console
  };
  for (const name of ['visualizer', 'ui']) {
    const source = fs.readFileSync(path.join(__dirname, `../src/renderer/js/${name}.js`), 'utf8');
    vm.runInNewContext(source, context, { filename: `${name}.js` });
  }
  return { context, storage };
}

test('all visual mode defaults equal the tuned 1.2.1 preview snapshot', () => {
  const { context } = loadPreviewClasses();
  const visualizer = new context.window.Visualizer('missing', {});
  assert.deepEqual(JSON.parse(JSON.stringify(visualizer.defaultTuning)), baseline.glasswave_visual_tuning);

  const ui = Object.create(context.window.UIController.prototype);
  ui.visualizer = visualizer;
  ui.visualizerModeControls = {};
  for (const [mode, controls] of Object.entries(baseline.glasswave_visualizer_mode_controls_v1)) {
    assert.deepEqual(JSON.parse(JSON.stringify(ui.getVisualizerModeControls(mode))), controls);
  }
});

test('reset current and reset all restore the preview baseline without changing other modes', () => {
  const { context, storage } = loadPreviewClasses();
  const visualizer = new context.window.Visualizer('missing', {});
  visualizer.tuning.wave.amplitude = 0.2;
  visualizer.tuning.bars.barCount = 12;
  visualizer.resetModeTuning('wave');
  assert.deepEqual(JSON.parse(JSON.stringify(visualizer.tuning.wave)), baseline.glasswave_visual_tuning.wave);
  assert.equal(visualizer.tuning.bars.barCount, 12);
  visualizer.performSyncResize = () => {};
  visualizer.resetAllVisualTuning();
  assert.deepEqual(JSON.parse(JSON.stringify(visualizer.tuning)), baseline.glasswave_visual_tuning);
  assert.deepEqual(JSON.parse(storage.get('glasswave_visual_tuning')), baseline.glasswave_visual_tuning);
});
