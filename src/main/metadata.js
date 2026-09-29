const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mm = require('music-metadata');

class MetadataParser {
  constructor(cacheDir, database = null) {
    this.cacheDir = cacheDir;
    this.db = database;
    this.coversDir = path.join(cacheDir, 'covers');
    if (!fs.existsSync(this.coversDir)) {
      fs.mkdirSync(this.coversDir, { recursive: true });
    }
    // Cache map: folderPath -> Array of image file paths
    this.folderImageCache = new Map();
  }

  // Deep extraction of native embedded picture from common and native audio tags
  extractEmbeddedPicture(metadata) {
    if (!metadata) return null;
    if (metadata.common && Array.isArray(metadata.common.picture) && metadata.common.picture.length > 0) {
      // Prioritize front cover or type 3
      const front = metadata.common.picture.find(p =>
        p.type === 'Cover (front)' ||
        p.type === 3 ||
        (p.description && p.description.toLowerCase().includes('front'))
      );
      return front || metadata.common.picture[0];
    }
    // Deep fallback into native tags (ID3v2, FLAC, Vorbis, MP4)
    if (metadata.native) {
      for (const tagType of Object.keys(metadata.native)) {
        const tags = metadata.native[tagType];
        if (Array.isArray(tags)) {
          for (const t of tags) {
            if (t.id === 'APIC' || t.id === 'METADATA_BLOCK_PICTURE' || t.id === 'covr' || t.id === 'COVERART') {
              if (t.value && t.value.data) {
                return t.value;
              } else if (Buffer.isBuffer(t.value)) {
                return { data: t.value, format: 'image/jpeg' };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // Scan all image files in a folder and return them
  getImagesInDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) return [];
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const imgExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
      const images = [];
      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (imgExts.has(ext)) {
            images.push({
              name: entry.name,
              baseName: path.basename(entry.name, ext).toLowerCase(),
              path: path.join(dirPath, entry.name)
            });
          }
        }
      }
      return images;
    } catch (e) {
      return [];
    }
  }

  // Convert an image file or buffer to Base64 Data URL to completely eliminate CORS taint on canvas
  imageFileToDataUrl(imagePath) {
    try {
      if (!fs.existsSync(imagePath)) return null;
      const ext = path.extname(imagePath).toLowerCase();
      let mime = 'image/jpeg';
      if (ext === '.png') mime = 'image/png';
      else if (ext === '.webp') mime = 'image/webp';
      else if (ext === '.bmp') mime = 'image/bmp';

      const buf = fs.readFileSync(imagePath);
      // Downsample/limit if excessively large (e.g. > 10MB)
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch (err) {
      console.warn('Failed to read image to data URL:', imagePath, err);
      return null;
    }
  }

  imageBufferToDataUrl(buffer, format) {
    try {
      let mime = 'image/jpeg';
      if (format) {
        if (format.includes('png')) mime = 'image/png';
        else if (format.includes('webp')) mime = 'image/webp';
        else if (format.includes('gif')) mime = 'image/gif';
      }
      return `data:${mime};base64,${buffer.toString('base64')}`;
    } catch (err) {
      return null;
    }
  }

  // In-memory cache for fast, zero-stutter cover resolution (avoids repeated disk I/O and Base64 encoding)
  coverDataUrlCache = new Map();

  // Convert an image file or buffer to Base64 Data URL ONLY when requested for the currently playing track
  async getCoverDataUrl(targetPath) {
    if (!targetPath) return null;
    try {
      if (targetPath.startsWith('data:') || targetPath.startsWith('http')) return targetPath;

      // Check memory cache first for instant 0ms return
      if (this.coverDataUrlCache.has(targetPath)) {
        return this.coverDataUrlCache.get(targetPath);
      }

      if (!fs.existsSync(targetPath)) return null;

      const ext = path.extname(targetPath).toLowerCase();
      const imageExts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
      const audioExts = new Set(['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.opus', '.wma']);

      let dataUrl = null;

      if (imageExts.has(ext)) {
        const stats = fs.statSync(targetPath);
        // Only read image files within reasonable bounds (<= 6MB) to protect IPC bandwidth
        if (stats.size > 6 * 1024 * 1024) return null;

        let mime = 'image/jpeg';
        if (ext === '.png') mime = 'image/png';
        else if (ext === '.webp') mime = 'image/webp';
        else if (ext === '.bmp') mime = 'image/bmp';

        const buf = fs.readFileSync(targetPath);
        dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
      } else if (audioExts.has(ext)) {
        // Direct Extraction of Song's Embedded Artwork (自带内嵌封面)
        try {
          const meta = await mm.parseFile(targetPath, { skipCovers: false });
          const pic = this.extractEmbeddedPicture(meta);
          if (pic && pic.data && pic.data.length > 0) {
            let mime = 'image/jpeg';
            if (pic.format) {
              if (pic.format.includes('png')) mime = 'image/png';
              else if (pic.format.includes('webp')) mime = 'image/webp';
              else if (pic.format.includes('gif')) mime = 'image/gif';
            }
            dataUrl = `data:${mime};base64,${pic.data.toString('base64')}`;

            // Save embedded cover to disk cache and update DB record
            try {
              const hash = crypto.createHash('md5').update(pic.data).digest('hex');
              const fileExt = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
              const cachedCoverFile = path.join(this.coversDir, `${hash}.${fileExt}`);
              if (!fs.existsSync(cachedCoverFile)) {
                fs.writeFileSync(cachedCoverFile, pic.data);
              }
              if (this.db) {
                this.db.updateTrackCover(targetPath, cachedCoverFile);
              }
            } catch (saveErr) {}
          }
        } catch (audioErr) {
          dataUrl = null;
        }
      }

      if (dataUrl) {
        // Keep memory cache under 150 items
        if (this.coverDataUrlCache.size > 150) {
          const firstKey = this.coverDataUrlCache.keys().next().value;
          this.coverDataUrlCache.delete(firstKey);
        }
        this.coverDataUrlCache.set(targetPath, dataUrl);
      }

      return dataUrl;
    } catch (err) {
      console.warn('Failed to resolve cover data URL:', targetPath, err);
      return null;
    }
  }

  // Comprehensive multi-level artwork search engine returning disk file paths (No Base64 in DB)
  findCoverArtwork(filePath, songTitle, embeddedPic) {
    // 1. Embedded Artwork: extract and cache to disk once
    if (embeddedPic && embeddedPic.data && embeddedPic.data.length > 0) {
      try {
        const hash = crypto.createHash('md5').update(embeddedPic.data).digest('hex');
        const ext = (embeddedPic.format && embeddedPic.format.includes('png')) ? 'png' : 'jpg';
        const targetPath = path.join(this.coversDir, `${hash}.${ext}`);
        if (!fs.existsSync(targetPath)) {
          fs.writeFileSync(targetPath, embeddedPic.data);
        }
        return targetPath;
      } catch (e) {
        console.warn('Failed to cache embedded artwork:', e);
      }
    }

    const dir = path.dirname(filePath);
    const songBase = path.basename(filePath, path.extname(filePath)).toLowerCase();
    const cleanSongTitle = (songTitle || '').toLowerCase().trim();

    // 2. Search in the SAME directory
    const sameDirImages = this.getImagesInDir(dir);
    if (sameDirImages.length > 0) {
      // 2a. Image whose name contains the song title or vice versa
      for (const img of sameDirImages) {
        if (cleanSongTitle && (img.baseName.includes(cleanSongTitle) || cleanSongTitle.includes(img.baseName))) {
          return img.path;
        }
        if (img.baseName === songBase || songBase.includes(img.baseName)) {
          return img.path;
        }
      }

      // 2b. Standard cover/folder names
      const standardNames = ['cover', 'folder', 'album', 'front', 'artwork', 'art'];
      for (const std of standardNames) {
        const found = sameDirImages.find(img => img.baseName === std || img.baseName.startsWith(std));
        if (found) return found.path;
      }

      // 2c. If folder has image_large_*.jpg or single image
      const imgLarge = sameDirImages.find(img => img.baseName.startsWith('image_large'));
      if (imgLarge) return imgLarge.path;

      if (sameDirImages.length === 1) {
        return sameDirImages[0].path;
      }
    }

    // 3. Search in subfolders ('front', 'covers', 'cover', 'artwork')
    const subfolderNames = ['front', 'covers', 'cover', 'artwork', 'scans'];
    for (const sub of subfolderNames) {
      const subPath = path.join(dir, sub);
      if (fs.existsSync(subPath)) {
        const subImages = this.getImagesInDir(subPath);
        for (const img of subImages) {
          if (cleanSongTitle && (img.baseName.includes(cleanSongTitle) || cleanSongTitle.includes(img.baseName))) {
            return img.path;
          }
          if (img.baseName === songBase || songBase.includes(img.baseName)) {
            return img.path;
          }
        }
        if (subImages.length > 0) {
          return subImages[0].path;
        }
      }
    }

    // 4. Search in dedicated '封面' or 'covers' directory across parent hierarchy
    let currentParent = dir;
    for (let depth = 0; depth < 4; depth++) {
      const parentDir = path.dirname(currentParent);
      if (!parentDir || parentDir === currentParent) break;

      const coverDirCandidates = ['封面', 'Covers', 'covers', 'Artwork', 'artwork'];
      for (const candName of coverDirCandidates) {
        const coverDirPath = path.join(parentDir, candName);
        if (fs.existsSync(coverDirPath)) {
          const candImages = this.getImagesInDir(coverDirPath);
          for (const img of candImages) {
            if (cleanSongTitle && (img.baseName.includes(cleanSongTitle) || cleanSongTitle.includes(img.baseName))) {
              return img.path;
            }
            if (songBase.includes(img.baseName) || img.baseName.includes(songBase)) {
              return img.path;
            }
          }
        }
      }

      // Check for folder-level image in parent (e.g. REG.jpg or cover.jpg)
      const parentImages = this.getImagesInDir(parentDir);
      for (const img of parentImages) {
        if (songBase.includes(img.baseName) || (cleanSongTitle && cleanSongTitle.includes(img.baseName))) {
          return img.path;
        }
        if (['cover', 'folder', 'album'].includes(img.baseName)) {
          return img.path;
        }
      }

      currentParent = parentDir;
    }

    return null;
  }

  // Heuristic extraction for artist, title, and album from filename and folders
  extractMetadataHeuristics(filePath, common, native) {
    const rawBaseName = path.basename(filePath, path.extname(filePath));
    const parentDirName = path.basename(path.dirname(filePath));

    let title = common.title ? common.title.trim() : '';
    let artist = common.artist || (common.artists && common.artists[0]) || '';
    if (artist) artist = artist.trim();
    let album = common.album ? common.album.trim() : '';

    // Check native tags (RIFF, EXIF, ID3) for WAV/AIFF
    if (!artist && native) {
      for (const tagType of Object.keys(native)) {
        const tagList = native[tagType];
        if (Array.isArray(tagList)) {
          for (const item of tagList) {
            if (item.id === 'IART' || item.id === 'TPE1' || item.id === 'TPE2' || item.id === 'ARTIST' || item.id === 'artist') {
              if (item.value && typeof item.value === 'string') artist = item.value.trim();
            }
            if (!title && (item.id === 'INAM' || item.id === 'TIT2' || item.id === 'TITLE' || item.id === 'title')) {
              if (item.value && typeof item.value === 'string') title = item.value.trim();
            }
            if (!album && (item.id === 'IPRD' || item.id === 'TALB' || item.id === 'ALBUM' || item.id === 'album')) {
              if (item.value && typeof item.value === 'string') album = item.value.trim();
            }
          }
        }
      }
    }

    // Filename pattern matching: "Artist - Title" or "[Artist] Title"
    let parsedArtist = '';
    let parsedTitle = rawBaseName;

    if (rawBaseName.includes(' - ')) {
      const parts = rawBaseName.split(' - ');
      if (parts.length >= 2) {
        parsedArtist = parts[0].trim();
        parsedTitle = parts.slice(1).join(' - ').trim();
      }
    } else if (rawBaseName.includes('-')) {
      const parts = rawBaseName.split('-');
      if (parts.length === 2) {
        parsedArtist = parts[0].trim();
        parsedTitle = parts[1].trim();
      }
    }

    // Clean up title
    if (!title) {
      title = parsedTitle || rawBaseName;
      // Remove leading track numbers like "01. ", "01 - ", "1 "
      title = title.replace(/^(\d{1,3}[\.\s\-_]+)/, '').trim() || rawBaseName;
    }

    // Clean up artist
    if (!artist || artist === '未知艺术家' || artist.toLowerCase() === 'unknown') {
      if (parsedArtist && isNaN(Number(parsedArtist))) {
        artist = parsedArtist;
      } else {
        // Check comment for Suno / AI origin
        const comments = (common.comment || []).join(' ');
        if (comments.includes('made with suno') || comments.includes('suno.com')) {
          artist = 'Suno AI';
        } else if (parentDirName && !parentDirName.startsWith('--') && !['MUSIC', 'MAIN', 'music', 'songs'].includes(parentDirName)) {
          artist = parentDirName; // Use parent folder if meaningful
        } else {
          artist = '未知艺术家';
        }
      }
    }

    // Clean up album
    if (!album || album === '未知专辑' || album.toLowerCase() === 'unknown') {
      if (parentDirName && !parentDirName.startsWith('--') && !['MUSIC', 'MAIN', 'music', 'songs'].includes(parentDirName)) {
        album = parentDirName;
      } else {
        album = 'GlassWave Archive';
      }
    }

    return { title, artist, album };
  }

  async parseFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      let metadata = {};
      try {
        metadata = await mm.parseFile(filePath, { skipCovers: false });
      } catch (e) {
        console.warn('Metadata parse warning:', filePath, e.message);
      }

      const common = metadata.common || {};
      const format = metadata.format || {};

      // Robust artist, title, album extraction
      const { title, artist, album } = this.extractMetadataHeuristics(filePath, common, metadata.native);

      const albumArtist = common.albumartist || artist;
      const year = common.year || null;
      const genre = common.genre ? common.genre.join(', ') : '';
      const trackNumber = common.track ? common.track.no : null;
      const duration = format.duration ? Math.round(format.duration) : 0;

      // Extract Cover Artwork via 7-level multi-strategy search (prioritizing native embedded picture)
      const embeddedPic = this.extractEmbeddedPicture(metadata);
      const coverPath = this.findCoverArtwork(filePath, title, embeddedPic);

      // Extract Audio Spec for HiFi badge & audiophile inspector
      const ext = path.extname(filePath).slice(1).toUpperCase();
      const isLossless = format.lossless || ext === 'FLAC' || ext === 'WAV' || ext === 'APE' || ext === 'ALAC';
      const sampleRate = format.sampleRate || 44100;
      const bitsPerSample = format.bitsPerSample || (isLossless ? (ext === 'WAV' ? 24 : 16) : 16);
      const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : (isLossless ? Math.round(sampleRate * bitsPerSample * 2 / 1000) : 320);

      const audioSpec = {
        container: format.container || ext,
        codec: format.codec || ext,
        sampleRate,
        bitsPerSample,
        numberOfChannels: format.numberOfChannels || 2,
        bitrate,
        isLossless,
        isHiRes: isLossless && (sampleRate >= 48000 || bitsPerSample >= 24)
      };

      return {
        id: crypto.createHash('md5').update(filePath).digest('hex'),
        path: filePath,
        title,
        artist,
        album,
        albumArtist,
        year,
        genre,
        trackNumber,
        duration,
        coverPath,
        hasCover: !!coverPath,
        audioSpec,
        mtime: stats.mtimeMs,
        size: stats.size
      };
    } catch (err) {
      const stats = fs.statSync(filePath);
      const rawBase = path.basename(filePath, path.extname(filePath));
      const coverPath = this.findCoverArtwork(filePath, rawBase, null);

      return {
        id: crypto.createHash('md5').update(filePath).digest('hex'),
        path: filePath,
        title: rawBase,
        artist: '未知艺术家',
        album: 'GlassWave Archive',
        duration: 0,
        coverPath,
        hasCover: !!coverPath,
        mtime: stats.mtimeMs,
        size: stats.size
      };
    }
  }
}

module.exports = MetadataParser;
