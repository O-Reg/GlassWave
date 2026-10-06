(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GlassWaveLyricTiming = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const MAX_LINES = 5000, MAX_WORDS = 20000;
  function timestamp(value, multiplier = 1) {
    if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value * multiplier : NaN;
    if (typeof value !== 'string') return NaN;
    if (!value.trim()) return NaN;
    const m = value.trim().match(/^(?:(\d+):)?(\d+):(\d{1,2}(?:\.\d+)?)$/);
    if (m) return ((Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3])) * 1000;
    return timestamp(Number(value), multiplier);
  }
  const text = v => typeof v === 'string' ? v.slice(0, 12000) : '';
  function normalize(lines, format, offset = 0) {
    if (!Number.isFinite(offset)) throw Error('歌词偏移量无效');
    if (!Array.isArray(lines) || !lines.length || lines.length > MAX_LINES) throw Error('歌词为空或行数超过 5000 行');
    let count = 0;
    const timed = lines.some(l => Number.isFinite(l.start));
    if (timed && lines.some(l => !Number.isFinite(l.start))) throw Error('歌词时间不完整');
    const output = lines.map(l => {
      if (Array.isArray(l.words) && l.words.length > 512) throw Error('单句逐字片段不能超过 512 个');
      const words = Array.isArray(l.words) ? l.words.map(w => {
        if (!Number.isFinite(w.start) || (w.end !== undefined && (!Number.isFinite(w.end) || w.end < w.start))) throw Error('逐字时间无效');
        count++;
        return { text: text(w.text), start: Math.max(0, w.start + offset), end: w.end === undefined ? undefined : Math.max(0, w.end + offset) };
      }).filter(w => w.text) : [];
      if (count > MAX_WORDS) throw Error('逐字片段过多');
      const line = { text: words.length ? words.map(w => w.text).join('') : text(l.text), translation: text(l.translation), words };
      if (timed) {
        if (l.end !== undefined && (!Number.isFinite(l.end) || l.end < l.start)) throw Error('句子时间无效');
        line.start = Math.max(0, l.start + offset);
        if (l.end !== undefined) line.end = Math.max(line.start, l.end + offset);
      }
      for (let i = 1; i < words.length; i++) if (words[i].start < words[i - 1].start) throw Error('逐字时间必须按先后顺序排列');
      return line;
    });
    if (timed) output.sort((a, b) => a.start - b.start);
    // Equal timestamps often represent a translation, not another competing active line.
    const merged = [];
    for (const line of output) {
      const prev = merged.at(-1);
      if (timed && prev && prev.start === line.start && !line.words.length) {
        prev.translation = [prev.translation, line.text, line.translation].filter(Boolean).join('\n');
      } else merged.push(line);
    }
    merged.forEach((l, i) => {
      if (!timed) return;
      const next = merged[i + 1]?.start;
      l.end = l.end ?? next ?? Math.max(l.start + 5000, l.words.at(-1)?.end || 0, (l.words.at(-1)?.start || 0) + 1000);
      if (next !== undefined) l.end = Math.min(l.end, next);
      l.words.forEach((w, n) => { w.end = w.end ?? l.words[n + 1]?.start ?? l.end; if (w.end < w.start) throw Error('逐字时间超出句子范围'); });
    });
    return { format, timed, wordTimed: merged.some(l => l.words.length > 0), lines: merged };
  }
  function parseLrc(source) {
    const offset = Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0);
    const lines = [];
    const tag = /\[(\d+:\d{1,2}(?:\.\d+)?)\]/g;
    for (const row of source.split(/\r?\n/)) {
      const stamps = [...row.matchAll(tag)];
      if (!stamps.length) continue;
      const body = row.replace(tag, '');
      const tokens = [...body.matchAll(/<(\d+:\d{1,2}(?:\.\d+)?)>([^<]*)/g)];
      const first = tokens[0]?.index || 0;
      for (const s of stamps) {
        const start = timestamp(s[1]), shift = start - timestamp(stamps[0][1]);
        const words = tokens.map((w, i) => ({ start: timestamp(w[1]) + shift, end: tokens[i + 1] ? timestamp(tokens[i + 1][1]) + shift : undefined, text: w[2] }));
        if (tokens.length && first > 0) words.unshift({ start, end: words[0].start, text: body.slice(0, first) });
        lines.push({ start, text: body, words });
      }
    }
    if (!lines.length) return normalize(source.split(/\r?\n/).filter(l => l.trim() && !/^\[[a-z]+:/i.test(l)).map(text => ({ text })), '文本');
    return normalize(lines, lines.some(l => l.words.length) ? '逐字 LRC' : 'LRC', -offset);
  }
  function parseYrc(source) {
    const lines = [];
    for (const row of source.split(/\r?\n/)) {
      const m = row.match(/^\[(\d+),(\d+)\](.*)$/);
      if (!m) continue;
      const words = [...m[3].matchAll(/\((\d+),(\d+),\d+\)([^()]*)/g)].map(w => ({ start: Number(w[1]), end: Number(w[1]) + Number(w[2]), text: w[3] }));
      lines.push({ start: Number(m[1]), end: Number(m[1]) + Number(m[2]), text: m[3], words });
    }
    return normalize(lines, 'YRC');
  }
  function parseJson(source) {
    const data = typeof source === 'string' ? JSON.parse(source) : source;
    if (!data || typeof data !== 'object') throw Error('JSON 歌词结构无效');
    if (data.alignment_method === 'ctc-forced-aligner' && Array.isArray(data.lines)) {
      const lines = data.lines.map(line => {
        let cursor = 0;
        const words = (line.words || []).filter(w => Number.isFinite(w.start) && Number.isFinite(w.end)).map(w => {
          const at = line.text.indexOf(w.text, cursor);
          const end = at < 0 ? cursor : at + w.text.length;
          const content = at < 0 ? w.text : line.text.slice(cursor, end);
          cursor = end;
          return { text: content, start: w.start * 1000, end: w.end * 1000 };
        });
        if (!words.length) return null;
        words[words.length - 1].text += line.text.slice(cursor);
        return { text: line.text, translation: line.translation, start: words[0].start, end: words[words.length - 1].end, words };
      }).filter(Boolean);
      return normalize(lines, '逐词 JSON');
    }
    if (typeof data.yrc?.lyric === 'string' || typeof data.lrc?.lyric === 'string') {
      const original = typeof data.yrc?.lyric === 'string' ? parseYrc(data.yrc.lyric) : parseLrc(data.lrc.lyric);
      return typeof data.tlyric?.lyric === 'string' && data.tlyric.lyric.trim() ? attachTranslation(original, parseLrc(data.tlyric.lyric)) : original;
    }
    if (typeof data.lyrics === 'string') return parseLrc(data.lyrics);
    const entries = Array.isArray(data) ? data : data.lines ?? data.lyrics;
    const mul = data.timeUnit === 's' ? 1000 : 1;
    if (data.timeUnit && !['ms', 's'].includes(data.timeUnit)) throw Error('timeUnit 仅支持 ms 或 s');
    if (!Array.isArray(entries)) throw Error('JSON 需要 lines 或 lyrics 数组');
    const lines = entries.map(l => {
      if (typeof l === 'string') return { text: l };
      if (!l || typeof l !== 'object') throw Error('JSON 歌词行无效');
      const rawStart = l.start ?? l.startTime ?? l.time;
      const start = rawStart === undefined ? undefined : timestamp(rawStart, mul);
      if (rawStart !== undefined && !Number.isFinite(start)) throw Error('JSON 歌词时间无效');
      const end = l.end ?? l.endTime;
      const words = l.words ?? l.syllables ?? [];
      if (!Array.isArray(words)) throw Error('words 必须是数组');
      return { start, end: end === undefined ? (l.duration === undefined ? undefined : start + Number(l.duration) * mul) : timestamp(end, mul), text: l.text ?? l.content, translation: l.translation, words: words.map(w => {
        const s = timestamp(w.start ?? w.startTime, mul);
        const e = w.end ?? w.endTime;
        return { start: s, end: e === undefined ? (w.duration === undefined ? undefined : s + Number(w.duration) * mul) : timestamp(e, mul), text: w.text ?? w.content };
      }) };
    });
    return normalize(lines, 'JSON', Number(data.offset || 0));
  }
  function parse(source, extension = '') {
    if (typeof source !== 'string' || source.length > 2 * 1024 * 1024) throw Error('歌词文件不能超过 2MB');
    source = source.replace(/^\uFEFF/, '').trim();
    if (!source) throw Error('歌词文件为空');
    if (extension.toLowerCase() === '.json' || /^[{[]/.test(source) && !/^\[\d|^\[[a-z]+:/i.test(source)) return parseJson(source);
    if (extension.toLowerCase() === '.yrc' || /^\[\d+,\d+\]/m.test(source)) return parseYrc(source);
    return parseLrc(source);
  }
  function locate(lines, ms) {
    let low = 0, high = lines.length - 1, found = -1;
    while (low <= high) { const mid = (low + high) >>> 1; if (lines[mid].start <= ms) { found = mid; low = mid + 1; } else high = mid - 1; }
    return found;
  }
  function wordProgress(word, ms) { return ms < word.start ? 0 : word.end <= word.start ? 1 : Math.max(0, Math.min(1, (ms - word.start) / (word.end - word.start))); }
  function attachTranslation(original, translated) {
    const lines = original.lines.map(l => ({ ...l, words: l.words.map(w => ({ ...w })) }));
    if (!translated.timed) {
      if (translated.lines.length !== lines.length) throw Error(`译文有 ${translated.lines.length} 行，原文有 ${lines.length} 句；请按原文每句一行提供译文，或导入带时间轴的译文`);
      lines.forEach((line, i) => { line.translation = translated.lines[i].text; });
    } else {
      if (!original.timed) throw Error('原文没有时间轴，请导入每句一行的 TXT 译文');
      const used = new Set();
      for (const translation of translated.lines) {
        const candidates = lines.map((line, i) => ({ i, distance: Math.abs(line.start - translation.start) })).filter(item => item.distance <= 250).sort((a,b) => a.distance - b.distance);
        const match = candidates[0];
        if (!match || used.has(match.i) || candidates[1]?.distance === match.distance) throw Error('译文时间轴与原文不匹配；请使用同一歌曲版本的译文');
        used.add(match.i); lines[match.i].translation = translation.text;
      }
    }
    return { ...original, lines };
  }
  return { parse, normalize, locate, wordProgress, attachTranslation };
});
