const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu, nativeImage, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const MetadataParser = require('./metadata');
const LibraryDatabase = require('./database');
const LibraryScanner = require('./scanner');

const featuredTrackPath = () => path.join(path.dirname(app.getPath('exe')), 'featured', 'The Pattern.wav');

// Portable mode support: if a 'data' directory exists next to the executable, store user data inside it
try {
  const exeDir = path.dirname(app.getPath('exe'));
  const portableDataDir = path.join(exeDir, 'data');
  if (fs.existsSync(portableDataDir)) {
    app.setPath('userData', portableDataDir);
  }
} catch (e) {}

// Enable immediate autoplay without requiring user interaction
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// Hardware / GPU Acceleration & High-Resolution Display Optimization
// Default to GPU hardware acceleration with automatic graceful fallback to software rasterization on machines without dedicated GPU
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('canvas_oop_rasterization');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers');
app.commandLine.appendSwitch('high-dpi-support', '1');
// Use the compositor clock. frameClock.js limits all
// renderer animation callbacks to 60 Hz without timer-based presentation.
// Keep compositor vsync enabled; frameClock bounds application updates.

let _logPath = null;
function getLogFile() {
  if (_logPath) return _logPath;
  try {
    const userData = app.getPath('userData');
    _logPath = path.join(userData, 'app_runtime.log');
  } catch (e) {
    _logPath = path.join(__dirname, '../../app_runtime.log');
  }
  return _logPath;
}
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(getLogFile(), line);
  } catch (e) {}
  console.log(msg);
}

log('--- GlassWave Starting ---');

let mainWindow = null;
let tray = null;
let database = null;
let parser = null;
let scanner = null;
let isQuitting = false;
let quitInProgress = false;
function quitGlassWave() {
  isQuitting = true;
  if (quitInProgress) return;
  quitInProgress = true;
  app.quit();
}

function setupLibrarySystem() {
  const userDataPath = app.getPath('userData');
  database = new LibraryDatabase(path.join(userDataPath, 'database'));
  parser = new MetadataParser(path.join(userDataPath, 'cache'), database);

  scanner = new LibraryScanner(database, parser, (tracks) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('library-updated', tracks);
    }
  });

  const featuredDir = path.dirname(featuredTrackPath());
  if (fs.existsSync(featuredTrackPath())) {
    scanner.watchFolder(featuredDir);
    scanner.scanDirectory(featuredDir);
  }

  // Default GlassWave Library folder in User's Music folder
  const defaultMusicFolder = path.join(app.getPath('music'), 'GlassWave Library');
  if (!fs.existsSync(defaultMusicFolder)) {
    try {
      fs.mkdirSync(defaultMusicFolder, { recursive: true });
    } catch (e) {}
  }

  // Watch and scan default folder
  if (!database.config.defaultFolderDisabled) {
    database.folders.add(defaultMusicFolder);
    scanner.watchFolder(defaultMusicFolder);
    scanner.scanDirectory(defaultMusicFolder);
  }

  // Watch and scan any saved custom folders
  database.config.customFolders.forEach(folder => {
    {
      database.folders.add(folder);
      scanner.watchFolder(folder);
      scanner.scanDirectory(folder);
    }
  });
}

function createTray() {
  const icoPath = path.join(__dirname, '../renderer/assets/tray.ico');
  const pngPath = path.join(__dirname, '../renderer/assets/tray.png');
  const iconPath = fs.existsSync(icoPath) ? icoPath : pngPath;
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  tray.setToolTip('GlassWave - 优雅流体本地音乐播放器');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '播放 / 暂停',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-play-pause');
      }
    },
    {
      label: '下一首',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-next');
      }
    },
    {
      label: '上一首',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-prev');
      }
    },
    { type: 'separator' },
    {
      label: '退出 GlassWave',
      click: quitGlassWave
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function registerGlobalMediaKeys() {
  try {
    globalShortcut.register('MediaPlayPause', () => {
      if (mainWindow) mainWindow.webContents.send('media-play-pause');
    });
    globalShortcut.register('MediaNextTrack', () => {
      if (mainWindow) mainWindow.webContents.send('media-next');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
      if (mainWindow) mainWindow.webContents.send('media-prev');
    });
  } catch (err) {
    console.warn('Failed to register global shortcuts:', err);
  }
}

function createWindow() {
  const icoPath = path.join(__dirname, '../renderer/assets/icon.ico');
  const pngPath = path.join(__dirname, '../renderer/assets/tray.png');
  const appIcon = fs.existsSync(icoPath) ? icoPath : pngPath;

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 640,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false, // Custom dashed preview owns resizing; avoid native live resize.
    maximizable: true,
    fullscreenable: true,
    icon: appIcon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false
    },
    show: false
  });

  mainWindow.refreshRoundedShape = require('./roundedWindow').attach(mainWindow);
  const htmlPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(htmlPath);

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    log(`[RENDERER] ${message}${sourceId ? ` (${sourceId}:${line})` : ''}`);
  });

  const displayWindow = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      log('Main window displayed and focused.');
    }
  };

  mainWindow.once('ready-to-show', () => {
    displayWindow();
  });

  mainWindow.webContents.once('did-finish-load', () => {
    displayWindow();
  });

  setTimeout(() => {
    displayWindow();
  }, 1000);

  // Closing the main window exits; minimizing remains a separate action.
  mainWindow.on('close', () => { isQuitting = true; });
  const sendAnimationState = () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('window-animation-paused', mainWindow.isMinimized() || !mainWindow.isVisible());
  };
  for (const event of ['minimize', 'restore', 'hide', 'show']) mainWindow.on(event, sendAnimationState);
  mainWindow.webContents.on('did-finish-load', sendAnimationState);

  mainWindow.on('closed', () => {
    mainWindow = null;
    // A hidden resize-preview window may still exist, so closing the main
    // window must terminate the application explicitly.
    if (isQuitting) quitGlassWave();
  });

  // Multi-monitor reliable maximize & restore state tracking
  let isWindowMaximized = false;
  let isWindowFullscreen = false;
  let savedNormalBounds = mainWindow ? mainWindow.getBounds() : null;
  let normalBounds = null;
  let isMiniMode = false;

  function updateNormalBounds() {
    if (mainWindow && !mainWindow.isDestroyed() && !isWindowMaximized && !mainWindow.isMaximized() && !mainWindow.isFullScreen() && !isMiniMode) {
      savedNormalBounds = mainWindow.getBounds();
    }
  }

  mainWindow.on('move', () => {
    updateNormalBounds();
  });

  mainWindow.on('resize', () => {
    updateNormalBounds();
  });

  function restoreWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (isWindowFullscreen || mainWindow.isFullScreen()) mainWindow.setFullScreen(false);
    isWindowFullscreen = false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    if (savedNormalBounds) {
      mainWindow.setBounds(savedNormalBounds);
    }
    isWindowMaximized = false;
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-fullscreen-state', false);
      mainWindow.webContents.send('window-maximized-state', false);
    }
  }

  function maximizeWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!isWindowMaximized && !mainWindow.isMaximized() && !mainWindow.isFullScreen() && !isMiniMode) {
      savedNormalBounds = mainWindow.getBounds();
    }
    isWindowMaximized = true;
    mainWindow.maximize();
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', true);
    }
  }

  function enterFullscreen() {
    if (!mainWindow || mainWindow.isDestroyed() || isWindowFullscreen || mainWindow.isFullScreen()) return;
    if (!isWindowMaximized && !mainWindow.isMaximized() && !isMiniMode) {
      savedNormalBounds = mainWindow.getBounds();
    }
    isWindowMaximized = true; // Guard restore bounds during native move/resize events.
    isWindowFullscreen = true;
    mainWindow.setFullScreen(true);
    mainWindow.webContents.send('window-fullscreen-state', true);
    mainWindow.webContents.send('window-maximized-state', true);
  }

  function toggleMaximize() {
    const isMax = isWindowMaximized || (mainWindow && (mainWindow.isMaximized() || mainWindow.isFullScreen()));
    if (isMax) {
      restoreWindow();
    } else {
      maximizeWindow();
    }
  }

  // Forward native window state changes to Renderer
  mainWindow.on('maximize', () => {
    isWindowMaximized = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', true);
    }
  });

  mainWindow.on('unmaximize', () => {
    isWindowMaximized = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-maximized-state', false);
    }
  });

  mainWindow.on('enter-full-screen', () => {
    isWindowMaximized = true;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window-fullscreen-state', true);
      mainWindow.webContents.send('window-maximized-state', true);
    }
  });

  mainWindow.on('leave-full-screen', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const isMax = mainWindow.isMaximized();
      isWindowMaximized = isMax;
      mainWindow.webContents.send('window-fullscreen-state', false);
      mainWindow.webContents.send('window-maximized-state', isMax);
    }
  });

  // Window control IPC
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    toggleMaximize();
  });

  ipcMain.on('window-close', () => {
    quitGlassWave();
  });

  ipcMain.on('window-toggle-fullscreen', () => {
    if (mainWindow && (isWindowFullscreen || mainWindow.isFullScreen())) restoreWindow();
    else enterFullscreen();
  });

  ipcMain.on('window-set-fullscreen', (event, flag) => {
    if (!flag) restoreWindow();
    else enterFullscreen();
  });

  ipcMain.handle('window-is-fullscreen', () => {
    return mainWindow ? (isWindowFullscreen || mainWindow.isFullScreen()) : false;
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? (isWindowMaximized || mainWindow.isMaximized()) : false;
  });

  ipcMain.handle('window-get-bounds', () => {
    return mainWindow ? mainWindow.getBounds() : null;
  });

  // Windows 11 Snapping State & Safe Window Dragging
  let currentSnapState = null;
  let activeSnapTarget = null;
  let preSnapBounds = null;
  let dragStartBounds = null;
  let dragStartDisplay = null;
  let dragCurrentPos = null;

  function calculateSnapTarget(cursorPoint) {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const curDisplay = screen.getDisplayNearestPoint(cursorPoint);
    if (!curDisplay) return null;
    const wa = curDisplay.workArea;

    const EDGE_MARGIN = 16;
    const CORNER_V_ZONE = 120;
    const CORNER_H_ZONE = 140;

    // 1. Top-Left Corner -> Top-Left Quarter (1/4 screen)
    if ((cursorPoint.x <= wa.x + EDGE_MARGIN && cursorPoint.y <= wa.y + CORNER_V_ZONE) ||
        (cursorPoint.y <= wa.y + EDGE_MARGIN && cursorPoint.x <= wa.x + CORNER_H_ZONE)) {
      return {
        type: 'top-left',
        label: '左上四分之一屏',
        bounds: {
          x: wa.x,
          y: wa.y,
          width: Math.round(wa.width / 2),
          height: Math.round(wa.height / 2)
        }
      };
    }

    // 2. Bottom-Left Corner -> Bottom-Left Quarter (1/4 screen)
    if ((cursorPoint.x <= wa.x + EDGE_MARGIN && cursorPoint.y >= wa.y + wa.height - CORNER_V_ZONE) ||
        (cursorPoint.y >= wa.y + wa.height - EDGE_MARGIN && cursorPoint.x <= wa.x + CORNER_H_ZONE)) {
      return {
        type: 'bottom-left',
        label: '左下四分之一屏',
        bounds: {
          x: wa.x,
          y: wa.y + Math.round(wa.height / 2),
          width: Math.round(wa.width / 2),
          height: Math.round(wa.height / 2)
        }
      };
    }

    // 3. Left Edge -> Left Half (半屏)
    if (cursorPoint.x <= wa.x + EDGE_MARGIN) {
      return {
        type: 'left-half',
        label: '左半屏',
        bounds: {
          x: wa.x,
          y: wa.y,
          width: Math.round(wa.width / 2),
          height: wa.height
        }
      };
    }

    // 4. Top-Right Corner -> Top-Right Quarter (1/4 screen)
    if ((cursorPoint.x >= wa.x + wa.width - EDGE_MARGIN && cursorPoint.y <= wa.y + CORNER_V_ZONE) ||
        (cursorPoint.y <= wa.y + EDGE_MARGIN && cursorPoint.x >= wa.x + wa.width - CORNER_H_ZONE)) {
      return {
        type: 'top-right',
        label: '右上四分之一屏',
        bounds: {
          x: wa.x + Math.round(wa.width / 2),
          y: wa.y,
          width: Math.round(wa.width / 2),
          height: Math.round(wa.height / 2)
        }
      };
    }

    // 5. Bottom-Right Corner -> Bottom-Right Quarter (1/4 screen)
    if ((cursorPoint.x >= wa.x + wa.width - EDGE_MARGIN && cursorPoint.y >= wa.y + wa.height - CORNER_V_ZONE) ||
        (cursorPoint.y >= wa.y + wa.height - EDGE_MARGIN && cursorPoint.x >= wa.x + wa.width - CORNER_H_ZONE)) {
      return {
        type: 'bottom-right',
        label: '右下四分之一屏',
        bounds: {
          x: wa.x + Math.round(wa.width / 2),
          y: wa.y + Math.round(wa.height / 2),
          width: Math.round(wa.width / 2),
          height: Math.round(wa.height / 2)
        }
      };
    }

    // 6. Right Edge -> Right Half (半屏)
    if (cursorPoint.x >= wa.x + wa.width - EDGE_MARGIN) {
      return {
        type: 'right-half',
        label: '右半屏',
        bounds: {
          x: wa.x + Math.round(wa.width / 2),
          y: wa.y,
          width: Math.round(wa.width / 2),
          height: wa.height
        }
      };
    }

    // 7. Top Edge -> Maximize (全屏)
    if (cursorPoint.y <= wa.y + 10 && cursorPoint.x > wa.x + CORNER_H_ZONE && cursorPoint.x < wa.x + wa.width - CORNER_H_ZONE) {
      return {
        type: 'maximize',
        label: '全屏最大化',
        bounds: {
          x: wa.x,
          y: wa.y,
          width: wa.width,
          height: wa.height
        }
      };
    }

    return null;
  }

  function showSnapGhost(bounds) {
    const ghost = getOrCreateWireframeWindow();
    ghost.setBounds(bounds, false);
    ghost.showInactive();
  }

  function hideSnapGhost() {
    if (wireframeWindow && !wireframeWindow.isDestroyed() && wireframeWindow.isVisible()) {
      wireframeWindow.hide();
    }
  }

  function applySnap(type, customPoint = null) {
    if (!mainWindow || mainWindow.isDestroyed()) return null;
    const pt = customPoint || screen.getCursorScreenPoint();
    const curDisplay = screen.getDisplayNearestPoint(pt);
    const wa = curDisplay.workArea;

    if (!currentSnapState) {
      preSnapBounds = mainWindow.getBounds();
    }

    mainWindow.setMinimumSize(320, 240);

    let targetBounds = null;
    switch (type) {
      case 'left-half':
        targetBounds = { x: wa.x, y: wa.y, width: Math.round(wa.width / 2), height: wa.height };
        break;
      case 'right-half':
        targetBounds = { x: wa.x + Math.round(wa.width / 2), y: wa.y, width: Math.round(wa.width / 2), height: wa.height };
        break;
      case 'top-left':
        targetBounds = { x: wa.x, y: wa.y, width: Math.round(wa.width / 2), height: Math.round(wa.height / 2) };
        break;
      case 'top-right':
        targetBounds = { x: wa.x + Math.round(wa.width / 2), y: wa.y, width: Math.round(wa.width / 2), height: Math.round(wa.height / 2) };
        break;
      case 'bottom-left':
        targetBounds = { x: wa.x, y: wa.y + Math.round(wa.height / 2), width: Math.round(wa.width / 2), height: Math.round(wa.height / 2) };
        break;
      case 'bottom-right':
        targetBounds = { x: wa.x + Math.round(wa.width / 2), y: wa.y + Math.round(wa.height / 2), width: Math.round(wa.width / 2), height: Math.round(wa.height / 2) };
        break;
      case 'left-two-thirds':
        targetBounds = { x: wa.x, y: wa.y, width: Math.round(wa.width * 0.65), height: wa.height };
        break;
      case 'right-one-third':
        targetBounds = { x: wa.x + Math.round(wa.width * 0.65), y: wa.y, width: Math.round(wa.width * 0.35), height: wa.height };
        break;
      case 'maximize':
        targetBounds = { x: wa.x, y: wa.y, width: wa.width, height: wa.height };
        break;
      case 'restore':
        currentSnapState = null;
        const rb = preSnapBounds || normalBounds || { width: 1180, height: 780, x: wa.x + 50, y: wa.y + 50 };
        mainWindow.setBounds(rb, false);
        mainWindow.webContents.send('window-snapped', { snapType: null, bounds: rb });
        return { snapType: null, bounds: rb };
      default:
        return null;
    }

    if (targetBounds) {
      currentSnapState = type;
      mainWindow.setBounds(targetBounds, false);
      mainWindow.webContents.send('window-snapped', { snapType: type, bounds: targetBounds });
      return { snapType: type, bounds: targetBounds };
    }
    return null;
  }

  ipcMain.handle('window-snap-to', (event, type) => {
    return applySnap(type);
  });

  ipcMain.handle('window-get-snap-state', () => {
    return currentSnapState;
  });

  let cursorMoveTimer=null, cursorMoveOrigin=null, cursorMoveStart=null, cursorMoveApplied=null;
  function sampleSystemCursor() {
    if(!cursorMoveOrigin || !cursorMoveStart || !mainWindow || mainWindow.isDestroyed())return;
    const cursor=screen.getCursorScreenPoint();
    const dx=cursor.x-cursorMoveOrigin.x,dy=cursor.y-cursorMoveOrigin.y;
    if(!cursorMoveApplied && Math.hypot(dx,dy)<4)return;
    const x=Math.round(cursorMoveStart.x+dx),y=Math.round(cursorMoveStart.y+dy);
    if(cursorMoveApplied?.x===x && cursorMoveApplied?.y===y)return;
    mainWindow.setPosition(x,y,false);
    cursorMoveApplied={x,y};
    const target=calculateSnapTarget(cursor);
    if(target) {if(activeSnapTarget?.type!==target.type)showSnapGhost(target.bounds);activeSnapTarget=target;}
    else if(activeSnapTarget){activeSnapTarget=null;hideSnapGhost();}
  }
  function stopSystemCursorMove(finalSample=true) {
    if(cursorMoveTimer){clearInterval(cursorMoveTimer);cursorMoveTimer=null;}
    if(finalSample)sampleSystemCursor();
    cursorMoveOrigin=null;cursorMoveStart=null;cursorMoveApplied=null;
  }
  mainWindow.on('blur',()=>{stopSystemCursorMove(false);activeSnapTarget=null;hideSnapGhost();});
  mainWindow.on('closed',()=>stopSystemCursorMove(false));
  ipcMain.on('window-drag-start', (event, coords) => {
    stopSystemCursorMove(false);
    if (!mainWindow || mainWindow.isDestroyed()) return;

    // If window is currently snapped, un-snap and restore original dimensions on drag (Windows 11 logic)
    if (currentSnapState) {
      const hasCoords = coords && typeof coords.screenX === 'number' && typeof coords.screenY === 'number';
      const pt = hasCoords ? { x: coords.screenX, y: coords.screenY } : null;
      if (pt) {
        const restoreW = preSnapBounds ? preSnapBounds.width : (normalBounds ? normalBounds.width : 1180);
        const restoreH = preSnapBounds ? preSnapBounds.height : (normalBounds ? normalBounds.height : 780);
        const newX = Math.round(pt.x - restoreW * 0.5);
        const newY = Math.round(pt.y - 20);
        mainWindow.setBounds({ x: newX, y: newY, width: restoreW, height: restoreH }, false);
        currentSnapState = null;
        mainWindow.webContents.send('window-snapped', { snapType: null, bounds: { x: newX, y: newY, width: restoreW, height: restoreH } });
      }
    }

    dragStartBounds = mainWindow.getBounds();
    dragStartDisplay = screen.getDisplayNearestPoint({
      x: dragStartBounds.x + Math.floor(dragStartBounds.width / 2),
      y: dragStartBounds.y + Math.floor(dragStartBounds.height / 2)
    });
    dragCurrentPos = { x: dragStartBounds.x, y: dragStartBounds.y };
    activeSnapTarget = null;
    const pointer=screen.getCursorScreenPoint();
    cursorMoveOrigin={x:pointer.x,y:pointer.y};
    cursorMoveStart={...dragStartBounds};
    const refresh=screen.getDisplayMatching(dragStartBounds).displayFrequency || 60;
    cursorMoveTimer=setInterval(sampleSystemCursor,Math.max(8,Math.round(1000/Math.min(120,Math.max(60,refresh)))));
  });

  ipcMain.on('window-drag-end', () => {
    stopSystemCursorMove(true);
    dragStartBounds = null;
    dragStartDisplay = null;
    dragCurrentPos = null;
    hideSnapGhost();

    if (activeSnapTarget) {
      applySnap(activeSnapTarget.type);
      activeSnapTarget = null;
    } else if (mainWindow && !mainWindow.isDestroyed()) {
      if (!currentSnapState) {
        updateNormalBounds();
      }
    }
  });

  ipcMain.handle('window-set-mini-mode', (event, enable) => {
    if (!mainWindow) return false;
    if (enable) {
      if (!isMiniMode) {
        normalBounds = mainWindow.getBounds();
      }
      isMiniMode = true;
      mainWindow.setMinimumSize(480, 88);
      mainWindow.setMaximumSize(10000, 88);
      const targetWidth = Math.max(580, Math.min(normalBounds ? normalBounds.width : 780, 820));
      const targetX = normalBounds ? Math.round(normalBounds.x + (normalBounds.width - targetWidth) / 2) : 100;
      const targetY = normalBounds ? normalBounds.y : 100;
      mainWindow.setBounds({ x: targetX, y: targetY, width: targetWidth, height: 88 });
      mainWindow.setAlwaysOnTop(true);
      return true;
    } else {
      isMiniMode = false;
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setMaximumSize(10000, 10000);
      mainWindow.setMinimumSize(900, 640);
      const restoreBounds = normalBounds || { width: 1180, height: 780 };
      mainWindow.setBounds(restoreBounds);
      return false;
    }
  });

  ipcMain.handle('window-is-mini-mode', () => isMiniMode);

  ipcMain.handle('window-set-always-on-top', (event, flag) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(!!flag);
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });

  ipcMain.handle('window-is-always-on-top', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });


  // Wireframe Resizing System (Ghost dashed box during resizing, applies on mouse release)
  let wireframeWindow = null;
  function getOrCreateWireframeWindow() {
    if (wireframeWindow && !wireframeWindow.isDestroyed()) return wireframeWindow;
    wireframeWindow = new BrowserWindow({
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });
    const wireframeHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
            background: transparent;
          }
          .ghost-wireframe {
            position: absolute;
            inset: 2px;
            border: 2px dashed rgba(56, 189, 248, 0.95);
            border-radius: 14px;
            background: rgba(56, 189, 248, 0.08);
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
            pointer-events: none;
            will-change: transform;
          }
        </style>
      </head>
      <body>
        <div class="ghost-wireframe"></div>
      </body>
      </html>
    `;
    wireframeWindow.setIgnoreMouseEvents(true);
    wireframeWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(wireframeHtml)}`);
    return wireframeWindow;
  }

  let lastGhostBounds = null;

  ipcMain.on('window-start-wireframe-resize', (event, bounds) => {
    if (!mainWindow) return;
    const initial = bounds || mainWindow.getBounds();
    const ghost = getOrCreateWireframeWindow();
    lastGhostBounds = { ...initial };
    ghost.setBounds(initial, false);
    ghost.showInactive();
  });

  ipcMain.on('window-move-wireframe-resize', (event, newBounds) => {
    if (wireframeWindow && !wireframeWindow.isDestroyed() && wireframeWindow.isVisible() && newBounds) {
      if (lastGhostBounds &&
          lastGhostBounds.x === newBounds.x &&
          lastGhostBounds.y === newBounds.y &&
          lastGhostBounds.width === newBounds.width &&
          lastGhostBounds.height === newBounds.height) {
        return;
      }
      lastGhostBounds = { ...newBounds };
      wireframeWindow.setBounds(newBounds, false);
    }
  });

  ipcMain.on('window-end-wireframe-resize', (event, finalBounds) => {
    lastGhostBounds = null;
    if (wireframeWindow && !wireframeWindow.isDestroyed()) {
      wireframeWindow.hide();
    }
    if (mainWindow && !mainWindow.isDestroyed() && finalBounds) {
      mainWindow.setBounds(finalBounds, false);
      mainWindow.webContents.send('window-resized-final', finalBounds);
    }
  });

  // Library IPC Handlers
  ipcMain.handle('library-get-tracks', () => {
    return database ? database.getAllTracks() : [];
  });

  ipcMain.handle('library-get-folders', () => {
    return database ? database.getFolders() : [];
  });

  ipcMain.handle('library-scan-now', async () => {
    if (scanner && database) {
      for (const folder of database.getFolders()) {
        await scanner.scanDirectory(folder);
      }
      return database.getAllTracks();
    }
    return [];
  });

  ipcMain.handle('library-add-folder', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择要添加的音乐文件夹',
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selected = result.filePaths[0];
      if(selected === path.join(app.getPath('music'),'GlassWave Library')) database.config.defaultFolderDisabled=false;
      database.addFolder(selected);
      scanner.watchFolder(selected);
      scanner.scanDirectory(selected);
      return { folders: database.getFolders(), tracks: database.getAllTracks() };
    }
    return null;
  });

  ipcMain.handle('library-remove-folder', async (event, folderPath) => {
    if (database && scanner) {
      if(!database.getFolders().includes(folderPath))return null;
      await scanner.unwatchFolder(folderPath);
      if(folderPath === path.join(app.getPath('music'),'GlassWave Library')) database.config.defaultFolderDisabled=true;
      database.removeFolder(folderPath);
      scanner.triggerUpdate();
      return { folders: database.getFolders(), tracks: database.getAllTracks() };
    }
    return null;
  });

  ipcMain.handle('library-open-folder', (event, folderPath) => {
    if (folderPath && fs.existsSync(folderPath)) {
      shell.openPath(folderPath);
    }
  });

  // Reveal specific file in Windows Explorer
  ipcMain.handle('library-reveal-file', (event, filePath) => {
    if (filePath && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
    }
  });

  // Hide track from library (pure remove from DB without touching filesystem)
  ipcMain.handle('library-hide-track', (event, filePath) => {
    if (database) {
      const updated = database.hideTrack(filePath);
      return updated;
    }
    return [];
  });

  // Batch hide tracks from library
  ipcMain.handle('library-batch-hide-tracks', (event, filePaths) => {
    if (database && Array.isArray(filePaths)) {
      return database.batchHideTracks(filePaths);
    }
    return database ? database.getAllTracks() : [];
  });

  // Only remove successful trash operations; never hide failures.
  async function trashTracks(filePaths) {
    const deletedPaths=[], failures=[];
    for(const fp of [...new Set(Array.isArray(filePaths)?filePaths:[])]) {
      try {
        if(!fp || !path.isAbsolute(fp) || !fs.existsSync(fp)) throw new Error('文件不存在或路径无效');
        await shell.trashItem(fp);
        deletedPaths.push(fp);
        database?.hideTrack(fp);
      } catch(error) { failures.push({path:fp,error:error.message}); }
    }
    return {success:failures.length===0,deletedPaths,failures,error:failures.map(f=>f.error).join('；'),tracks:database?database.getAllTracks():[]};
  }
  ipcMain.handle('library-delete-file',(_,fp)=>trashTracks([fp]));
  ipcMain.handle('library-batch-delete-files',(_,paths)=>trashTracks(paths));
  ipcMain.handle('library-get-demo-track',async()=>{
    const featuredPath=featuredTrackPath();
    if(!fs.existsSync(featuredPath) || !database || database.isHidden(featuredPath)) return null;
    const track=await parser.parseFile(featuredPath);
    database.upsertTrack(track);database.save();return track;
  });

  // Restore all hidden tracks
  ipcMain.handle('library-unhide-all', async () => {
    if (database && scanner) {
      database.unhideAll();
      for (const folder of database.getFolders()) {
        await scanner.scanDirectory(folder);
      }
      return database.getAllTracks();
    }
    return [];
  });

  // Refresh metadata & artwork for a specific track
  ipcMain.handle('library-refresh-track', async (event, filePath) => {
    if (database && parser && fs.existsSync(filePath)) {
      const updatedTrack = await parser.parseFile(filePath);
      database.upsertTrack(updatedTrack);
      database.save();
      return database.getAllTracks();
    }
    return database ? database.getAllTracks() : [];
  });

  ipcMain.handle('library-get-cover-data', async (event, targetPath) => {
    if (parser && targetPath) {
      return await parser.getCoverDataUrl(targetPath);
    }
    return null;
  });

  ipcMain.handle('library-get-config', () => {
    return database ? database.config : {};
  });

  ipcMain.handle('library-save-config', (event, newConfig) => {
    if (database) {
      database.config = { ...database.config, ...newConfig };
      database.save();
    }
  });

  // Categories
  ipcMain.handle('library-get-categories', () => database ? database.getCategories() : []);
  ipcMain.handle('library-get-category-groups', () => database ? database.getCategoryGroups() : []);
  ipcMain.handle('library-add-category-group', (event, name) => database ? database.addCategoryGroup(name) : []);
  ipcMain.handle('library-rename-category-group', (event, { id, name }) => database ? database.renameCategoryGroup(id, name) : []);
  ipcMain.handle('library-delete-category-group', (event, id) => database ? database.deleteCategoryGroup(id) : []);
  ipcMain.handle('library-add-category', (event, { name, groupId }) => database ? database.addCategory(name, groupId) : []);
  ipcMain.handle('library-rename-category', (event, { id, name }) => database ? database.renameCategory(id, name) : []);
  ipcMain.handle('library-delete-category', (event, id) => database ? database.deleteCategory(id) : []);
  ipcMain.handle('library-reorder-categories', (event, ids) => database ? database.reorderCategories(ids) : []);
  ipcMain.handle('library-add-to-category', (event, { catId, trackPaths }) => database ? database.addTracksToCategory(catId, trackPaths) : []);
  ipcMain.handle('library-move-to-category', (event, { catId, trackPaths }) => database ? database.moveTracksToCategory(catId, trackPaths) : []);
  ipcMain.handle('library-remove-from-category', (event, { catId, trackPaths }) => database ? database.removeTracksFromCategory(catId, trackPaths) : []);
  ipcMain.handle('library-update-category-icon', (event, { id, iconIndex }) => database ? database.updateCategoryIcon(id, iconIndex) : []);


  // Favorites
  ipcMain.handle('library-toggle-favorite', (event, { trackPath, isFav }) => database ? database.toggleFavorite(trackPath, isFav) : false);
  ipcMain.handle('library-batch-favorite', (event, { trackPaths, isFav }) => database ? database.batchFavorite(trackPaths, isFav) : []);

  // Tags
  ipcMain.handle('library-update-tags', (event, { trackPath, tags }) => database ? database.updateTrackTags(trackPath, tags) : []);
  ipcMain.handle('library-batch-update-tags', (event, { trackPaths, addTags, removeTags }) => database ? database.batchUpdateTags(trackPaths, addTags, removeTags) : []);
  ipcMain.handle('library-get-custom-tags', () => database ? database.getCustomTags() : []);
  ipcMain.handle('library-get-hidden-preset-tags', () => database ? database.getHiddenPresetTags() : []);
  ipcMain.handle('library-add-custom-tag', (event, tag) => database ? database.addCustomTag(tag) : []);
  ipcMain.handle('library-remove-custom-tag', (event, tag) => database ? database.removeCustomTag(tag) : []);

  // Audio Inspector for HiFi Master specs
  ipcMain.handle('audio-inspect-spec', async (event, filePath) => {
    if (!filePath) return null;
    try {
      if (database) {
        const existing = database.getTrack(filePath);
        if (existing && existing.audioSpec && existing.audioSpec.sampleRate) {
          return existing.audioSpec;
        }
      }
      if (parser) {
        const parsed = await parser.parseFile(filePath);
        if (parsed && parsed.audioSpec) {
          return parsed.audioSpec;
        }
      }
    } catch (e) {
      console.warn('Audio spec inspect warning:', filePath, e.message);
    }
    const ext = path.extname(filePath).slice(1).toUpperCase();
    const isLossless = ['FLAC', 'WAV', 'APE', 'ALAC', 'AIFF', 'DSF', 'DFF'].includes(ext);
    const isHiRes = ['DSF', 'DFF'].includes(ext) || (isLossless && (ext === 'FLAC' || ext === 'WAV'));
    return {
      container: ext || 'AUDIO',
      codec: ext || 'AUDIO',
      sampleRate: isHiRes ? 96000 : 44100,
      bitsPerSample: ext === 'DSF' || ext === 'DFF' ? 1 : (isHiRes ? 24 : 16),
      numberOfChannels: 2,
      bitrate: isLossless ? (isHiRes ? 2840 : 1411) : 320,
      isLossless,
      isHiRes
    };
  });

  // History
  ipcMain.handle('library-record-history', (event, trackPath) => {
    if (database) database.recordPlaybackHistory(trackPath);
  });
  ipcMain.handle('library-get-history', () => database ? database.getHistory() : []);

  // Drag-and-drop Import with Duplicate Detection
  const SUPPORTED_EXTS = new Set(['.mp3', '.flac', '.wav', '.m4a', '.ogg', '.aac', '.opus', '.wma']);
  function resolveAudioFiles(filePaths) {
    const list = [];
    function walk(p) {
      try {
        if (!fs.existsSync(p)) return;
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          const entries = fs.readdirSync(p);
          for (const entry of entries) walk(path.join(p, entry));
        } else if (stat.isFile()) {
          const ext = path.extname(p).toLowerCase();
          if (SUPPORTED_EXTS.has(ext)) list.push(p);
        }
      } catch (e) {}
    }
    if (Array.isArray(filePaths)) filePaths.forEach(walk);
    return list;
  }

  ipcMain.handle('library-rescan-embedded-covers', async () => {
    if (database && parser) {
      const all = database.getAllTracks();
      let updatedCount = 0;
      for (const track of all) {
        if (track && track.path && fs.existsSync(track.path)) {
          try {
            const dataUrl = await parser.getCoverDataUrl(track.path);
            if (dataUrl) updatedCount++;
          } catch (e) {}
        }
      }
      database.save();
      if (scanner) scanner.triggerUpdate();
      return { success: true, updatedCount, tracks: database.getAllTracks() };
    }
    return { success: false, updatedCount: 0, tracks: [] };
  });

  ipcMain.handle('library-scan-dropped-items', async (event, droppedPaths) => {
    // If dropped item is a directory, automatically add and watch it for silent real-time sync
    if (Array.isArray(droppedPaths)) {
      droppedPaths.forEach(p => {
        try {
          if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
            if (database) database.addFolder(p);
            if (scanner) {
              scanner.watchFolder(p);
              scanner.scanDirectory(p);
            }
          }
        } catch (e) {}
      });
    }

    const audioFiles = resolveAudioFiles(droppedPaths);
    const existingMap = database ? database.tracks : new Map();
    const results = [];
    const newTracks = [];
    let duplicateCount = 0;
    let newCount = 0;

    for (const filePath of audioFiles) {
      const isExisting = existingMap.has(filePath);
      if (isExisting) {
        duplicateCount++;
        results.push(existingMap.get(filePath));
      } else {
        newCount++;
        if (parser) {
          const meta = await parser.parseFile(filePath);
          results.push(meta);
          newTracks.push(meta);
        }
      }
    }
    return { tracks: results, newTracks, duplicateCount, newCount };
  });

  ipcMain.handle('library-import-tracks', (event, newTracks) => {
    if (database && Array.isArray(newTracks)) {
      newTracks.forEach(t => { database.hiddenPaths.delete(t.path); database.upsertTrack(t); });
      database.save();
      if (scanner) scanner.triggerUpdate();
      return database.getAllTracks();
    }
    return database ? database.getAllTracks() : [];
  });

  ipcMain.handle('skin-cache', async (_, snapshot) => {
    try { const io = require('./skinFiles'); return { data: await io.unpack(await io.pack(snapshot), app.getPath('userData'), nativeImage) }; }
    catch (e) { return { error: '保存皮肤失败：' + e.message }; }
  });
  ipcMain.handle('skin-export-file', async (_, snapshot) => {
    try {
      const packed = await require('./skinFiles').pack(snapshot);
      const result = await dialog.showSaveDialog(mainWindow, { title: '导出完整皮肤', defaultPath: 'GlassWave皮肤.glasswave-skin', filters: [{ name: 'GlassWave皮肤', extensions: ['glasswave-skin'] }] });
      if (result.canceled || !result.filePath) return { canceled: true };
      const temp = result.filePath + '.tmp-' + Date.now();
      await require('fs').promises.writeFile(temp, JSON.stringify(packed));
      await require('fs').promises.rename(temp, result.filePath);
      return { success: true };
    } catch (e) { return { error: '导出失败：' + e.message }; }
  });
  ipcMain.handle('skin-import-file', async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, { title: '导入完整皮肤', properties: ['openFile'], filters: [{ name: 'GlassWave皮肤', extensions: ['glasswave-skin'] }] });
      if (result.canceled || !result.filePaths.length) return { canceled: true };
      const fs = require('fs').promises, filename = result.filePaths[0];
      if ((await fs.stat(filename)).size > 96 * 1024 * 1024) throw Error('皮肤文件过大');
      const packed = JSON.parse(await fs.readFile(filename, 'utf8'));
      return { data: await require('./skinFiles').unpack(packed, app.getPath('userData'), nativeImage) };
    } catch (e) { return { error: '导入失败：' + e.message }; }
  });
  // Custom Wallpaper Dialog IPC Handler (Requirement 4)
  ipcMain.handle('app-choose-wallpaper', async () => {
    if (!mainWindow) return null;
    const lastFolder = database?.config?.lastWallpaperFolder;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择自定义背景图片',
      ...(typeof lastFolder === 'string' && fs.existsSync(lastFolder) ? { defaultPath: lastFolder } : {}),
      properties: ['openFile'],
      filters: [
        { name: '图片文件 (*.jpg, *.png, *.webp, *.jpeg, *.bmp)', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
      ]
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    if (database) {
      try {
        database.config.lastWallpaperFolder = path.dirname(result.filePaths[0]);
        database.save();
      } catch (error) { log(`Could not remember wallpaper folder: ${error.message}`); }
    }
    return result.filePaths[0];
  });
}

app.whenReady().then(() => {
  setupLibrarySystem();
  createWindow();
  createTray();
  registerGlobalMediaKeys();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('will-quit', () => {
  scanner?.close();
  globalShortcut.unregisterAll();
  if (tray) { try { tray.destroy(); } catch (e) {} tray = null; }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) quitGlassWave();
});
