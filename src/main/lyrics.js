const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const timing = require('../renderer/js/lyricTiming');
const EXTENSIONS = ['.elrc', '.yrc', '.lrc', '.json', '.txt'];
async function readText(file) {
  const stat = await fs.stat(file);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw Error('歌词文件不能超过 2MB');
  const buffer = await fs.readFile(file);
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le');
  if (buffer[0] === 0xfe && buffer[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
  catch { return new TextDecoder('gb18030').decode(buffer); }
}
function createService({ userData, isKnownTrack, readEmbedded, defaultFolder = null }) {
  const dir = path.join(userData, 'lyrics');
  const folderConfig = path.join(dir, 'library-folder.json');
  let catalogCache;
  const identity = file => path.resolve(file).toLowerCase();
  async function getFolder() {
    try { return JSON.parse(await fs.readFile(folderConfig, 'utf8')).folder; }
    catch (e) { if (e.code === 'ENOENT') return defaultFolder; throw e; }
  }
  async function catalog(root) {
    const index = path.join(root, 'glasswave-library.json');
    const stat = await fs.stat(index);
    if (catalogCache?.root === root && catalogCache.mtime === stat.mtimeMs) return catalogCache;
    const data = JSON.parse(await readText(index));
    if (data.version !== 1 || !Array.isArray(data.tracks) || data.tracks.length > 20000) throw Error('歌词库索引格式无效');
    const tracks = new Map();
    for (const item of data.tracks) {
      if (typeof item.audio_path !== 'string' || !path.isAbsolute(item.audio_path) || typeof item.lyrics_file !== 'string' || path.isAbsolute(item.lyrics_file)) throw Error('歌词库索引路径无效');
      const file = path.resolve(root, item.lyrics_file);
      const relative = path.relative(path.resolve(root), file);
      if (relative.startsWith('..') || path.isAbsolute(relative)) throw Error('歌词文件超出所选歌词库目录');
      const key = identity(item.audio_path);
      if (tracks.has(key)) throw Error('歌词库包含同一音频的多个版本，请先确认');
      tracks.set(key, file);
    }
    catalogCache = { root, mtime: stat.mtimeMs, tracks };
    return catalogCache;
  }
  async function setFolder(root) {
    if (typeof root !== 'string' || !path.isAbsolute(root)) throw Error('请选择歌词库文件夹');
    const selected = await catalog(root);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(folderConfig, JSON.stringify({ folder: root }), 'utf8');
    return { folder: root, count: selected.tracks.size };
  }
  const savedPath = track => path.join(dir, crypto.createHash('sha256').update(path.resolve(track).toLowerCase()).digest('hex') + '.json');
  function validate(track) { if (typeof track !== 'string' || !path.isAbsolute(track) || !isKnownTrack(track)) throw Error('请选择当前曲库中的歌曲'); }
  async function readFile(file) {
    const ext = path.extname(file).toLowerCase();
    if (!EXTENSIONS.includes(ext)) throw Error('支持 LRC、ELRC、YRC、JSON 和 TXT 歌词');
    return { document: timing.parse(await readText(file), ext), source: path.basename(file) };
  }
  async function loadOriginal(track) {
    validate(track);
    try { const saved = JSON.parse(await readText(savedPath(track))); return { document: timing.normalize(saved.document.lines, saved.document.format), source: saved.source, imported: true }; }
    catch (e) { if (e.code !== 'ENOENT') return { error: '已导入的歌词不可读，请重新导入：' + e.message }; }
    try {
      const root = await getFolder();
      const library = root ? await catalog(root) : null;
      const file = library?.tracks.get(identity(track));
      if (file) {
        const source = await readText(file);
        const data = JSON.parse(source);
        if (typeof data.audio_path !== 'string' || identity(data.audio_path) !== identity(track)) throw Error('歌词与当前音频路径不一致');
        return { document: timing.parse(source, '.json'), source: path.basename(file), libraryFolder: root };
      }
    } catch (e) {
      if (e.code !== 'ENOENT') return { error: '歌词库读取失败：' + e.message };
    }
    const stem = path.basename(track, path.extname(track)), folder = path.dirname(track);
    let lastError = '';
    for (const sub of ['', 'lyrics', 'Lyrics', 'LRC']) for (const ext of EXTENSIONS) {
      const file = path.join(folder, sub, stem + ext);
      try { return await readFile(file); }
      catch (e) { if (e.code !== 'ENOENT') lastError = e.message; }
    }
    if (readEmbedded) {
      try {
        const embedded = await readEmbedded(track);
        if (embedded) return { document: timing.parse(embedded), source: '音频内嵌歌词' };
      } catch (e) { lastError = e.message; }
    }
    return lastError ? { error: lastError } : { document: null, source: '' };
  }
  async function importFile(track, file) {
    validate(track);
    const result = await readFile(file);
    await fs.mkdir(dir, { recursive: true });
    const saved = savedPath(track), temporary = saved + '.next';
    const packed = JSON.stringify(result);
    if (Buffer.byteLength(packed, 'utf8') > 2 * 1024 * 1024) throw Error('解析后的歌词过大，请减少歌词片段');
    await fs.writeFile(temporary, packed);
    await fs.rename(temporary, saved);
    return { ...result, imported: true };
  }
  const translationPath = track => savedPath(track).replace(/\.json$/, '.translation.json');
  async function load(track) {
    const result = await loadOriginal(track);
    if (!result.document) return result;
    try {
      const saved = JSON.parse(await readText(translationPath(track)));
      return { ...result, document: timing.attachTranslation(result.document, timing.normalize(saved.document.lines, saved.document.format)), translationSource: saved.source };
    } catch (e) {
      if (e.code !== 'ENOENT') return { ...result, translationError: '译文未载入：' + e.message };
      return result;
    }
  }
  async function importTranslation(track, file) {
    validate(track);
    const original = await loadOriginal(track);
    if (!original.document) throw Error('请先载入当前歌曲的原文歌词');
    const translated = await readFile(file);
    const document = timing.attachTranslation(original.document, translated.document);
    const packed = JSON.stringify(translated);
    if (Buffer.byteLength(packed, 'utf8') > 2 * 1024 * 1024) throw Error('解析后的译文过大');
    await fs.mkdir(dir, { recursive: true });
    const saved = translationPath(track), temporary = saved + '.next';
    await fs.writeFile(temporary, packed); await fs.rename(temporary, saved);
    return { ...original, document, translationSource: translated.source };
  }
  return { load, importFile, setFolder, importTranslation };
}
module.exports = { createService, readText };
