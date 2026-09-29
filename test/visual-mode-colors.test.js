const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('each visual mode keeps its color through a skin capture and reload', () => {
  const values = new Map();
  const localStorage = {
    get length() { return values.size; },
    key: index => [...values.keys()][index],
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const context = { window: {}, localStorage, document: { getElementById: () => null } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/visualizer.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/skinFiles.js'), 'utf8'), context);
  const visualizer = Object.create(context.window.Visualizer.prototype);
  const defaults = { palette: 'original', solidColor: '#38bdf8', modeColors: {} };
  for (const mode of ['wave','spectrum','sphere','bars','orb','ambient','reactive','curtain']) {
    defaults[mode] = {};
    defaults.modeColors[mode] = { palette: 'original', solidColor: '#38bdf8' };
  }
  visualizer.defaultTuning = defaults;
  visualizer.mode = 'wave';
  values.set('glasswave_visual_tuning', JSON.stringify({ palette: 'ocean', solidColor: '#123456' }));
  visualizer.loadTuning();
  assert.equal(visualizer.tuning.modeColors.sphere.palette, 'ocean');
  visualizer.setSolidColor('#ABCDEF');
  visualizer.mode = 'sphere';
  visualizer.setPalette('sunset');
  assert.equal(visualizer.tuning.modeColors.wave.solidColor, '#abcdef');
  assert.equal(visualizer.tuning.modeColors.sphere.palette, 'sunset');
  visualizer.resetModeTuning('sphere');
  assert.equal(visualizer.tuning.modeColors.sphere.palette, 'original');
  assert.equal(visualizer.tuning.modeColors.wave.palette, 'solid');

  visualizer.intensity = 1;
  visualizer.positionPreset = 'center';
  visualizer.offsetY = 0;
  visualizer.visScale = 1;
  const skin = context.window.GlassWaveSkin.capture({ visualizer });
  const saved = JSON.parse(skin.settings.glasswave_visual_tuning);
  assert.equal(saved.modeColors.wave.solidColor, '#abcdef');
  assert.equal(saved.modeColors.sphere.palette, 'original');
  values.set('glasswave_visual_tuning', skin.settings.glasswave_visual_tuning);
  const restored = Object.create(context.window.Visualizer.prototype);
  restored.defaultTuning = defaults;
  restored.loadTuning();
  assert.equal(restored.tuning.modeColors.wave.solidColor, '#abcdef');
  assert.equal(restored.tuning.modeColors.sphere.palette, 'original');
});
