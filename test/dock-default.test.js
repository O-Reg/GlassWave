const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../src/renderer/index.html'), 'utf8');
const preload = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];

test('compact sidebar Dock is on for a fresh profile and respects saved off', () => {
  assert.ok(preload, 'startup theme script is present');
  for (const [stored, expected] of [[null, true], ['true', true], ['false', false]]) {
    const classes = new Set();
    const context = {
      localStorage: { getItem: key => key === 'glasswave_compact_sidebar_nav' ? stored : null },
      document: { documentElement: { classList: { add: name => classes.add(name) } } },
      window: { addEventListener() {} }
    };
    vm.runInNewContext(preload, context);
    assert.equal(classes.has('compact-sidebar-nav'), expected, `stored=${stored}`);
  }
});
