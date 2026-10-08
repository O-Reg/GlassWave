const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const timing = require('../src/renderer/js/lyricTiming');
const { createService } = require('../src/main/lyrics');

test('LRC repeated timestamps, translations, offset and backward seeks stay deterministic', () => {
  const doc = timing.parse('[offset:200]\n[00:01.00][00:06.00]First\n[00:01.00]翻译\n[00:03.50]Second');
  assert.equal(doc.wordTimed, false);
  assert.deepEqual(doc.lines.map(l => l.start), [800, 3300, 5800]);
  assert.equal(doc.lines[0].translation, '翻译');
  assert.equal(timing.locate(doc.lines, 7000), 2);
  assert.equal(timing.locate(doc.lines, 1500), 0);
  assert.equal(timing.locate(doc.lines, 0), -1);
});
test('enhanced LRC handles word endpoints, pauses and unicode text', () => {
  const doc = timing.parse('[00:12.00]<00:12.00>The <00:12.50>pattern<00:15.00>\n[00:16.00]世界');
  assert.equal(doc.lines[0].text, 'The pattern');
  assert.equal(doc.lines[0].words[1].end, 15000);
  assert.equal(timing.wordProgress(doc.lines[0].words[1], 13750), .5);
  assert.equal(timing.wordProgress(doc.lines[0].words[1], 11000), 0);
  assert.equal(timing.wordProgress(doc.lines[0].words[1], 15500), 1);
});
test('YRC and JSON word durations preserve gaps and use explicit time units', () => {
  const yrc = timing.parse('[1000,3000](1000,500,0)你(2000,1000,0)好', '.yrc');
  assert.equal(yrc.lines[0].text, '你好');
  assert.equal(timing.wordProgress(yrc.lines[0].words[1], 1700), 0);
  const doc = timing.parse(JSON.stringify({ timeUnit: 's', lines: [{ start: 1, end: 4, words: [{ start: 1, duration: .5, text: 'Hello ' }, { start: 2, end: 3, text: 'world' }], translation: '你好世界' }] }), '.json');
  assert.equal(doc.lines[0].words[0].end, 1500);
  assert.equal(doc.lines[0].end, 4000);
  assert.equal(doc.lines[0].translation, '你好世界');
  assert.equal(timing.parse('{"lrc":{"lyric":"[00:01.00]嵌套歌词"}}', '.json').lines[0].start, 1000);
});
test('invalid timestamps and malformed JSON fail rather than pretend to be synchronized', () => {
  assert.throws(() => timing.parse('{oops}', '.json'));
  assert.throws(() => timing.parse('{"lines":[{"start":"bad","text":"x"}]}', '.json'), /时间/);
  assert.throws(() => timing.parse('{"lines":[{"start":" ","text":"x"}]}', '.json'), /时间/);
  assert.throws(() => timing.parse(JSON.stringify({ lines: [{ start: 0, words: Array.from({ length: 513 }, (_, i) => ({ start: i, text: 'a' })) }] }), '.json'), /512/);
  assert.throws(() => timing.parse('{"lines":[{"start":1000,"end":500,"text":"x"}]}', '.json'), /时间/);
  assert.throws(() => timing.parse('{"lines":[{"start":0,"words":[{"start":5,"text":"a"},{"start":2,"text":"b"}]}]}', '.json'), /先后/);
  const plain = timing.parse('无时间的歌词\nSecond line', '.txt');
  assert.equal(plain.timed, false);
  assert.equal(plain.lines.length, 2);
});
test('auto matching and imported lyrics survive restart without modifying music or original lyrics', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'glasswave-lyrics-test-'));
  try {
    const music = path.join(dir, 'Song.wav'), lrc = path.join(dir, 'Song.lrc'), json = path.join(dir, 'chosen.json');
    await fsp.writeFile(music, 'test audio placeholder');
    const raw = '[00:01.00]测试中文';
    await fsp.writeFile(lrc, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(raw, 'utf16le')]));
    const source = JSON.stringify({ lines: [{ start: 1000, end: 2000, words: [{ start: 1000, end: 2000, text: '<b>Text</b>' }] }] });
    await fsp.writeFile(json, source);
    const options = { userData: path.join(dir, 'data'), isKnownTrack: p => p === music };
    const service = createService(options);
    assert.equal((await service.load(music)).document.lines[0].text, '测试中文');
    await service.importFile(music, json);
    const result = await createService(options).load(music);
    assert.equal(result.imported, true);
    assert.equal(result.document.lines[0].words[0].text, '<b>Text</b>');
    assert.equal(await fsp.readFile(json, 'utf8'), source);
    assert.equal(await fsp.readFile(music, 'utf8'), 'test audio placeholder');
    await assert.rejects(() => service.load(path.join(dir, 'unknown.wav')), /曲库/);
  } finally {
    const resolved = path.resolve(dir);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('glasswave-lyrics-test-'));
    await fsp.rm(resolved, { recursive: true, force: true });
  }
});
function renderer() {
  const values = new Map(), requests = new Map();
  const storage = { get length() { return values.size; }, key: i => [...values.keys()][i], getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)), removeItem: k => values.delete(k) };
  const window = { GlassWaveLyricTiming: timing, glasswaveAPI: { loadLyrics: p => new Promise(resolve => requests.set(p, resolve)) } };
  const context = { window, localStorage: storage, document: { hidden: false }, requestAnimationFrame: () => 7, cancelAnimationFrame: () => {}, matchMedia: () => ({ matches: false }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/lyrics.js'), 'utf8'), context);
  return { window, context, values, storage, requests };
}

test('reset lyrics restores appearance and only the current song offset, preserving imported lyrics', () => {
  const { window, storage } = renderer();
  const c = Object.create(window.GlassWaveLyrics.LyricsController.prototype);
  c.settings = window.GlassWaveLyrics.settings({ enabled: true, size: 64, position: 'custom', background: 80 });
  c.trackPath = 'a.wav'; c.offset = 500; c.document = { lines: ['keep'] };
  storage.setItem('glasswave_lyrics_track_offsets', JSON.stringify({ 'a.wav': 500, 'b.wav': 1000 }));
  const elements = {}; c.panel = { querySelector: key => elements[key] ||= {} };
  c.setPositioning = value => { c.positioning = value; }; c.applySettings = () => {};
  c.resetSettings();
  assert.equal(c.settings.enabled, true); assert.equal(c.settings.size, 28);
  assert.equal(c.settings.position, 'below'); assert.equal(c.settings.background, 35);
  assert.equal(c.settings.width, 64); assert.equal(c.settings.height, 32); assert.equal(c.settings.translationSize, 28);
  assert.equal(c.offset, 0); assert.equal(c.positioning, false);
  assert.deepEqual(JSON.parse(storage.getItem('glasswave_lyrics_track_offsets')), { 'b.wav': 1000 });
  assert.equal(c.document.lines[0], 'keep');
});
test('rapid track switches discard old lyric reads and disabling cancels the frame loop', async () => {
  const { window, requests } = renderer();
  const c = Object.create(window.GlassWaveLyrics.LyricsController.prototype);
  c.settings = { enabled: true }; c.engine = { currentTrack: { path: 'a.wav' } }; c.generation = 0;
  c.panel = { hidden: true, querySelector: () => ({ value: 0, textContent: '' }) }; c.render = () => {};
  let accepted;
  c.accept = result => { accepted = result; };
  const a = c.setTrack(c.engine.currentTrack);
  c.engine.currentTrack = { path: 'b.wav' };
  const b = c.setTrack(c.engine.currentTrack);
  requests.get('b.wav')({ source: 'B' }); await b;
  requests.get('a.wav')({ source: 'A' }); await a;
  assert.equal(accepted.source, 'B');
  c.frame = 7; c.settings.enabled = false; c.schedule();
  assert.equal(c.frame, null);
});
test('lyric appearance belongs to skins but per-song timing offsets do not', () => {
  const { window, context, storage } = renderer();
  context.document = { getElementById: () => null };
  storage.setItem('glasswave_lyrics_settings_v1', JSON.stringify({ neighbor: '#8899aa', normal: '#ffffff', highlight: '#76ddff', glow: 12, size: 32, translationSize: 40, neighborSize: 18, width: 42, height: 60, background: 35, position: 'custom', x: 23, y: 70 }));
  storage.setItem('glasswave_lyrics_track_offsets', '{"song.wav":500}');
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/renderer/js/skinFiles.js'), 'utf8'), context);
  const skin = window.GlassWaveSkin.capture({ visualizer: { tuning: {}, mode: 'wave', intensity: 1, positionPreset: 'behind', offsetY: 0, visScale: 1 } });
  assert.equal(skin.settings.glasswave_lyrics_settings_v1, storage.getItem('glasswave_lyrics_settings_v1'));
  assert.equal(skin.settings.glasswave_lyrics_track_offsets, undefined);
  const sanitized = window.GlassWaveLyrics.settings({ size: 999, glow: -10, highlight: 'url(unsafe)', x: -200 });
  assert.equal(sanitized.size, 64); assert.equal(sanitized.glow, 0); assert.equal(sanitized.x, 0); assert.equal(sanitized.highlight, '#64eaff');
});

test('frame dimensions, three colors and translation size survive settings reload and old dark preset migrates', () => {
  const { window } = renderer();
  const s = window.GlassWaveLyrics.settings({ width: 42, height: 60, x: 23, y: 41, neighbor: '#8899aa', normal: '#ffffff', highlight: '#ffdd66', translationSize: 40, neighborSize: 18, size: 32, background: 45 });
  const restored = window.GlassWaveLyrics.settings(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.width, 42); assert.equal(restored.height, 60); assert.equal(restored.x, 23);
  assert.equal(restored.normal, '#ffffff'); assert.equal(restored.neighbor, '#8899aa'); assert.equal(restored.highlight, '#ffdd66');
  assert.equal(restored.translationSize, 40); assert.equal(restored.neighborSize, 18); assert.equal(restored.size, 32);
  const old = window.GlassWaveLyrics.settings({ normal: '#343b49', highlight: '#0079a8' });
  assert.equal(old.normal, '#fff3d0'); assert.equal(old.background, 35);
  const custom = window.GlassWaveLyrics.settings({ normal: '#343b49', highlight: '#ffdd66', width: 500, height: -10 });
  assert.equal(custom.normal, '#343b49'); assert.equal(custom.width, 92); assert.equal(custom.height, 12);
});

test('color presets change only colors, keep transparency and dim context relative to current and karaoke', () => {
  const { window } = renderer();
  const c = Object.create(window.GlassWaveLyrics.LyricsController.prototype);
  c.settings = window.GlassWaveLyrics.settings({ background: 73, size: 40, width: 42, x: 23 });
  c.save = () => {}; c.applySettings = () => {};
  const luminance = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).reduce((s, n) => s + n, 0);
  for (const name of Object.keys(window.GlassWaveLyrics.PALETTES)) {
    c.applyPalette(name);
    assert.equal(c.settings.background, 73); assert.equal(c.settings.size, 40); assert.equal(c.settings.width, 42); assert.equal(c.settings.x, 23);
    assert.ok(luminance(c.settings.normal) > luminance(c.settings.neighbor) * 2);
    assert.ok(luminance(c.settings.highlight) > luminance(c.settings.neighbor) * 2);
  }
  const migrated = window.GlassWaveLyrics.settings({ neighbor: '#c1ae8b', normal: '#fff3d4', highlight: '#ffd279', background: 73 });
  assert.equal(migrated.background, 73); assert.equal(migrated.neighbor, '#645640');
});

test('closing lyrics settings releases owned focus to the player instead of pinning the bottom bar', () => {
  const { window, context } = renderer();
  const classes = new Set(['lyrics-settings-open', 'zen-mode']); let blurred = false, focused = false, refreshed = false;
  const active = { blur: () => { blurred = true; } };
  context.document = { activeElement: active, body: { classList: { remove: k => classes.delete(k), contains: k => classes.has(k) } } };
  const c = Object.create(window.GlassWaveLyrics.LyricsController.prototype);
  c.panel = { hidden: false, contains: e => e === active };
  c.stage = { contains: () => false, parentElement: { hasAttribute: () => true, focus: () => { focused = true; } } };
  c.button = { focus: () => { throw Error('must not pin focus in player bar'); } };
  c.setPositioning = () => {}; c.ui = { currentView: 'player', refreshZenPointerState: () => { refreshed = true; } };
  c.closePanel(); assert.equal(c.panel.hidden, true); assert.equal(classes.has('lyrics-settings-open'), false);
  assert.equal(blurred, true); assert.equal(focused, true); assert.equal(refreshed, true);
});

test('long lyric gaps and next-line transitions never clear or animate the background frame', () => {
  const { window, context } = renderer();
  const element = () => ({ className: '', textContent: '', children: [], classList: { add() {}, remove() {} }, appendChild(e) { this.children.push(e); }, setAttribute() {} });
  context.document.createElement = () => element();
  let animations = 0;
  const content = element(); content.replaceChildren = () => { content.children = []; }; content.getAnimations = () => []; content.animate = () => { animations++; };
  const c = Object.create(window.GlassWaveLyrics.LyricsController.prototype);
  c.settings = window.GlassWaveLyrics.settings({ enabled: true }); c.audio = { currentTime: 1 }; c.document = timing.parse('{"lines":[{"start":1000,"end":3000,"text":"One"},{"start":60000,"end":65000,"text":"Two"}]}', '.json');
  c.stage = { hidden: false, classList: { remove() {} }, replaceChildren: () => { throw Error('frame must persist'); }, animate: () => { throw Error('only text animates'); } };
  c.content = content; c.mountHandles = () => {}; c.updatePlacement = () => {}; c.render(true);
  const prior = content.children[0]; c.audio.currentTime = 25; c.render();
  assert.equal(content.children[0], prior); assert.equal(c.stage.hidden, false);
  c.audio.currentTime = 60; c.render(); assert.equal(animations, 1); assert.equal(c.stage.hidden, false);
});
test('aligner JSON seconds and punctuation preserve the sung text', () => {
  const doc = timing.parse(JSON.stringify({ alignment_method: 'ctc-forced-aligner', lines: [{ text: 'Hello, world!', words: [{ text: 'Hello,', start: 20, end: 21 }, { text: 'world!', start: 22, end: 23 }] }] }), '.json');
  assert.equal(doc.lines[0].start, 20000);
  assert.equal(doc.lines[0].text, 'Hello, world!');
  assert.equal(doc.lines[0].words[1].text, ' world!');
});
test('central library matches full audio paths and persists the chosen folder', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'glasswave-lyrics-test-'));
  try {
    const library = path.join(dir, 'library'); await fsp.mkdir(library);
    const audioA = path.join(dir, 'V1', 'same.wav'), audioB = path.join(dir, 'V2', 'same.wav');
    const source = JSON.stringify({ audio_path: audioA, alignment_method: 'ctc-forced-aligner', lines: [{ text: '你好', words: [{ text: '你', start: 1, end: 2 }, { text: '好', start: 2, end: 3 }] }] });
    await fsp.writeFile(path.join(library, 'one.json'), source);
    await fsp.writeFile(path.join(library, 'glasswave-library.json'), JSON.stringify({ version: 1, tracks: [{ audio_path: audioA, lyrics_file: 'one.json' }] }));
    const options = { userData: path.join(dir, 'data'), isKnownTrack: p => [audioA,audioB].includes(p), defaultFolder: path.join(dir, 'missing') };
    const service = createService(options);
    assert.equal((await service.setFolder(library)).count, 1);
    assert.equal((await createService(options).load(audioA)).document.lines[0].start, 1000);
    assert.equal((await service.load(audioB)).document, null);
    assert.equal(await fsp.readFile(path.join(library, 'one.json'), 'utf8'), source);
    await fsp.writeFile(path.join(library, 'glasswave-library.json'), JSON.stringify({version:1, tracks:[{audio_path:audioA, lyrics_file:'../escape.json'}]}));
    await assert.rejects(()=>service.setFolder(library), /超出/);
  } finally {
    const resolved=path.resolve(dir); assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('glasswave-lyrics-test-'));
    await fsp.rm(resolved,{recursive:true,force:true});
  }
});

test('bilingual word lyrics retain karaoke timing and separate ordinary translations', () => {
  const ctc = timing.parse(JSON.stringify({ alignment_method: 'ctc-forced-aligner', lines: [{ text: 'Hello', translation: '你好', words: [{ text: 'Hello', start: 1, end: 2 }] }] }), '.json');
  assert.equal(ctc.lines[0].translation, '你好'); assert.equal(ctc.lines[0].words[0].start, 1000);
  const elrc = timing.parse('[00:01.00]<00:01.00>Hello<00:02.00>\n[00:01.00]你好');
  assert.equal(elrc.lines.length, 1); assert.equal(elrc.lines[0].translation, '你好'); assert.equal(elrc.wordTimed, true);
  const nested = timing.parse(JSON.stringify({ yrc: { lyric: '[1000,1000](1000,1000,0)Hello' }, tlyric: { lyric: '[00:01.00]你好' } }), '.json');
  assert.equal(nested.lines[0].translation, '你好'); assert.equal(nested.wordTimed, true);
  const { window } = renderer();
  assert.equal(window.GlassWaveLyrics.settings().background, 35);
  assert.equal(window.GlassWaveLyrics.settings().rows, 2);
  assert.equal(window.GlassWaveLyrics.settings({ translation: 'false' }).translation, false);
  assert.equal(window.GlassWaveLyrics.settings({ background: 200 }).background, 100);
});

test('translation matching rejects mismatched versions and leaves original word timing intact', () => {
  const base = timing.parse('[00:01.00]<00:01.00>One<00:02.00>\n[00:04.00]Two');
  const translated = timing.attachTranslation(base, timing.parse('第一句\n第二句', '.txt'));
  assert.equal(translated.lines[1].translation, '第二句');
  assert.deepEqual(translated.lines[0].words, base.lines[0].words);
  assert.equal(base.lines[0].translation, '');
  assert.throws(() => timing.attachTranslation(base, timing.parse('一行', '.txt')), /行/);
  assert.throws(() => timing.attachTranslation(base, timing.parse('[00:10.00]错误版本')), /版本/);
  assert.equal(timing.attachTranslation(base, timing.parse('[00:01.10]第一句')).lines[0].translation, '第一句');
});

test('imported translations persist per audio path without overwriting original or a valid translation', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'glasswave-lyrics-test-'));
  try {
    const audio = path.join(dir, 'Song.wav'), other = path.join(dir, 'Song V2.wav');
    const lrc = path.join(dir, 'Song.lrc'), translation = path.join(dir, 'translation.txt'), bad = path.join(dir, 'bad.txt');
    const raw = '[00:01.00]<00:01.00>One<00:02.00>\n[00:04.00]Two';
    await fsp.writeFile(lrc, raw); await fsp.writeFile(translation, '第一句\n第二句'); await fsp.writeFile(bad, '错误行数');
    const options = { userData: path.join(dir, 'data'), isKnownTrack: p => [audio,other].includes(p), defaultFolder: path.join(dir, 'missing') };
    const service = createService(options); await service.importTranslation(audio, translation);
    const loaded = await createService(options).load(audio);
    assert.equal(loaded.document.lines[0].translation, '第一句'); assert.equal(loaded.document.wordTimed, true);
    assert.equal((await service.load(other)).document, null);
    await assert.rejects(() => service.importTranslation(audio, bad), /行/);
    assert.equal((await service.load(audio)).document.lines[0].translation, '第一句');
    assert.equal(await fsp.readFile(lrc, 'utf8'), raw); assert.equal(await fsp.readFile(translation, 'utf8'), '第一句\n第二句');
  } finally {
    const resolved = path.resolve(dir); assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('glasswave-lyrics-test-'));
    await fsp.rm(resolved, { recursive: true, force: true });
  }
});

test('Zen dock reveal only lifts lyrics and preserves frame dimensions and font size',()=>{
  const {window,context}=renderer(),classes=new Set(['zen-mode']),props={},style={setProperty:(k,v)=>props[k]=v,getPropertyValue:k=>props[k]||''};
  const parent={classList:{remove(){}},getBoundingClientRect:()=>({top:0,bottom:700,height:700,width:1000})};
  const stage={hidden:false,parentElement:parent,style,clientHeight:200,clientWidth:640,scrollWidth:640,getBoundingClientRect:()=>({height:parseFloat(style.height)||200,width:parseFloat(style.width)||640})};
  const bar={offsetHeight:90,matches:()=>false,getBoundingClientRect:()=>({top:610,height:90})};
  context.document={body:{classList:{contains:k=>classes.has(k)}},querySelector:()=>bar,getElementById:()=>({getBoundingClientRect:()=>({bottom:450})})};
  context.getComputedStyle=e=>e===bar?{display:'flex',opacity:'1'}:{paddingTop:'12',paddingBottom:'12'};
  const c=Object.create(window.GlassWaveLyrics.LyricsController.prototype);c.stage=stage;c.content={scrollHeight:100};c.document={timed:true};
  for(const position of ['custom','below','bottom']){
    c.settings={width:64,height:32,size:36,position,x:50,y:85};c.updatePlacement();
    const before={width:style.width,height:style.height,size:props['--lyric-effective-size'],top:style.top};
    assert.equal(parseFloat(props['--lyric-dock-shift']),0);classes.add('zen-show-player-bar');c.updatePlacement();
    assert.deepEqual({width:style.width,height:style.height,size:props['--lyric-effective-size'],top:style.top},before);assert.ok(parseFloat(props['--lyric-dock-shift'])>0);
    classes.delete('zen-show-player-bar');c.updatePlacement();assert.equal(parseFloat(props['--lyric-dock-shift']),0);
  }
});
