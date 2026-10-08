/**
 * GlassWave Audio Engine
 * Hardware-accelerated Web Audio API architecture
 * Real-time FFT AnalyserNode (frequency & smoothed time-domain waveform)
 * Supports MP3, FLAC, WAV, AAC, M4A, OGG, OPUS
 */

class AudioEngine {
  constructor(audioElementId) {
    this.audio = document.getElementById(audioElementId);
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.gainNode = null;
    this.reverb = null;
    this.reverbPreset = 'off';
    try { this.reverbPreset = window.GlassWaveReverb?.preset(localStorage.getItem('glasswave_reverb_preset')).id || 'off'; } catch {}

    this.isPlaying = false;
    this.currentTrack = null;
    this.playbackQueue = [];
    this.playbackScope = { type: 'library' };
    this.queueIndex = -1;

    // Playback state & mode
    this.isShuffle = false;
    this.repeatMode = 'all'; // 'all', 'one', 'none'
    this.playMode = 'sequential'; // compatibility
    this.volume = 0.8;
    this.isMuted = false;

    // Poweramp-style Shuffle Playback Session & History Tracking:
    // - On track selection: reset shuffle session where selected track is #1 (history[0]).
    // - Next (往后一首): if in rewound history, advance forward; if at tip of history, pick random track from pool and append to history.
    // - Previous (往前一首): steps backward to previously played tracks in recorded history.
    // - If at history[0]: fixed/recorded as first track; rewinds to start of this track.
    this.shuffleHistory = [];
    this.shuffleHistoryIndex = -1;
    this.shufflePool = [];
    this._isInternalNav = false;
    this._lastPrevClickTime = 0;

    // Real-time audio buffers
    this.fftSize = 1024;
    this.frequencyData = new Uint8Array(this.fftSize / 2);
    this.timeDomainData = new Uint8Array(this.fftSize);

    // 7-Band Hardware Equalizer (BiquadFilterNode chain)
    this.eqFrequencies = [60, 150, 400, 1000, 2400, 6000, 15000];
    this.eqBandLabels = ['60Hz', '150Hz', '400Hz', '1kHz', '2.4kHz', '6kHz', '15kHz'];
    this.eqFilters = [];
    this.eqGains = [0, 0, 0, 0, 0, 0, 0]; // Default flat (0 dB)
    this.eqEnabled = true;
    this.eqPreset = 'flat';

    // Callbacks
    this.onStateChange = null;
    this.onTimeUpdate = null;
    this.onTrackChange = null;
    this.onEQChange = null;
    this.onQueueChange = null;

    this.initAudioElement();
  }

  ensureAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.82; // Fluid smoothing

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.volume;

      if (this.audio) {
        this.source = this.audioContext.createMediaElementSource(this.audio);

        // Build 7-Band EQ Filter nodes
        this.eqFilters = this.eqFrequencies.map((freq, idx) => {
          const filter = this.audioContext.createBiquadFilter();
          if (idx === 0) {
            filter.type = 'lowshelf';
          } else if (idx === this.eqFrequencies.length - 1) {
            filter.type = 'highshelf';
          } else {
            filter.type = 'peaking';
            filter.Q.value = 1.4;
          }
          filter.frequency.value = freq;
          filter.gain.value = this.eqEnabled ? this.eqGains[idx] : 0;
          return filter;
        });

        // Pipeline: source -> EQ Filter Chain -> analyser -> gainNode -> destination
        let prevNode = this.source;
        for (const filter of this.eqFilters) {
          prevNode.connect(filter);
          prevNode = filter;
        }
        if (window.GlassWaveReverb) {
          this.reverb = new window.GlassWaveReverb.Processor(this.audioContext, prevNode, this.analyser);
          this.reverb.select(this.reverbPreset);
        } else prevNode.connect(this.analyser);
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
      }
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  initAudioElement() {
    if (!this.audio) return;

    this.audio.volume = this.volume;

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange(true);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      if (this.onStateChange) this.onStateChange(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdate) {
        this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });

    this.audio.addEventListener('error', (err) => {
      console.warn('Audio playback error:', err);
    });
  }

  play() {
    this.ensureAudioContext();
    if (this.audio && this.audio.src) {
      return this.audio.play().catch(e => console.log('Autoplay deferred until user action:', e));
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seek(seconds) {
    if (this.audio && !isNaN(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    const targetGain = this.isMuted ? 0 : this.volume;
    if (this.gainNode && this.audioContext) {
      const t = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(t);
      // De-zippering: 25ms exponential parameter ramp eliminating clicks, pops, and current crackling in monitor headphones
      this.gainNode.gain.setTargetAtTime(targetGain, t, 0.025);
      // Keep audio element volume at 1.0 to prevent HTMLMediaElement internal stepping clicks & double attenuation
      if (this.audio && this.audio.volume !== 1) {
        this.audio.volume = 1;
      }
    } else if (this.audio) {
      this.audio.volume = targetGain;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const targetGain = this.isMuted ? 0 : this.volume;
    if (this.gainNode && this.audioContext) {
      const t = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(t);
      this.gainNode.gain.setTargetAtTime(targetGain, t, 0.025);
    } else if (this.audio) {
      this.audio.muted = this.isMuted;
    }
    return this.isMuted;
  }

  setEQBand(index, gainDb) {
    if (index < 0 || index >= this.eqFrequencies.length) return;
    const clamped = Math.max(-12, Math.min(12, Math.round(gainDb * 10) / 10));
    this.eqGains[index] = clamped;
    this.eqPreset = 'custom';
    if (this.eqFilters[index] && this.audioContext) {
      const targetVal = this.eqEnabled ? clamped : 0;
      this.eqFilters[index].gain.setTargetAtTime(targetVal, this.audioContext.currentTime, 0.02);
    }
    if (this.onEQChange) this.onEQChange(this.getEQState());
  }

  setEQEnabled(enabled) {
    this.eqEnabled = !!enabled;
    if (this.audioContext && this.eqFilters.length > 0) {
      this.eqFilters.forEach((filter, idx) => {
        const targetVal = this.eqEnabled ? this.eqGains[idx] : 0;
        filter.gain.setTargetAtTime(targetVal, this.audioContext.currentTime, 0.02);
      });
    }
    if (this.onEQChange) this.onEQChange(this.getEQState());
  }

  applyEQPreset(presetKey, customGains = null) {
    const defaultPresets = {
      flat: [0, 0, 0, 0, 0, 0, 0],
      bass: [6, 5, 3, 0, -1, 0, 1],
      vocal: [-2, -1, 2, 5, 4, 2, 0],
      warm: [4, 3, 1, 1, -1, -2, -3],
      electronic: [6, 4, 0, 2, 3, 5, 4],
      rock: [5, 3, -1, -2, 2, 4, 5],
      classical: [4, 2.5, 0, 0, 2, 3.5, 4],
      jazz: [4.5, 3, 0.5, 1.5, 2, 2.5, 3.5],
      acg: [5, 3.5, 1, 2, 3.5, 4.5, 5],
      treble: [-2, -1, 0, 1, 3.5, 5.5, 6],
      deepbass: [8, 6, 3, 0, -1, -2, -2.5],
      soft: [2.5, 1.5, 0, -0.5, 0.5, 1.5, 2]
    };

    let targetGains = null;
    if (customGains && Array.isArray(customGains) && customGains.length === this.eqFrequencies.length) {
      targetGains = customGains;
    } else if (defaultPresets[presetKey]) {
      targetGains = defaultPresets[presetKey];
    }

    if (!targetGains) return;
    this.eqPreset = presetKey;
    this.eqGains = targetGains.map(g => Math.max(-12, Math.min(12, parseFloat(g) || 0)));
    if (this.audioContext && this.eqFilters.length > 0) {
      this.eqFilters.forEach((filter, idx) => {
        const targetVal = this.eqEnabled ? this.eqGains[idx] : 0;
        filter.gain.setTargetAtTime(targetVal, this.audioContext.currentTime, 0.03);
      });
    }
    if (this.onEQChange) this.onEQChange(this.getEQState());
  }

  applyCustomEQ(gains, name = 'custom') {
    this.applyEQPreset(name, gains);
  }

  getEQState() {
    return {
      enabled: this.eqEnabled,
      preset: this.eqPreset,
      gains: [...this.eqGains],
      frequencies: [...this.eqFrequencies],
      labels: [...this.eqBandLabels]
    };
  }

  setShuffle(enabled) {
    this.isShuffle = !!enabled;
    if (this.isShuffle) {
      this.initShuffleSession(this.currentTrack);
    } else {
      this.shuffleHistory = [];
      this.shuffleHistoryIndex = -1;
      this.shufflePool = [];
    }
  }

  initShuffleSession(startingTrack = this.currentTrack) {
    if (!startingTrack && this.queueIndex >= 0 && this.playbackQueue[this.queueIndex]) {
      startingTrack = this.playbackQueue[this.queueIndex];
    }
    if (startingTrack) {
      this.shuffleHistory = [startingTrack];
      this.shuffleHistoryIndex = 0;
      if (this.playbackQueue && this.playbackQueue.length > 0) {
        const qIdx = this.playbackQueue.findIndex(t => (t.id && t.id === startingTrack.id) || t.path === startingTrack.path);
        if (qIdx !== -1) {
          this.queueIndex = qIdx;
        }
      }
    } else {
      this.shuffleHistory = [];
      this.shuffleHistoryIndex = -1;
    }
    this.resetShufflePool(startingTrack);
  }

  resetShufflePool(excludeTrack = null) {
    if (!Array.isArray(this.playbackQueue) || this.playbackQueue.length === 0) {
      this.shufflePool = [];
      return;
    }
    const excludePath = excludeTrack ? excludeTrack.path : (this.currentTrack ? this.currentTrack.path : null);
    this.shufflePool = this.playbackQueue.filter(t => !excludePath || t.path !== excludePath);
    if (this.shufflePool.length === 0 && this.playbackQueue.length > 0) {
      this.shufflePool = [...this.playbackQueue];
    }
  }

  playTrack(track, index = 0) {
    if (!track) return;
    this.queueIndex = index >= 0 ? index : 0;
    this.loadTrack(track, true);
  }

  loadTrack(track, autoStart = true) {
    this.ensureAudioContext();
    this.currentTrack = track;

    // Poweramp-style: Whenever a song is manually chosen (not internal next/previous navigation),
    // it automatically becomes the 1st song in the shuffle session (history[0]), with history recorded going forward.
    if (!this._isInternalNav && this.isShuffle && track) {
      this.initShuffleSession(track);
    }

    if (this.playbackQueue && this.playbackQueue.length > 0 && track) {
      const foundIdx = this.playbackQueue.findIndex(t => (t.id && t.id === track.id) || t.path === track.path);
      if (foundIdx !== -1) {
        this.queueIndex = foundIdx;
      }
    }

    if (this.audio && track && track.path) {
      // Robust local file / relative path URL resolution
      let fileUrl = track.path;
      if (!track.path.startsWith('http') && !track.path.startsWith('file://')) {
        if (/^[a-zA-Z]:/.test(track.path)) {
          const normalized = track.path.replace(/\\/g, '/');
          const encoded = encodeURI(normalized).replace(/#/g, '%23').replace(/\?/g, '%3F');
          fileUrl = `file:///${encoded.replace(/^file:\/\/\//, '')}`;
        } else {
          fileUrl = new URL(track.path, window.location.href).href;
        }
      }
      this.audio.src = fileUrl;
      this.audio.load();

      if (window.glasswaveAPI && window.glasswaveAPI.recordHistory) {
        window.glasswaveAPI.recordHistory(track.path);
      }

      if (this.onTrackChange) this.onTrackChange(track);
      if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
      if (autoStart) {
        this.play();
      }
    }
  }

  // Queue Operations
  playNow(track) {
    if (!track) return;
    const existingIdx = this.playbackQueue.findIndex(t => (t.id && t.id === track.id) || t.path === track.path);
    if (existingIdx !== -1) {
      this.queueIndex = existingIdx;
      this.loadTrack(this.playbackQueue[this.queueIndex], true);
    } else {
      const insertIdx = this.queueIndex >= 0 ? this.queueIndex + 1 : 0;
      this.playbackQueue.splice(insertIdx, 0, track);
      this.queueIndex = insertIdx;
      this.loadTrack(track, true);
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  playNext(track) {
    if (!track) return;
    if (this.playbackQueue.length === 0) {
      this.playbackQueue = [track];
      this.queueIndex = 0;
      this.loadTrack(track, true);
    } else {
      const insertIdx = this.queueIndex >= 0 ? this.queueIndex + 1 : 0;
      this.playbackQueue.splice(insertIdx, 0, track);
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  addToQueue(track) {
    if (!track) return;
    if (this.playbackQueue.length === 0) {
      this.playbackQueue = [track];
      this.queueIndex = 0;
      this.loadTrack(track, true);
    } else {
      this.playbackQueue.push(track);
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  removeFromQueue(index) {
    if (index < 0 || index >= this.playbackQueue.length) return;
    const isCurrent = index === this.queueIndex;
    const [removedTrack] = this.playbackQueue.splice(index, 1);
    if (this.shufflePool && removedTrack) {
      this.shufflePool = this.shufflePool.filter(t => t.path !== removedTrack.path);
    }
    if (isCurrent) {
      if (this.playbackQueue.length > 0) {
        this.queueIndex = Math.min(this.queueIndex, this.playbackQueue.length - 1);
        this.loadTrack(this.playbackQueue[this.queueIndex], true);
      } else {
        this.queueIndex = -1;
        this.currentTrack = null;
        if (this.audio) this.audio.src = '';
        this.isPlaying = false;
        if (this.onStateChange) this.onStateChange(false);
      }
    } else if (index < this.queueIndex) {
      this.queueIndex--;
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  reorderQueue(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= this.playbackQueue.length || toIndex < 0 || toIndex >= this.playbackQueue.length) return;
    const [moved] = this.playbackQueue.splice(fromIndex, 1);
    this.playbackQueue.splice(toIndex, 0, moved);

    if (this.queueIndex === fromIndex) {
      this.queueIndex = toIndex;
    } else if (fromIndex < this.queueIndex && toIndex >= this.queueIndex) {
      this.queueIndex--;
    } else if (fromIndex > this.queueIndex && toIndex <= this.queueIndex) {
      this.queueIndex++;
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  clearQueue() {
    if (this.currentTrack) {
      this.playbackQueue = [this.currentTrack];
      this.queueIndex = 0;
    } else {
      this.playbackQueue = [];
      this.queueIndex = -1;
    }
    if (this.isShuffle) {
      this.initShuffleSession(this.currentTrack);
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  restoreStartupQueue(libraryTracks, saved, categories = []) {
    // Search/filter results are a session queue, never the next launch's scope.
    // Resolve category membership afresh so additions/removals also take effect.
    const scope = saved?.playbackScope;
    const category = scope?.type === 'category' ? categories.find(c => c.id === scope.categoryId) : null;
    const members = category ? new Set(category.trackPaths || []) : null;
    let queue = members ? libraryTracks.filter(t => members.has(t.path)) : [];
    if (!queue.length || (saved?.lastTrackPath && !queue.some(t => t.path === saved.lastTrackPath))) {
      queue = [...libraryTracks];
      this.playbackScope = { type: 'library' };
    } else {
      this.playbackScope = { type: 'category', categoryId: category.id };
    }
    this.playbackQueue = queue;
    this.queueIndex = Math.max(0, queue.findIndex(t => t.path === saved?.lastTrackPath));
  }

  setReverbPreset(id) {
    this.reverbPreset = window.GlassWaveReverb?.preset(id).id || 'off';
    this.reverb?.select(this.reverbPreset);
    try { localStorage.setItem('glasswave_reverb_preset', this.reverbPreset); } catch {}
    return this.reverbPreset;
  }

  setQueue(tracks, startIndex = 0, scope = { type: 'library' }) {
    this.playbackScope = scope?.type === 'category'
      ? { type: 'category', categoryId: scope.categoryId } : { type: 'library' };
    this.playbackQueue = Array.isArray(tracks) ? [...tracks] : [];
    this.queueIndex = Math.max(0, Math.min(this.playbackQueue.length - 1, startIndex));
    if (this.isShuffle && this.playbackQueue[this.queueIndex] && !this._isInternalNav) {
      this.initShuffleSession(this.playbackQueue[this.queueIndex]);
    }
    if (this.onQueueChange) this.onQueueChange(this.playbackQueue, this.queueIndex);
  }

  handleTrackEnded() {
    if (this.repeatMode === 'one' && !this.isShuffle) {
      this.seek(0);
      this.play();
    } else {
      this.next();
    }
  }

  next() {
    if (this.playbackQueue.length === 0) return { action: 'none' };

    if (this.isShuffle) {
      // 1. If we previously rewound into history, forward traverses existing history
      if (Array.isArray(this.shuffleHistory) && this.shuffleHistoryIndex >= 0 && this.shuffleHistoryIndex < this.shuffleHistory.length - 1) {
        this.shuffleHistoryIndex++;
        const targetTrack = this.shuffleHistory[this.shuffleHistoryIndex];
        const qIdx = this.playbackQueue.findIndex(t => (t.id && t.id === targetTrack.id) || t.path === targetTrack.path);
        if (qIdx !== -1) {
          this.queueIndex = qIdx;
        }
        this._isInternalNav = true;
        this.loadTrack(targetTrack, true);
        this._isInternalNav = false;
        return { action: 'history_forward', index: this.shuffleHistoryIndex, track: targetTrack };
      }

      // 2. We are at the tip of the history: pick a new random track from unplayed pool
      if (this.playbackQueue.length > 1) {
        if (!Array.isArray(this.shufflePool) || this.shufflePool.length === 0) {
          this.resetShufflePool(this.currentTrack);
        }

        let nextTrack = null;
        if (this.shufflePool.length > 0) {
          const randIdx = Math.floor(Math.random() * this.shufflePool.length);
          nextTrack = this.shufflePool.splice(randIdx, 1)[0];
        }

        // Fallback safety
        if (!nextTrack) {
          let nextIdx = this.queueIndex;
          let attempts = 0;
          while (nextIdx === this.queueIndex && attempts < 10) {
            nextIdx = Math.floor(Math.random() * this.playbackQueue.length);
            attempts++;
          }
          nextTrack = this.playbackQueue[nextIdx];
        }

        if (nextTrack) {
          const qIdx = this.playbackQueue.findIndex(t => (t.id && t.id === nextTrack.id) || t.path === nextTrack.path);
          if (qIdx !== -1) {
            this.queueIndex = qIdx;
          }
          if (!Array.isArray(this.shuffleHistory)) {
            this.shuffleHistory = [];
          }
          this.shuffleHistory.push(nextTrack);
          this.shuffleHistoryIndex = this.shuffleHistory.length - 1;

          this._isInternalNav = true;
          this.loadTrack(nextTrack, true);
          this._isInternalNav = false;
          return { action: 'random_next', index: this.shuffleHistoryIndex, track: nextTrack };
        }
      } else if (this.playbackQueue.length === 1) {
        this.seek(0);
        this.play();
        return { action: 'replay_single', track: this.currentTrack };
      }
    }

    // Normal sequential playback
    this.queueIndex = (this.queueIndex + 1) % this.playbackQueue.length;
    this.loadTrack(this.playbackQueue[this.queueIndex], true);
    return { action: 'sequential_next', index: this.queueIndex, track: this.playbackQueue[this.queueIndex] };
  }

  previous(forcePrevious = false) {
    if (this.playbackQueue.length === 0) return { action: 'none' };

    const now = Date.now();
    const isDoublePrev = (now - (this._lastPrevClickTime || 0) < 2000);
    this._lastPrevClickTime = now;

    // Standard audio behavior: if played more than 3 seconds and not a double-click/forced, replay current track
    if (!forcePrevious && !isDoublePrev && this.audio && this.audio.currentTime > 3) {
      this.seek(0);
      return { action: 'seek_zero', currentTime: 0 };
    }

    if (this.isShuffle) {
      // In shuffle mode: navigate back in shuffleHistory
      if (Array.isArray(this.shuffleHistory) && this.shuffleHistoryIndex > 0) {
        this.shuffleHistoryIndex--;
        const targetTrack = this.shuffleHistory[this.shuffleHistoryIndex];
        const qIdx = this.playbackQueue.findIndex(t => (t.id && t.id === targetTrack.id) || t.path === targetTrack.path);
        if (qIdx !== -1) {
          this.queueIndex = qIdx;
        }
        this._isInternalNav = true;
        this.loadTrack(targetTrack, true);
        this._isInternalNav = false;
        return { action: 'history_previous', index: this.shuffleHistoryIndex, track: targetTrack };
      } else {
        // At the very first song of the shuffle session (PowerAmp style: "默认为第一首，往后是随机的，往前则有记录、固定，能倒退回上一首的状态")
        // No prior history to rewind to; restart this initial track from 0
        this.seek(0);
        this.play();
        return { action: 'start_of_shuffle', index: 0, track: this.currentTrack };
      }
    }

    // Normal sequential playback
    this.queueIndex = (this.queueIndex - 1 + this.playbackQueue.length) % this.playbackQueue.length;
    this.loadTrack(this.playbackQueue[this.queueIndex], true);
    return { action: 'sequential_previous', index: this.queueIndex, track: this.playbackQueue[this.queueIndex] };
  }

  // Get real-time audio analytics
  getAudioData() {
    if (!this.analyser || !this.isPlaying) {
      // Return resting state when paused or idle
      return {
        frequency: this.frequencyData.fill(0),
        timeDomain: this.timeDomainData.fill(128),
        bassEnergy: 0,
        midEnergy: 0,
        highEnergy: 0
      };
    }

    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Compute band energy
    let bassSum = 0, midSum = 0, highSum = 0;
    const binCount = this.frequencyData.length;

    const bassEnd = Math.floor(binCount * 0.08); // Sub-bass and bass
    const midEnd = Math.floor(binCount * 0.40);  // Mids

    for (let i = 0; i < bassEnd; i++) bassSum += this.frequencyData[i];
    for (let i = bassEnd; i < midEnd; i++) midSum += this.frequencyData[i];
    for (let i = midEnd; i < binCount; i++) highSum += this.frequencyData[i];

    return {
      frequency: this.frequencyData,
      timeDomain: this.timeDomainData,
      bassEnergy: (bassSum / (bassEnd * 255)),
      midEnergy: (midSum / ((midEnd - bassEnd) * 255)),
      highEnergy: (highSum / ((binCount - midEnd) * 255))
    };
  }
}

window.AudioEngine = AudioEngine;
