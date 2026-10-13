const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { NcmDecoder, isNcm } = require('../src/main/ncm');
const MetadataParser = require('../src/main/metadata');
const LibraryScanner = require('../src/main/scanner');
const fixtures = path.join(__dirname, 'fixtures/ncm');

async function temporary(run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'glasswave-ncm-test-'));
  try { await run(root); }
  finally {
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function source(root, format = 'mp3', name = '歌曲.NCM') {
  const file = path.join(root, name);
  fs.copyFileSync(path.join(fixtures, 'tone-' + format + '.ncm'), file);
  return file;
}

function offsets(buffer) {
  const metadataLength = 14 + buffer.readUInt32LE(10);
  const imageSpace = metadataLength + 4 + buffer.readUInt32LE(metadataLength) + 5;
  return { metadataLength, imageSpace, audio: imageSpace + 8 + buffer.readUInt32LE(imageSpace) };
}

for (const format of ['mp3', 'flac']) test('restores exact ' + format + ' bytes, including padded cover and incorrect format tags', () => temporary(async root => {
  const file = source(root, format);
  const original = fs.readFileSync(file);
  const result = await new NcmDecoder(path.join(root, 'cache')).prepare(file);
  assert.equal(path.extname(result.audioPath), '.' + format);
  assert.deepEqual(fs.readFileSync(result.audioPath), fs.readFileSync(path.join(fixtures, 'tone.' + format)));
  assert.equal(result.metadata.musicName, '测试音调');
  assert.equal(result.cover.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.deepEqual(fs.readFileSync(file), original);
  assert.equal(fs.existsSync(path.join(root, '歌曲.' + format)), false);
}));

test('cache reuses audio, coalesces jobs, rebuilds missing files and invalidates changed sources', () => temporary(async root => {
  const file = source(root), decoder = new NcmDecoder(path.join(root, 'cache'));
  const a = decoder.prepare(file), b = decoder.prepare(file);
  assert.equal(a, b);
  const first = await a;
  const oldTime = new Date(100000);
  fs.utimesSync(first.audioPath, oldTime, oldTime);
  assert.equal((await decoder.prepare(file)).audioPath, first.audioPath);
  assert.equal(fs.statSync(first.audioPath).mtimeMs, oldTime.getTime());
  fs.unlinkSync(first.audioPath);
  assert.equal((await decoder.prepare(file)).audioPath, first.audioPath);
  fs.writeFileSync(first.audioPath, 'broken cache');
  await decoder.prepare(file);
  assert.deepEqual(fs.readFileSync(first.audioPath), fs.readFileSync(path.join(fixtures, 'tone.mp3')));
  fs.appendFileSync(file, Buffer.from([0]));
  const changed = await decoder.prepare(file);
  assert.notEqual(changed.audioPath, first.audioPath);
  const other = source(root, 'mp3', '另一首.ncm');
  assert.notEqual((await decoder.prepare(other)).audioPath, first.audioPath);
}));

test('stream decoding keeps its mask position across chunks larger than 64 KiB', () => temporary(async root => {
  const file = source(root), wrapped = fs.readFileSync(file), start = offsets(wrapped).audio;
  const inputBlock = wrapped.subarray(start, start + 256);
  const plainBlock = fs.readFileSync(path.join(fixtures, 'tone.mp3')).subarray(0, 256);
  const encrypted = Buffer.concat([...Array(300).fill(inputBlock), inputBlock.subarray(0, 73)]);
  const expected = Buffer.concat([...Array(300).fill(plainBlock), plainBlock.subarray(0, 73)]);
  fs.writeFileSync(file, Buffer.concat([wrapped.subarray(0, start), encrypted]));
  const decoded = await new NcmDecoder(path.join(root, 'cache')).prepare(file);
  assert.deepEqual(fs.readFileSync(decoded.audioPath), expected);
}));

test('missing or damaged optional metadata still permits decoding', () => temporary(async root => {
  const file = source(root), wrapped = fs.readFileSync(file), pos = offsets(wrapped).metadataLength;
  const length = wrapped.readUInt32LE(pos);
  for (const broken of [false, true]) {
    const value = broken ? Buffer.from(wrapped) : Buffer.concat([wrapped.subarray(0, pos), Buffer.alloc(4), wrapped.subarray(pos + 4 + length)]);
    if (broken) value.fill(0, pos + 4, pos + 4 + length);
    fs.writeFileSync(file, value);
    const decoded = await new NcmDecoder(path.join(root, 'cache')).prepare(file);
    assert.deepEqual(decoded.metadata, {});
    assert.deepEqual(fs.readFileSync(decoded.audioPath), fs.readFileSync(path.join(fixtures, 'tone.mp3')));
  }
}));

test('rejects invalid headers, truncated fields, excessive lengths and damaged audio without partial cache files', () => temporary(async root => {
  const file = source(root), good = fs.readFileSync(file), pos = offsets(good);
  const badMagic = Buffer.from(good); badMagic[0] = 0;
  const badKey = Buffer.from(good); badKey[14] ^= 1;
  const hugeKey = Buffer.from(good); hugeKey.writeUInt32LE(0xffffffff, 10);
  const hugeMeta = Buffer.from(good); hugeMeta.writeUInt32LE(0xffffffff, pos.metadataLength);
  const badCover = Buffer.from(good); badCover.writeUInt32LE(0xffffffff, pos.imageSpace + 4);
  const badAudio = Buffer.from(good); badAudio.fill(0, pos.audio, pos.audio + 16);
  const cache = path.join(root, 'cache'), decoder = new NcmDecoder(cache);
  for (const value of [badMagic, badKey, hugeKey, hugeMeta, badCover, badAudio, good.subarray(0, 13), good.subarray(0, pos.audio)]) {
    fs.writeFileSync(file, value);
    await assert.rejects(decoder.prepare(file), /NCM 解码失败/);
    assert.equal(decoder.jobs.size, 0);
    assert.equal(fs.existsSync(path.join(cache, 'ncm')), false);
  }
}));

test('metadata, covers and audio spec use decoded content while preserving source identity', () => temporary(async root => {
  const file = source(root, 'flac'), parser = new MetadataParser(path.join(root, 'cache'));
  const track = await parser.parseFile(file);
  assert.equal(track.path, file);
  assert.equal(track.title, '测试音调');
  assert.equal(track.artist, '测试歌手 / 协作歌手');
  assert.equal(track.album, '合成测试专辑');
  assert.equal(track.mtime, fs.statSync(file).mtimeMs);
  assert.equal(track.audioSpec.isLossless, true);
  assert.equal(track.audioSpec.sampleRate, 44100);
  assert.equal(path.extname(track.playbackPath), '.flac');
  assert.match(await parser.getCoverDataUrl(file), /^data:image\/png;base64,/);
  const bad = path.join(root, 'bad.ncm'); fs.writeFileSync(bad, 'not music');
  await assert.rejects(parser.parseFile(bad), /NCM 解码失败/);
}));

test('scanner indexes NCM only once, honors hidden paths, survives a bad file and prunes removed sources', () => temporary(async root => {
  const music = path.join(root, 'music'); fs.mkdirSync(music);
  const file = source(music), hidden = source(music, 'flac', 'hidden.ncm');
  fs.writeFileSync(path.join(music, 'bad.ncm'), 'not music');
  const tracks = new Map();
  const db = { getAllTracks: () => [...tracks.values()], getTrack: p => tracks.get(p), isHidden: p => p === hidden,
    upsertTrack: t => tracks.set(t.path, t), batchRemoveTracks: paths => paths.forEach(p => tracks.delete(p)), save() {} };
  const scanner = new LibraryScanner(db, new MetadataParser(path.join(root, 'cache')));
  try {
    assert.equal(isNcm(file), true); assert.equal(scanner.isSupportedAudio(file), true);
    await scanner.scanDirectory(music);
    await scanner.scanDirectory(music);
    assert.deepEqual([...tracks.keys()], [file]);
    fs.unlinkSync(file);
    await scanner.scanDirectory(music);
    assert.equal(tracks.size, 0);
  } finally { await scanner.close(); }
}));

function engine(resolveAudioPath) {
  const context = { window: { glasswaveAPI: { resolveAudioPath } }, URL, console };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/audioEngine.js'), 'utf8'), context);
  const audio = Object.create(context.window.AudioEngine.prototype);
  audio.ensureAudioContext = () => {};
  audio.audio = { src: '', load() {}, pause() {}, play() { audio.played = true; return Promise.resolve(); }, removeAttribute() { this.src = ''; } };
  audio.playbackQueue = [];
  return audio;
}

test('folder watcher automatically decodes added/changed NCM and removes deleted sources', { timeout: 15000 }, () => temporary(async root => {
  const music = path.join(root, 'music'); fs.mkdirSync(music);
  const tracks = new Map();
  const db = { getAllTracks: () => [...tracks.values()], getTrack: p => tracks.get(p), isHidden: () => false,
    upsertTrack: t => tracks.set(t.path, t), batchRemoveTracks: paths => paths.forEach(p => tracks.delete(p)), save() {} };
  const scanner = new LibraryScanner(db, new MetadataParser(path.join(root, 'cache')));
  async function until(predicate) {
    const deadline = Date.now() + 5000;
    while (!predicate()) {
      if (Date.now() > deadline) throw Error('watcher did not update the library');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  try {
    scanner.watchFolder(music);
    await new Promise(resolve => scanner.watchers.get(music).once('ready', resolve));
    const file = source(music);
    await until(() => tracks.has(file));
    assert.equal(tracks.get(file).audioSpec.isLossless, false);
    source(music, 'flac');
    await until(() => tracks.get(file)?.audioSpec.isLossless);
    assert.equal(tracks.size, 1);
    fs.unlinkSync(file);
    await until(() => tracks.size === 0);
  } finally { await scanner.close(); }
}));

test('drop IPC imports valid NCM and ordinary audio, reports bad files and retains source-based duplicate detection', () => temporary(async root => {
  const file = source(root), bad = path.join(root, 'bad.ncm'), ordinary = path.join(root, 'tone.mp3');
  fs.writeFileSync(bad, 'broken'); fs.copyFileSync(path.join(fixtures, 'tone.mp3'), ordinary);
  const handlers = {}, tracks = new Map();
  const context = { fs, path, parser: new MetadataParser(path.join(root, 'cache')), database: { tracks }, scanner: null,
    ipcMain: { handle: (name, handler) => { handlers[name] = handler; } } };
  const code = fs.readFileSync(path.join(__dirname, '../src/main/main.js'), 'utf8');
  vm.runInNewContext(code.slice(code.indexOf('  const SUPPORTED_EXTS'), code.indexOf("  ipcMain.handle('library-import-tracks'")), context);
  const result = await handlers['library-scan-dropped-items']({}, [bad, file, ordinary]);
  assert.equal(result.newCount, 2); assert.equal(result.tracks.length, 2);
  assert.equal(result.errors.length, 1); assert.equal(result.errors[0].path, bad);
  assert.equal(result.tracks[0].path, file);
  tracks.set(file, result.tracks[0]);
  const duplicate = await handlers['library-scan-dropped-items']({}, [file]);
  assert.equal(duplicate.duplicateCount, 1); assert.equal(duplicate.newCount, 0);
  assert.equal(duplicate.tracks[0], result.tracks[0]);
}));

test('NCM playback resolves cache but keeps source identity; a later track wins over pending decode', async () => {
  let done;
  const audio = engine(() => new Promise(resolve => { done = resolve; }));
  const ncm = { path: 'C:\\music\\test.ncm' };
  const pending = audio.loadTrack(ncm);
  const ordinary = { path: 'C:\\music\\ordinary.mp3' };
  await audio.loadTrack(ordinary);
  done('C:\\cache\\decoded.mp3'); await pending;
  assert.equal(audio.currentTrack, ordinary);
  assert.match(audio.audio.src, /ordinary\.mp3$/);
  const second = audio.loadTrack(ncm, false);
  done('C:\\cache\\decoded.mp3'); await second;
  assert.equal(audio.currentTrack, ncm);
  assert.match(audio.audio.src, /decoded\.mp3$/);
});

test('pause during decoding cancels autoplay, and decode failures surface without replaying old audio', async () => {
  let done;
  const audio = engine(() => new Promise(resolve => { done = resolve; }));
  const pending = audio.loadTrack({ path: 'C:\\music\\test.ncm' });
  audio.seek(12);
  audio.pause(); done('C:\\cache\\decoded.mp3'); await pending;
  assert.equal(audio.played, undefined);
  assert.equal(audio.audio.currentTime, 12);
  const failed = engine(async () => { throw Error('NCM 解码失败：文件不完整'); });
  failed.audio.src = 'file:///old.mp3';
  let error; failed.onPlaybackError = message => { error = message; };
  await failed.loadTrack({ path: 'C:\\music\\bad.ncm' });
  assert.match(error, /文件不完整/);
  assert.equal(failed.audio.src, '');
  assert.equal(failed.played, undefined);
});
