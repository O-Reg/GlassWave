const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class LibraryDatabase {
  constructor(userDataPath) {
    this.dir = userDataPath || path.join(app.getPath('userData'), 'database');
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    this.dbFile = path.join(this.dir, 'library.json');
    this.configFile = path.join(this.dir, 'config.json');

    this.tracks = new Map(); // path -> track
    this.folders = new Set();
    this.hiddenPaths = new Set();
    this.favorites = new Set();
    this.categories = []; // [ { id, name, trackPaths: [], order: 0 } ]
    this.categoryGroups = [];
    this.history = []; // [ { path, playedAt } ]
    this.customTags = new Set(); // explicitly created tags; song-only tags are derived from tracks
    this.hiddenPresetTags = new Set();

    this.config = {
      autoplayOnLaunch: true,
      launchShuffle: false,
      rememberProgress: true,
      mouseParallax: true,
      visualizerMode: 'wave',
      visualizerIntensity: 1.0,
      visualizerPosition: 'behind',
      visualizerOffsetY: 0,
      visualizerScale: 1.25,
      lastPlayback: null,
      customFolders: [],
      hiddenTrackPaths: [],
      autoAddDroppedToLibrary: false,
      categories: [],
      categoryGroups: [],
      favorites: [],
      customTags: [],
      manualTags: [],
      hiddenPresetTags: [],
      history: [],
      savedQueue: []
    };

    this.load();
  }

  load() {
    let savedCategories = false;
    try {
      if (fs.existsSync(this.configFile)) {
        const raw = fs.readFileSync(this.configFile, 'utf8');
        this.config = { ...this.config, ...JSON.parse(raw) };
        if (Array.isArray(this.config.hiddenTrackPaths)) {
          this.hiddenPaths = new Set(this.config.hiddenTrackPaths);
        }
        if (Array.isArray(this.config.favorites)) {
          this.favorites = new Set(this.config.favorites);
        }
        if (Array.isArray(this.config.categories)) {
          this.categories = this.config.categories;
          savedCategories = Object.prototype.hasOwnProperty.call(JSON.parse(raw), 'categories');
        }
        if (Array.isArray(this.config.categoryGroups)) {
          this.categoryGroups = this.config.categoryGroups;
        }
        if (Array.isArray(this.config.history)) {
          this.history = this.config.history;
        }
        if (Array.isArray(this.config.manualTags)) this.customTags = new Set(this.config.manualTags);
        if (Array.isArray(this.config.hiddenPresetTags)) this.hiddenPresetTags = new Set(this.config.hiddenPresetTags);
      }
    } catch (e) {
      console.warn('Failed to load config:', e);
    }

    // Default categories if empty
    if (!savedCategories) {
      this.categories = [
        { id: 'cat_workout', name: '运动', trackPaths: [], order: 0 },
        { id: 'cat_dark', name: '黑暗', trackPaths: [], order: 1 },
        { id: 'cat_soundtrack', name: '视频配乐', trackPaths: [], order: 2 },
        { id: 'cat_classical', name: '古典音乐', trackPaths: [], order: 3 }
      ];
    }
    if (!this.categoryGroups.length && !Object.prototype.hasOwnProperty.call(this.config, 'categoryGroupsSaved')) {
      this.categoryGroups = [{ id: 'group_default', name: '我的分类', order: 0 }];
    }
    const fallbackGroupId = this.categoryGroups[0]?.id;
    this.categories.forEach(cat => { if (!cat.groupId) cat.groupId = fallbackGroupId; });

    try {
      if (fs.existsSync(this.dbFile)) {
        const raw = fs.readFileSync(this.dbFile, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach(t => {
            if (t && t.path) {
              if (!this.hiddenPaths.has(t.path)) {
                // Attach tag & category data
                t.tags = Array.isArray(t.tags) ? t.tags : [];
                t.isFavorite = this.favorites.has(t.path);
                t.dateAdded = t.dateAdded || t.mtime || Date.now();
                this.tracks.set(t.path, t);
              }
            }
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load database:', e);
    }
  }

  save() {
    try {
      const trackList = Array.from(this.tracks.values());
      const tempDb = `${this.dbFile}.tmp`;
      fs.writeFileSync(tempDb, JSON.stringify(trackList), 'utf8');
      fs.renameSync(tempDb, this.dbFile);

      this.config.hiddenTrackPaths = Array.from(this.hiddenPaths);
      this.config.favorites = Array.from(this.favorites);
      this.config.categories = this.categories;
      this.config.categoryGroups = this.categoryGroups;
      this.config.categoryGroupsSaved = true;
      this.config.history = this.history.slice(0, 100);
      this.config.customTags = Array.from(this.customTags);
      this.config.manualTags = Array.from(this.customTags);
      this.config.hiddenPresetTags = Array.from(this.hiddenPresetTags);

      const tempConf = `${this.configFile}.tmp`;
      fs.writeFileSync(tempConf, JSON.stringify(this.config), 'utf8');
      fs.renameSync(tempConf, this.configFile);
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  isHidden(filePath) {
    return this.hiddenPaths.has(filePath);
  }

  hideTrack(filePath) {
    this.hiddenPaths.add(filePath);
    this.tracks.delete(filePath);
    this.favorites.delete(filePath);
    this.categories.forEach(cat => {
      if (Array.isArray(cat.trackPaths)) {
        cat.trackPaths = cat.trackPaths.filter(p => p !== filePath);
      }
    });
    this.save();
    return this.getAllTracks();
  }

  batchHideTracks(filePaths) {
    if (Array.isArray(filePaths)) {
      filePaths.forEach(filePath => {
        if (filePath) {
          this.hiddenPaths.add(filePath);
          this.tracks.delete(filePath);
          this.favorites.delete(filePath);
          this.categories.forEach(cat => {
            if (Array.isArray(cat.trackPaths)) {
              cat.trackPaths = cat.trackPaths.filter(p => p !== filePath);
            }
          });
        }
      });
      this.save();
    }
    return this.getAllTracks();
  }

  unhideAll() {
    this.hiddenPaths.clear();
    this.save();
  }

  getTrack(filePath) {
    return this.tracks.get(filePath);
  }

  upsertTrack(track) {
    if (this.hiddenPaths.has(track.path)) return;
    const previous = this.tracks.get(track.path);
    if (previous) { track.tags = previous.tags; track.dateAdded = previous.dateAdded; }
    track.tags = Array.isArray(track.tags) ? track.tags : [];
    track.isFavorite = this.favorites.has(track.path);
    track.dateAdded = track.dateAdded || track.mtime || Date.now();
    this.tracks.set(track.path, track);
  }

  removeTrack(filePath) {
    this.tracks.delete(filePath);
    this.hiddenPaths.delete(filePath);
    this.favorites.delete(filePath);
    this.categories.forEach(cat => {
      if (Array.isArray(cat.trackPaths)) {
        cat.trackPaths = cat.trackPaths.filter(p => p !== filePath);
      }
    });
    this.save();
    return this.getAllTracks();
  }

  batchRemoveTracks(filePaths) {
    if (Array.isArray(filePaths)) {
      filePaths.forEach(filePath => {
        if (filePath) {
          this.tracks.delete(filePath);
          this.hiddenPaths.delete(filePath);
          this.favorites.delete(filePath);
          this.categories.forEach(cat => {
            if (Array.isArray(cat.trackPaths)) {
              cat.trackPaths = cat.trackPaths.filter(p => p !== filePath);
            }
          });
        }
      });
      this.save();
    }
    return this.getAllTracks();
  }

  updateTrackCover(filePath, coverPath) {
    if (!filePath || !coverPath) return false;
    const track = this.tracks.get(filePath);
    if (track) {
      track.coverPath = coverPath;
      track.hasCover = true;
      this.save();
      return true;
    }
    return false;
  }

  getAllTracks() {
    // Enrich with favorite and category status
    const result = [];
    for (const t of this.tracks.values()) {
      t.isFavorite = this.favorites.has(t.path);
      // find categories this track belongs to
      t.categories = this.categories
        .filter(c => c.trackPaths && c.trackPaths.includes(t.path))
        .map(c => c.name);
      result.push(t);
    }
    return result;
  }

  getFolders() {
    return Array.from(this.folders);
  }

  addFolder(folderPath) {
    this.folders.add(folderPath);
    if (!this.config.customFolders.includes(folderPath)) {
      this.config.customFolders.push(folderPath);
    }
    this.save();
  }

  removeFolder(folderPath) {
    this.folders.delete(folderPath);
    this.config.customFolders = this.config.customFolders.filter(f => f !== folderPath);
    const inside = (p, root) => { const rel=path.relative(root,p); return rel === '' || (!rel.startsWith('..'+path.sep) && rel !== '..' && !path.isAbsolute(rel)); };
    const removed = [...this.tracks.keys()].filter(p => inside(p,folderPath) && !this.getFolders().some(root=>inside(p,root)));
    this.batchRemoveTracks(removed);
    this.save();
  }

  // =========================================================================
  // Category Management System
  // =========================================================================
  getCategories() {
    return this.categories;
  }

  getCategoryGroups() { return this.categoryGroups; }

  addCategoryGroup(name) {
    const clean = String(name || '').trim();
    if (!clean || this.categoryGroups.some(g => g.name.toLowerCase() === clean.toLowerCase())) return this.categoryGroups;
    this.categoryGroups.push({ id: `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name: clean, order: this.categoryGroups.length });
    this.save();
    return this.categoryGroups;
  }

  renameCategoryGroup(id, name) {
    const clean = String(name || '').trim();
    const group = this.categoryGroups.find(g => g.id === id);
    if (group && clean && !this.categoryGroups.some(g => g.id !== id && g.name.toLowerCase() === clean.toLowerCase())) {
      group.name = clean;
      this.save();
    }
    return this.categoryGroups;
  }

  deleteCategoryGroup(id) {
    if (!this.categoryGroups.some(g => g.id === id)) return this.categoryGroups;
    this.categories = this.categories.filter(c => c.groupId !== id);
    this.categoryGroups = this.categoryGroups.filter(g => g.id !== id);
    this.save();
    return this.categoryGroups;
  }

  addCategory(name, groupId) {
    const trimmed = (name || '').trim();
    const targetGroupId = groupId || this.categoryGroups[0]?.id;
    if (!trimmed || !this.categoryGroups.some(g => g.id === targetGroupId)) return this.categories;
    const existing = this.categories.find(c => c.groupId === targetGroupId && c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return this.categories;

    const newCat = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: trimmed,
      groupId: targetGroupId,
      trackPaths: [],
      order: this.categories.length
    };
    this.categories.push(newCat);
    this.save();
    return this.categories;
  }

  renameCategory(catId, newName) {
    const cat = this.categories.find(c => c.id === catId);
    if (cat && newName && newName.trim() && !this.categories.some(c => c.id !== catId && c.groupId === cat.groupId && c.name.toLowerCase() === newName.trim().toLowerCase())) {
      cat.name = newName.trim();
      this.save();
    }
    return this.categories;
  }

  deleteCategory(catId) {
    this.categories = this.categories.filter(c => c.id !== catId);
    this.save();
    return this.categories;
  }

  updateCategoryIcon(catId, iconIndex) {
    const cat = this.categories.find(c => c.id === catId);
    if (cat) {
      cat.iconIndex = typeof iconIndex === 'number' ? iconIndex : 0;
      this.save();
    }
    return this.categories;
  }


  reorderCategories(orderedIds) {
    if (!Array.isArray(orderedIds)) return this.categories;
    const catMap = new Map(this.categories.map(c => [c.id, c]));
    const reordered = [];
    orderedIds.forEach((id, idx) => {
      const cat = catMap.get(id);
      if (cat) {
        cat.order = idx;
        reordered.push(cat);
        catMap.delete(id);
      }
    });
    // Append any unmentioned categories
    for (const remaining of catMap.values()) {
      remaining.order = reordered.length;
      reordered.push(remaining);
    }
    this.categories = reordered;
    this.save();
    return this.categories;
  }

  addTracksToCategory(catId, trackPaths) {
    const cat = this.categories.find(c => c.id === catId);
    if (cat && Array.isArray(trackPaths)) {
      const set = new Set(cat.trackPaths || []);
      trackPaths.forEach(p => {
        if (p && this.tracks.has(p)) set.add(p);
      });
      cat.trackPaths = Array.from(set);
      this.save();
    }
    return this.getAllTracks();
  }

  addToCategory(catId, trackPaths) {
    return this.addTracksToCategory(catId, trackPaths);
  }

  moveTracksToCategory(catId, trackPaths) {
    const target = this.categories.find(c => c.id === catId);
    if (!target || !Array.isArray(trackPaths)) return this.getAllTracks();
    const moving = new Set(trackPaths.filter(p => this.tracks.has(p)));
    if (!moving.size) return this.getAllTracks();
    for (const cat of this.categories) {
      cat.trackPaths = (cat.trackPaths || []).filter(p => !moving.has(p));
    }
    target.trackPaths = Array.from(new Set([...(target.trackPaths || []), ...moving]));
    this.save();
    return this.getAllTracks();
  }

  removeTracksFromCategory(catId, trackPaths) {
    const cat = this.categories.find(c => c.id === catId);
    if (cat && Array.isArray(trackPaths)) {
      const removeSet = new Set(trackPaths);
      cat.trackPaths = (cat.trackPaths || []).filter(p => !removeSet.has(p));
      this.save();
    }
    return this.getAllTracks();
  }

  removeFromCategory(catId, trackPaths) {
    return this.removeTracksFromCategory(catId, trackPaths);
  }

  // =========================================================================
  // Favorites System
  // =========================================================================
  toggleFavorite(trackPath, forceState) {
    if (!trackPath) return false;
    let isFav = this.favorites.has(trackPath);
    if (typeof forceState === 'boolean') {
      isFav = forceState;
    } else {
      isFav = !isFav;
    }

    if (isFav) {
      this.favorites.add(trackPath);
    } else {
      this.favorites.delete(trackPath);
    }

    const t = this.tracks.get(trackPath);
    if (t) {
      t.isFavorite = isFav;
    }
    this.save();
    return isFav;
  }

  batchFavorite(trackPaths, isFav) {
    if (!Array.isArray(trackPaths)) return;
    trackPaths.forEach(p => {
      if (isFav) this.favorites.add(p);
      else this.favorites.delete(p);
      const t = this.tracks.get(p);
      if (t) t.isFavorite = isFav;
    });
    this.save();
    return this.getAllTracks();
  }

  getFavorites() {
    return Array.from(this.favorites);
  }

  isFavorite(trackPath) {
    return this.favorites.has(trackPath);
  }

  // =========================================================================
  // Tags System
  // =========================================================================
  updateTrackTags(trackPath, tags) {
    const t = this.tracks.get(trackPath);
    if (t && Array.isArray(tags)) {
      t.tags = Array.from(new Set(tags.map(s => String(s).trim()).filter(Boolean)));
      this.save();
    }
    return this.getAllTracks();
  }

  batchUpdateTags(trackPaths, addTags = [], removeTags = []) {
    if (!Array.isArray(trackPaths)) return this.getAllTracks();
    const addSet = new Set(addTags.map(s => String(s).trim()).filter(Boolean));
    const removeSet = new Set(removeTags.map(s => String(s).trim()).filter(Boolean));

    trackPaths.forEach(p => {
      const t = this.tracks.get(p);
      if (t) {
        const cur = new Set(t.tags || []);
        addSet.forEach(tag => cur.add(tag));
        removeSet.forEach(tag => cur.delete(tag));
        t.tags = Array.from(cur);
      }
    });
    this.save();
    return this.getAllTracks();
  }

  getCustomTags() {
    const tags = new Set(this.customTags);
    this.tracks.forEach(t => (t.tags || []).forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }

  getHiddenPresetTags() { return Array.from(this.hiddenPresetTags); }

  addCustomTag(tag) {
    if (!tag || typeof tag !== 'string') return this.getCustomTags();
    const clean = tag.trim();
    if (!clean) return this.getCustomTags();
    this.customTags.add(clean);
    this.hiddenPresetTags.delete(clean);
    this.save();
    return this.getCustomTags();
  }

  removeCustomTag(tag) {
    if (!tag) return this.getCustomTags();
    const clean = String(tag).trim();
    this.customTags.delete(clean);
    this.hiddenPresetTags.add(clean);
    // Also remove from tracks if present
    this.tracks.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags = t.tags.filter(s => s !== clean);
      }
    });
    this.save();
    return this.getCustomTags();
  }

  // =========================================================================
  // Playback History
  // =========================================================================
  recordPlaybackHistory(trackPath) {
    if (!trackPath) return;
    // Remove if already exists to push to front
    this.history = this.history.filter(h => h.path !== trackPath);
    this.history.unshift({
      path: trackPath,
      playedAt: Date.now()
    });
    if (this.history.length > 100) {
      this.history = this.history.slice(0, 100);
    }
    this.save();
  }

  recordHistory(trackPath) {
    return this.recordPlaybackHistory(trackPath);
  }

  getHistory() {
    return this.history;
  }
}

module.exports = LibraryDatabase;
