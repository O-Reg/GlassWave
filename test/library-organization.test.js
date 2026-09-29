const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'electron') return { app: { getPath: () => { throw new Error('Tests must use temporary data paths'); } } };
  return originalLoad.call(this, request, parent, isMain);
};
const LibraryDatabase = require('../src/main/database');
Module._load = originalLoad;

function withDatabase(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glasswave-library-test-'));
  try { run(new LibraryDatabase(root), root); }
  finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('song-only tags disappear after the final song removes them; explicit tags remain', () => withDatabase(db => {
  db.upsertTrack({ path: 'C:\\music\\a.wav', title: 'Same', tags: [] });
  db.upsertTrack({ path: 'D:\\music\\a.wav', title: 'Same', tags: [] });
  db.updateTrackTags('C:\\music\\a.wav', ['爱']);
  db.updateTrackTags('D:\\music\\a.wav', ['爱']);
  assert.deepEqual(db.getCustomTags(), ['爱']);
  db.updateTrackTags('C:\\music\\a.wav', []);
  assert.deepEqual(db.getCustomTags(), ['爱']);
  db.updateTrackTags('D:\\music\\a.wav', []);
  assert.deepEqual(db.getCustomTags(), []);
  db.addCustomTag('自建');
  assert.deepEqual(db.getCustomTags(), ['自建']);
}));

test('global deletion removes a preset tag from songs and persists its hidden state', () => withDatabase((db, root) => {
  db.upsertTrack({ path: 'C:\\music\\a.wav', title: 'A', tags: ['黑暗'] });
  db.removeCustomTag('黑暗');
  assert.deepEqual(db.getTrack('C:\\music\\a.wav').tags, []);
  assert.deepEqual(db.getHiddenPresetTags(), ['黑暗']);
  assert.deepEqual(new LibraryDatabase(root).getHiddenPresetTags(), ['黑暗']);
  db.addCustomTag('黑暗');
  assert.deepEqual(db.getHiddenPresetTags(), []);
}));

test('two-level category deletion cascades categories but keeps same-title files', () => withDatabase((db, root) => {
  const a = 'C:\\music\\same.wav';
  const b = 'D:\\music\\same.wav';
  db.upsertTrack({ path: a, title: 'Same', tags: [] });
  db.upsertTrack({ path: b, title: 'Same', tags: [] });
  db.addCategoryGroup('我的最爱');
  const group = db.getCategoryGroups().find(g => g.name === '我的最爱');
  db.addCategory('这些温暖', group.id);
  const cat = db.getCategories().find(c => c.name === '这些温暖');
  db.addTracksToCategory(cat.id, [a, a, b]);
  assert.deepEqual(cat.trackPaths, [a, b]);
  db.deleteCategoryGroup(group.id);
  assert.equal(db.getCategories().some(c => c.id === cat.id), false);
  assert.equal(db.getAllTracks().length, 2);
  const reloaded = new LibraryDatabase(root);
  assert.equal(reloaded.getCategoryGroups().some(g => g.id === group.id), false);
  assert.equal(reloaded.getAllTracks().length, 2);
}));

test('moving by file path removes only category associations and keeps all songs', () => withDatabase(db => {
  const first = 'C:\\music\\same.wav';
  const second = 'D:\\music\\same.wav';
  db.upsertTrack({ path: first, title: 'Same', tags: [] });
  db.upsertTrack({ path: second, title: 'Same', tags: [] });
  const source = db.getCategories()[0];
  const target = db.getCategories()[1];
  db.addTracksToCategory(source.id, [first, second]);
  db.moveTracksToCategory(target.id, [first, first]);
  assert.deepEqual(source.trackPaths, [second]);
  assert.deepEqual(target.trackPaths, [first]);
  assert.equal(db.getAllTracks().length, 2);
  assert.ok(db.getTrack(first));
  assert.ok(db.getTrack(second));
}));

test('legacy flat categories migrate into the default first-level group', () => withDatabase((db, root) => {
  fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify({
    categories: [{ id: 'old', name: '旧分类', trackPaths: [], order: 0 }],
    customTags: ['过期标签']
  }));
  const migrated = new LibraryDatabase(root);
  assert.equal(migrated.getCategories()[0].groupId, 'group_default');
  assert.deepEqual(migrated.getCustomTags(), []);
}));
