const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function engine() {
  const context = { window: {}, Math: Object.assign(Object.create(Math), { random: () => .99 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/audioEngine.js'), 'utf8'), context);
  const audio = Object.create(context.window.AudioEngine.prototype);
  audio.isShuffle = false;
  audio.loadTrack = function(track) {
    this.currentTrack = track;
    if (!this._isInternalNav && this.isShuffle) this.initShuffleSession(track);
  };
  return audio;
}
const library = [{ path: 'version-a.wav' }, { path: 'version-b.wav' }, { path: 'other-song.wav' }];
const paths = queue => Array.from(queue, t => t.path);

test('legacy search queue restores the last song but next shuffle can leave its versions', () => {
  const audio = engine();
  audio.restoreStartupQueue(library, { lastTrackPath: 'version-b.wav',
    savedQueuePaths: ['version-a.wav', 'version-b.wav'], savedQueueIndex: 1 });
  assert.deepEqual(paths(audio.playbackQueue), paths(library));
  audio.loadTrack(audio.playbackQueue[audio.queueIndex]);
  assert.equal(audio.currentTrack.path, 'version-b.wav');
  audio.setShuffle(true);
  audio.next();
  assert.equal(audio.currentTrack.path, 'other-song.wav');
});

test('current session stays in search results while restart rebuilds the chosen category', () => {
  const audio = engine();
  const scope = { type: 'category', categoryId: 'warm' };
  audio.setQueue(library.slice(0, 2), 0, scope);
  assert.deepEqual(paths(audio.playbackQueue), ['version-a.wav', 'version-b.wav']);
  const saved = JSON.parse(JSON.stringify({ playbackScope: audio.playbackScope,
    lastTrackPath: 'version-a.wav', savedQueuePaths: paths(audio.playbackQueue) }));
  const categories = [{ id: 'warm', trackPaths: ['version-a.wav', 'other-song.wav'] }];
  audio.restoreStartupQueue(library, saved, categories);
  assert.deepEqual(paths(audio.playbackQueue), ['version-a.wav', 'other-song.wav']);
  audio.loadTrack(audio.playbackQueue[audio.queueIndex]); audio.setShuffle(true); audio.next();
  assert.equal(audio.currentTrack.path, 'other-song.wav');
  assert.equal(audio.playbackScope.categoryId, 'warm');
});

test('deleted/empty category or removed current membership falls back to whole library', () => {
  for (const categories of [[], [{ id: 'warm', trackPaths: [] }],
    [{ id: 'warm', trackPaths: ['other-song.wav'] }]]) {
    const audio = engine();
    audio.restoreStartupQueue(library, { lastTrackPath: 'version-b.wav',
      playbackScope: { type: 'category', categoryId: 'warm' } }, categories);
    assert.deepEqual(paths(audio.playbackQueue), paths(library));
    assert.equal(audio.queueIndex, 1); assert.equal(audio.playbackScope.type, 'library');
  }
});

test('library startup includes newly added songs and excludes deleted cached queue paths', () => {
  const audio = engine();
  audio.restoreStartupQueue(library, { lastTrackPath: 'deleted.wav',
    savedQueuePaths: ['deleted.wav'], playbackScope: { type: 'library' } });
  assert.deepEqual(paths(audio.playbackQueue), paths(library)); assert.equal(audio.queueIndex, 0);
  audio.restoreStartupQueue([], null);
  assert.equal(audio.playbackQueue.length, 0);
});
