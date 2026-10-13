const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const CORE_KEY = Buffer.from('687a4852416d736f356b496e62617857', 'hex');
const META_KEY = Buffer.from('2331346c6a6b5f215c5d2630553c2728', 'hex');
const isNcm = file => path.extname(file).toLowerCase() === '.ncm';
const invalid = message => new Error('NCM 解码失败：' + message);

function decrypt(data, key) {
  const cipher = crypto.createDecipheriv('aes-128-ecb', key, null);
  return Buffer.concat([cipher.update(data), cipher.final()]);
}

// NCM's audio mask repeats every 256 bytes (it is not standard RC4).
function audioMask(key) {
  const box = Uint8Array.from({ length: 256 }, (_, i) => i);
  let last = 0;
  for (let i = 0; i < 256; i++) {
    const next = (box[i] + last + key[i % key.length]) & 255;
    [box[i], box[next]] = [box[next], box[i]];
    last = next;
  }
  return Buffer.from(Array.from({ length: 256 }, (_, i) => {
    const j = (i + 1) & 255;
    return box[(box[j] + box[(box[j] + j) & 255]) & 255];
  }));
}

async function readHeader(handle, size) {
  let offset = 0;
  async function read(length) {
    if (offset + length > size) throw invalid('文件不完整');
    const buffer = Buffer.alloc(length);
    let done = 0;
    while (done < length) {
      const { bytesRead } = await handle.read(buffer, done, length - done, offset + done);
      if (!bytesRead) throw invalid('文件不完整');
      done += bytesRead;
    }
    offset += length;
    return buffer;
  }
  const uint32 = async () => (await read(4)).readUInt32LE();
  async function block(limit) {
    const length = await uint32();
    if (length > limit) throw invalid('头部数据过大');
    return read(length);
  }
  if ((await read(8)).toString('ascii') !== 'CTENFDAM') throw invalid('不是有效的 NCM 文件');
  await read(2);
  const encryptedKey = await block(64 * 1024);
  for (let i = 0; i < encryptedKey.length; i++) encryptedKey[i] ^= 0x64;
  let key;
  try { key = decrypt(encryptedKey, CORE_KEY); }
  catch { throw invalid('音频密钥无效'); }
  if (key.length <= 17 || key.subarray(0, 17).toString() !== 'neteasecloudmusic') throw invalid('音频密钥无效');
  const mask = audioMask(key.subarray(17));
  const encryptedMeta = await block(2 * 1024 * 1024);
  let metadata = {};
  if (encryptedMeta.length) {
    // Broken optional tags must not prevent otherwise valid audio from playing.
    try {
      for (let i = 0; i < encryptedMeta.length; i++) encryptedMeta[i] ^= 0x63;
      const text = decrypt(Buffer.from(encryptedMeta.subarray(22).toString(), 'base64'), META_KEY).toString('utf8');
      const parsed = JSON.parse(text.slice(6));
      if (text.startsWith('music:') && parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
    } catch {}
  }
  await read(5); // CRC32 and image version
  const imageSpace = await uint32(), imageSize = await uint32();
  if (imageSize > imageSpace || imageSize > 16 * 1024 * 1024 || offset + imageSpace >= size) throw invalid('封面或音频数据不完整');
  const cover = await read(imageSize);
  offset += imageSpace - imageSize; // Reserved cover padding is not audio.
  const start = offset;
  const signature = await read(Math.min(16, size - start));
  for (let i = 0; i < signature.length; i++) signature[i] ^= mask[i];
  let format;
  if (signature.subarray(0, 4).toString() === 'fLaC') format = 'flac';
  else if (signature.subarray(0, 3).toString() === 'ID3' || (signature[0] === 0xff && (signature[1] & 0xe0) === 0xe0)) format = 'mp3';
  else throw invalid('不支持或已损坏的音频格式（支持 MP3 / FLAC）');
  return { start, mask, metadata, cover, format };
}

class NcmDecoder {
  constructor(cacheDir) {
    this.cacheDir = path.join(cacheDir, 'ncm');
    this.jobs = new Map();
  }

  prepare(file) {
    const source = path.resolve(file);
    if (this.jobs.has(source)) return this.jobs.get(source);
    const job = this.decode(source).finally(() => this.jobs.delete(source));
    this.jobs.set(source, job);
    return job;
  }

  async decode(source) {
    const handle = await fs.promises.open(source, 'r');
    let temporary;
    try {
      const before = await handle.stat();
      const header = await readHeader(handle, before.size);
      const fingerprint = crypto.createHash('sha256').update(JSON.stringify([source, before.size, before.mtimeMs, before.ctimeMs])).digest('hex');
      await fs.promises.mkdir(this.cacheDir, { recursive: true });
      const audioPath = path.join(this.cacheDir, fingerprint + '.' + header.format);
      const expectedSize = before.size - header.start;
      const cached = await fs.promises.stat(audioPath).catch(() => null);
      if (!cached || cached.size !== expectedSize) {
        temporary = audioPath + '.' + crypto.randomUUID() + '.tmp';
        let position = 0;
        const transform = new Transform({ transform(chunk, encoding, callback) {
          for (let i = 0; i < chunk.length; i++) chunk[i] ^= header.mask[(position + i) & 255];
          position += chunk.length;
          callback(null, chunk);
        } });
        await pipeline(handle.createReadStream({ start: header.start, autoClose: false }), transform, fs.createWriteStream(temporary, { flags: 'wx' }));
        const after = await fs.promises.stat(source);
        if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || position !== expectedSize) throw invalid('文件正在写入，请稍后重试');
        await fs.promises.rename(temporary, audioPath);
        temporary = null;
      }
      return { audioPath, metadata: header.metadata, cover: header.cover };
    } finally {
      await handle.close();
      if (temporary) await fs.promises.unlink(temporary).catch(() => {});
    }
  }
}

module.exports = { NcmDecoder, isNcm };
