const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const MetadataParser = require('../src/main/metadata');
const LibraryScanner = require('../src/main/scanner');

test('numeric suffixes and bare hyphens remain part of a filename title', () => {
  const parser = Object.create(MetadataParser.prototype);
  for (const name of ['ALL - 4', 'all-4', 'Love-Hate', 'ALL - 4 - 2']) {
    const track = parser.extractMetadataHeuristics(path.join('MUSIC', name + '.wav'), {}, {});
    assert.equal(track.title, name);
    assert.equal(track.artist, '未知艺术家');
  }
  assert.equal(parser.extractMetadataHeuristics('ALL - 4.wav', { artist: 'O Reg' }, {}).artist, 'O Reg');
  assert.equal(parser.extractMetadataHeuristics('Artist - Song.mp3', {}, {}).title, 'Song');
  assert.equal(parser.extractMetadataHeuristics('Artist - Song.mp3', {}, {}).artist, 'Artist');
  assert.equal(parser.extractMetadataHeuristics('01 - Song.mp3', {}, {}).title, 'Song');
  assert.equal(parser.extractMetadataHeuristics('all-4.wav', { title: 'Embedded title' }, {}).title, 'Embedded title');
});

test('cache refresh selects only ambiguous old guesses and stops after reparse', () => {
  const parser = Object.create(MetadataParser.prototype);
  assert.equal(parser.needsTitleRefresh({ path: 'ALL - 4.wav', title: '4' }), true);
  assert.equal(parser.needsTitleRefresh({ path: 'all-4.wav', title: '4' }), true);
  assert.equal(parser.needsTitleRefresh({ path: 'Love-Hate.wav', title: 'Hate' }), true);
  assert.equal(parser.needsTitleRefresh({ path: 'ALL - 4.wav', title: 'Other title' }), false);
  assert.equal(parser.needsTitleRefresh({ path: 'Artist - Song.mp3', title: 'Song' }), false);
  assert.equal(parser.needsTitleRefresh({ path: 'ALL - 4.wav', title: '4', titleNamingVersion: 2 }), false);
});

test('cached ambiguous titles are refreshed without rewriting audio or losing library associations', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glasswave-title-test-'));
  let scanner;
  try {
    // Small valid PCM WAV; no user music is used or modified.
    const audio = Buffer.alloc(48);
    audio.write('RIFF'); audio.writeUInt32LE(40, 4); audio.write('WAVEfmt ', 8);
    audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22);
    audio.writeUInt32LE(44100, 24); audio.writeUInt32LE(88200, 28);
    audio.writeUInt16LE(2, 32); audio.writeUInt16LE(16, 34); audio.write('data', 36); audio.writeUInt32LE(4, 40);
    const file = path.join(root, 'ALL - 4.wav'); fs.writeFileSync(file, audio);
    const parser = new MetadataParser(path.join(root, 'cache'));
    let track = { path: file, title: '4', tags: ['爱'], dateAdded: 123, isFavorite: true };
    const db = { getAllTracks: () => [track], isHidden: () => false,
      upsertTrack(next) { track = { ...track, ...next, tags: track.tags, dateAdded: track.dateAdded, isFavorite: track.isFavorite }; }, save() {} };
    scanner = new LibraryScanner(db, parser);
    await scanner.refreshAmbiguousTitles();
    assert.equal(track.title, 'ALL - 4');
    assert.deepEqual(track.tags, ['爱']); assert.equal(track.dateAdded, 123); assert.equal(track.isFavorite, true);
    assert.equal(track.titleNamingVersion, 2); assert.deepEqual(fs.readFileSync(file), audio);
  } finally {
    if (scanner) await scanner.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
