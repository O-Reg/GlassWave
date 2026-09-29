const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('glasswaveAPI', {
  cacheSkin: (data) => ipcRenderer.invoke('skin-cache', data),
  exportSkinFile: (data) => ipcRenderer.invoke('skin-export-file', data),
  importSkinFile: () => ipcRenderer.invoke('skin-import-file'),
  // File utilities (Electron 30+ dropped File.path support)
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        return webUtils.getPathForFile(file);
      }
    } catch (e) {}
    return file ? file.path : null;
  },

  onAnimationPaused: callback => ipcRenderer.on('window-animation-paused', (_, paused) => callback(paused)),
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.send('window-toggle-fullscreen'),
  setFullscreen: (flag) => ipcRenderer.send('window-set-fullscreen', flag),
  isFullscreen: () => ipcRenderer.invoke('window-is-fullscreen'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizedState: (callback) => ipcRenderer.on('window-maximized-state', (event, isMax) => callback(isMax)),
  onFullscreenState: (callback) => ipcRenderer.on('window-fullscreen-state', (event, isFs) => callback(isFs)),
  startWireframeResize: (bounds) => ipcRenderer.send('window-start-wireframe-resize', bounds),
  moveWireframeResize: (bounds) => ipcRenderer.send('window-move-wireframe-resize', bounds),
  endWireframeResize: (bounds) => ipcRenderer.send('window-end-wireframe-resize', bounds),
  getWindowBounds: () => ipcRenderer.invoke('window-get-bounds'),
  onWindowResizedFinal: (callback) => ipcRenderer.on('window-resized-final', (event, bounds) => callback(bounds)),
  setMiniMode: (flag) => ipcRenderer.invoke('window-set-mini-mode', flag),
  isMiniMode: () => ipcRenderer.invoke('window-is-mini-mode'),
  dragStartWindow: (coords) => ipcRenderer.send('window-drag-start', coords),
  dragEndWindow: () => ipcRenderer.send('window-drag-end'),
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('window-set-always-on-top', flag),
  isAlwaysOnTop: () => ipcRenderer.invoke('window-is-always-on-top'),
  snapWindow: (type) => ipcRenderer.invoke('window-snap-to', type),
  getSnapState: () => ipcRenderer.invoke('window-get-snap-state'),
  onWindowSnapped: (callback) => ipcRenderer.on('window-snapped', (event, data) => callback(data)),


  // Music Library & Folder Watcher APIs
  getDemoTrack: () => ipcRenderer.invoke('library-get-demo-track'),
  getTracks: () => ipcRenderer.invoke('library-get-tracks'),
  getFolders: () => ipcRenderer.invoke('library-get-folders'),
  scanNow: () => ipcRenderer.invoke('library-scan-now'),
  addMusicFolder: () => ipcRenderer.invoke('library-add-folder'),
  removeMusicFolder: (folder) => ipcRenderer.invoke('library-remove-folder', folder),
  openFolderInExplorer: (folder) => ipcRenderer.invoke('library-open-folder', folder),
  getConfig: () => ipcRenderer.invoke('library-get-config'),
  saveConfig: (config) => ipcRenderer.invoke('library-save-config', config),

  // Track Operations
  revealFile: (path) => ipcRenderer.invoke('library-reveal-file', path),
  hideTrack: (path) => ipcRenderer.invoke('library-hide-track', path),
  batchHideTracks: (paths) => ipcRenderer.invoke('library-batch-hide-tracks', paths),
  deleteFile: (path) => ipcRenderer.invoke('library-delete-file', path),
  batchDeleteFiles: (paths) => ipcRenderer.invoke('library-batch-delete-files', paths),
  unhideAllTracks: () => ipcRenderer.invoke('library-unhide-all'),
  refreshTrack: (path) => ipcRenderer.invoke('library-refresh-track', path),
  getCoverData: (path) => ipcRenderer.invoke('library-get-cover-data', path),
  rescanEmbeddedCovers: () => ipcRenderer.invoke('library-rescan-embedded-covers'),

  // Categories
  getCategories: () => ipcRenderer.invoke('library-get-categories'),
  getCategoryGroups: () => ipcRenderer.invoke('library-get-category-groups'),
  addCategoryGroup: (name) => ipcRenderer.invoke('library-add-category-group', name),
  renameCategoryGroup: (id, name) => ipcRenderer.invoke('library-rename-category-group', { id, name }),
  deleteCategoryGroup: (id) => ipcRenderer.invoke('library-delete-category-group', id),
  addCategory: (name, groupId) => ipcRenderer.invoke('library-add-category', { name, groupId }),
  renameCategory: (id, name) => ipcRenderer.invoke('library-rename-category', { id, name }),
  deleteCategory: (id) => ipcRenderer.invoke('library-delete-category', id),
  reorderCategories: (ids) => ipcRenderer.invoke('library-reorder-categories', ids),
  addToCategory: (catId, trackPaths) => ipcRenderer.invoke('library-add-to-category', { catId, trackPaths }),
  moveToCategory: (catId, trackPaths) => ipcRenderer.invoke('library-move-to-category', { catId, trackPaths }),
  removeFromCategory: (catId, trackPaths) => ipcRenderer.invoke('library-remove-from-category', { catId, trackPaths }),

  // Favorites
  toggleFavorite: (trackPath, isFav) => ipcRenderer.invoke('library-toggle-favorite', { trackPath, isFav }),
  batchFavorite: (trackPaths, isFav) => ipcRenderer.invoke('library-batch-favorite', { trackPaths, isFav }),

  // Tags
  updateTrackTags: (trackPath, tags) => ipcRenderer.invoke('library-update-tags', { trackPath, tags }),
  batchUpdateTags: (trackPaths, addTags, removeTags) => ipcRenderer.invoke('library-batch-update-tags', { trackPaths, addTags, removeTags }),
  getCustomTags: () => ipcRenderer.invoke('library-get-custom-tags'),
  getHiddenPresetTags: () => ipcRenderer.invoke('library-get-hidden-preset-tags'),
  addCustomTag: (tag) => ipcRenderer.invoke('library-add-custom-tag', tag),
  removeCustomTag: (tag) => ipcRenderer.invoke('library-remove-custom-tag', tag),
  inspectAudioSpec: (filePath) => ipcRenderer.invoke('audio-inspect-spec', filePath),

  // Playback History
  recordHistory: (trackPath) => ipcRenderer.invoke('library-record-history', trackPath),
  getHistory: () => ipcRenderer.invoke('library-get-history'),

  // Drag & Drop Import
  scanDroppedItems: (paths) => ipcRenderer.invoke('library-scan-dropped-items', paths),
  importTracks: (tracks) => ipcRenderer.invoke('library-import-tracks', tracks),

  // Custom Wallpaper (Requirement 4)
  chooseWallpaperImage: () => ipcRenderer.invoke('app-choose-wallpaper'),

  onLibraryUpdated: (callback) => {
    const handler = (event, tracks) => callback(tracks);
    ipcRenderer.on('library-updated', handler);
    return () => ipcRenderer.removeListener('library-updated', handler);
  },
  onMediaPlayPause: (callback) => ipcRenderer.on('media-play-pause', callback),
  onMediaNext: (callback) => ipcRenderer.on('media-next', callback),
  onMediaPrev: (callback) => ipcRenderer.on('media-prev', callback)
});
