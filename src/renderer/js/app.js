/**
 * GlassWave App Bootstrap
 * Integrates AudioEngine, ColorEngine, Visualizer, Parallax, UI, and Native Library Watcher
 * Implements "Launch & Play Immediately" and state restoration
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('✨ GlassWave initializing...');

  const api = window.glasswaveAPI;

  // 1. Initialize Engines
  const colorEngine = new ColorEngine('ambient-canvas');
  const audioEngine = new AudioEngine('audio-player');
  const visualizer = new Visualizer('visualizer-canvas', audioEngine, colorEngine);
  const parallax = new MouseParallax('parallax-deck', 'album-wrap');
  const ui = new UIController(audioEngine, visualizer, colorEngine, parallax);
  window.ui = ui;
  window.appUI = ui;
  window.audioEngine = audioEngine;
  window.visualizer = visualizer;
  window.colorEngine = colorEngine;
  // A skin can reload the renderer; restore its visual tuning and current
  // window layout before asynchronous library loading yields the first frame.
  window.GlassWaveSkin?.restore(ui);

  // Sync Audio Bass Energy to Ambient Color Engine
  const syncLoop = () => {
    if (audioEngine.isPlaying) {
      const data = audioEngine.getAudioData();
      colorEngine.audioBassEnergy = data.bassEnergy;
    } else {
      colorEngine.audioBassEnergy = 0;
    }
    requestAnimationFrame(syncLoop);
  };
  requestAnimationFrame(syncLoop);

  // 2. Track Change Sync & Persistence
  audioEngine.onTrackChange = (track) => {
    ui.updateTrackView(track);
    saveState();
  };

  const origOnQueueChange = audioEngine.onQueueChange;
  audioEngine.onQueueChange = () => {
    if (typeof origOnQueueChange === 'function') origOnQueueChange();
    saveState();
  };

  function saveState() {
    try {
      const state = {
        lastTrackPath: audioEngine.currentTrack ? audioEngine.currentTrack.path : null,
        currentTime: audioEngine.audio ? audioEngine.audio.currentTime : 0,
        volume: audioEngine.volume,
        isShuffle: audioEngine.isShuffle,
        repeatMode: audioEngine.repeatMode,
        eq: audioEngine.getEQState(),
        savedQueuePaths: (audioEngine.playbackQueue || []).map(t => t.path),
        savedQueueIndex: audioEngine.queueIndex
      };
      localStorage.setItem('glasswave_state', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state:', e);
    }
  }
  window.glasswaveSaveState = saveState;

  setInterval(() => {
    if (audioEngine.isPlaying) saveState();
  }, 2500);

  // 3. Connect Native Library
  let libraryTracks = [];
  if (api) {
    try {
      libraryTracks = await api.getTracks();
      console.log('Loaded library tracks into UI:', libraryTracks.length);
      ui.setTracks(libraryTracks);
    } catch (e) {
      console.warn('Failed to fetch initial library tracks:', e);
    }

    try {
      if (api && typeof api.getCustomTags === 'function') {
        const cTags = await api.getCustomTags();
        if (Array.isArray(cTags) && cTags.length > 0) {
          ui.customTags = cTags;
          ui.renderTagPillBar();
          ui.renderSearchMoreTags();
          ui.renderModalCustomTags();
        }
      }
    } catch (e) {}

    try {
      const cfg = await api.getConfig();
      if (cfg) {
        if (localStorage.getItem('glasswave_autoplay') === null && cfg.autoplayOnLaunch !== undefined) {
          localStorage.setItem('glasswave_autoplay', cfg.autoplayOnLaunch !== false ? 'true' : 'false');
        }
        if (localStorage.getItem('glasswave_launch_shuffle') === null && cfg.launchShuffle !== undefined) {
          localStorage.setItem('glasswave_launch_shuffle', !!cfg.launchShuffle ? 'true' : 'false');
        }
        if (cfg.rememberProgress !== undefined) localStorage.setItem('glasswave_remember_progress', cfg.rememberProgress === true ? 'true' : 'false');
      }
    } catch (e) {}

    // Subscribe to live background file system changes (add/modify/delete)
    api.onLibraryUpdated((updatedTracks) => {
      console.log('Library updated in real-time, total songs:', updatedTracks.length);
      libraryTracks = updatedTracks;
      ui.setTracks(updatedTracks);
      // If queue is empty, populate from library; otherwise retain user's playback queue
      if (!audioEngine.playbackQueue || audioEngine.playbackQueue.length === 0) {
        audioEngine.playbackQueue = [...updatedTracks];
        ui.renderQueue();
      }
    });

    // Tray and media keyboard shortcuts
    api.onMediaPlayPause(() => audioEngine.togglePlayPause());
    api.onMediaNext(() => audioEngine.next());
    api.onMediaPrev(() => audioEngine.previous());
  }

  // 4. "双击即播放" Launch Logic
  function autoPlayOnStartup() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem('glasswave_state'));
    } catch (e) {}

    // Restore volume and mode
    if (saved) {
      if (saved.volume !== undefined) {
        audioEngine.setVolume(saved.volume);
        const slider = document.getElementById('volume-slider');
        if (slider) slider.value = saved.volume;
        if (ui && ui.updateVolumeSliderFill) {
          ui.updateVolumeSliderFill(saved.volume);
        }
      }
      if (saved.isShuffle !== undefined) {
        if (typeof audioEngine.setShuffle === 'function') {
          audioEngine.setShuffle(!!saved.isShuffle);
        } else {
          audioEngine.isShuffle = !!saved.isShuffle;
        }
        const btnShuffle = document.getElementById('btn-shuffle');
        if (btnShuffle) {
          btnShuffle.classList.toggle('active', audioEngine.isShuffle);
          btnShuffle.title = audioEngine.isShuffle ? '随机播放: 已开启 (向前记录历史，向后随机探索)' : '随机播放: 已关闭 (顺序播放)';
        }
      }
      if (saved.repeatMode) {
        audioEngine.repeatMode = saved.repeatMode;
        if (ui && ui.updateRepeatUI) {
          ui.updateRepeatUI();
        } else {
          const btnRepeat = document.getElementById('btn-repeat');
          if (btnRepeat) {
            btnRepeat.className = 'ctrl-btn mode-' + audioEngine.repeatMode + (audioEngine.repeatMode !== 'none' ? ' active' : '');
            if (audioEngine.repeatMode === 'all') btnRepeat.title = '循环模式: 全部循环 (列表循环)';
            else if (audioEngine.repeatMode === 'one') btnRepeat.title = '循环模式: 单曲循环 (当前歌曲无限循环)';
            else btnRepeat.title = '循环模式: 已关闭 (顺序播放 / 播放完停止)';
          }
        }
      }
      if (saved.eq) {
        if (saved.eq.enabled !== undefined) audioEngine.setEQEnabled(saved.eq.enabled);
        if (saved.eq.gains && Array.isArray(saved.eq.gains)) {
          saved.eq.gains.forEach((g, i) => audioEngine.setEQBand(i, g));
        }
        if (saved.eq.preset) audioEngine.eqPreset = saved.eq.preset;
      }
    }

    // A) If real library tracks exist
    if (libraryTracks && libraryTracks.length > 0) {
      let queueRestored = false;
      if (saved && Array.isArray(saved.savedQueuePaths) && saved.savedQueuePaths.length > 0) {
        const pathMap = new Map(libraryTracks.map(t => [t.path, t]));
        const restoredQueue = saved.savedQueuePaths.map(p => pathMap.get(p)).filter(Boolean);
        if (restoredQueue.length > 0) {
          audioEngine.playbackQueue = restoredQueue;
          queueRestored = true;
          if (typeof saved.savedQueueIndex === 'number' && saved.savedQueueIndex >= 0 && saved.savedQueueIndex < restoredQueue.length) {
            audioEngine.queueIndex = saved.savedQueueIndex;
          } else {
            audioEngine.queueIndex = 0;
          }
        }
      }

      if (!queueRestored) {
        audioEngine.playbackQueue = [...libraryTracks];
      }

      // Check settings for autoplay, launch shuffle, and remember progress
      let isAutoplay = true;
      let isLaunchShuffle = false;
      let isRememberProgress = false;

      try {
        const localAutoplay = localStorage.getItem('glasswave_autoplay');
        if (localAutoplay !== null) isAutoplay = localAutoplay === 'true';
        const localShuffle = localStorage.getItem('glasswave_launch_shuffle');
        if (localShuffle !== null) isLaunchShuffle = localShuffle === 'true';
        const localRemember = localStorage.getItem('glasswave_remember_progress');
        if (localRemember !== null) isRememberProgress = localRemember === 'true';
      } catch (e) {}

      // Mutual exclusion linkage: if launch shuffle is active, progress memory is strictly disabled
      if (isLaunchShuffle) {
        isRememberProgress = false;
      }

      let targetIndex = -1;
      if (isLaunchShuffle) {
        // Pick a random track from the current playback queue
        targetIndex = Math.floor(Math.random() * audioEngine.playbackQueue.length);
      } else {
        // Try restoring last played track
        if (saved && saved.lastTrackPath) {
          targetIndex = audioEngine.playbackQueue.findIndex(t => t.path === saved.lastTrackPath);
        }
        // If not found, fallback to 0 or random
        if (targetIndex === -1) {
          targetIndex = Math.floor(Math.random() * audioEngine.playbackQueue.length);
        }
      }

      audioEngine.queueIndex = targetIndex;
      const trackToPlay = audioEngine.playbackQueue[targetIndex];
      audioEngine.loadTrack(trackToPlay, isAutoplay);
      ui.renderQueue();

      // Restore seek position ONLY if NOT launchShuffle, rememberProgress is enabled, and saved.currentTime > 0
      if (!isLaunchShuffle && isRememberProgress && saved && saved.currentTime > 0) {
        setTimeout(() => audioEngine.seek(saved.currentTime), 150);
      }
      return;
    }

    // B) If library is fresh and empty: Fallback to ambient experience
    loadDemoAmbientTrack().catch(console.error);
  }

  async function loadDemoAmbientTrack() {
    let isAutoplay = true;
    try {
      const localAutoplay = localStorage.getItem('glasswave_autoplay');
      if (localAutoplay !== null) isAutoplay = localAutoplay === 'true';
    } catch (e) {}

    const demoTrack = await window.glasswaveAPI.getDemoTrack();
    if(!demoTrack) return;
    ui.setTracks(await window.glasswaveAPI.getTracks());

    audioEngine.playbackQueue = [demoTrack];
    audioEngine.queueIndex = 0;
    audioEngine.loadTrack(demoTrack, isAutoplay);
  }

  document.body.style.opacity = '1';
  try {
    autoPlayOnStartup();
  } catch (err) {
    console.error('autoPlayOnStartup error:', err);
  }
});
