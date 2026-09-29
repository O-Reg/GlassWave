(() => {
  const STORAGE_KEY = 'glasswave_shortcuts_v1';
  const ACTIONS = [
    { id: 'playPause', label: '播放 / 暂停', group: '播放', initial: 'Space' },
    { id: 'next', label: '下一首', group: '播放', initial: 'Ctrl+ArrowRight' },
    { id: 'previous', label: '上一首', group: '播放', initial: 'Ctrl+ArrowLeft' },
    { id: 'volumeUp', label: '音量增加 5%', group: '音量', initial: 'ArrowUp', repeat: true },
    { id: 'volumeDown', label: '音量降低 5%', group: '音量', initial: 'ArrowDown', repeat: true },
    { id: 'fullscreen', label: '切换全屏', group: '窗口', initial: 'F11' },
    { id: 'zen', label: '切换极简模式', group: '窗口', initial: 'KeyZ' },
    { id: 'mini', label: '切换迷你模式', group: '窗口', initial: 'KeyM' },
    { id: 'pin', label: '切换置顶', group: '窗口', initial: 'KeyP' },
    { id: 'nextSkin', label: '切换皮肤（保持窗口模式）', group: '皮肤', initial: 'Ctrl+Shift+KeyS' }
  ];
  const DEFAULTS = Object.fromEntries(ACTIONS.map(action => [action.id, action.initial]));
  const MODIFIERS = ['Ctrl', 'Alt', 'Shift'];
  const VALID_CODES = /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F(?:[1-9]|1[0-2])|Arrow(?:Up|Down|Left|Right)|Space|Home|End|PageUp|PageDown|Comma|Period|Minus|Equal|BracketLeft|BracketRight|Slash|Backslash|Semicolon|Quote|Backquote)$/;
  const CODE_LABELS = {
    Space: '空格', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    PageUp: 'Page Up', PageDown: 'Page Down', BracketLeft: '[', BracketRight: ']',
    Comma: ',', Period: '.', Minus: '-', Equal: '=', Slash: '/', Backslash: '\\',
    Semicolon: ';', Quote: "'", Backquote: String.fromCharCode(96)
  };
  let bindings = load();
  let ui = null;
  let page = null;
  let recording = null;
  let bound = false;
  let skinSwitching = false;
  const QUICK_SKIN_KEY = 'glasswave_quick_skin_pair_v1';

  function chordFromEvent(event) {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    return [...modifiers, event.code].join('+');
  }
  function validChord(chord) {
    if (typeof chord !== 'string') return false;
    const parts = chord.split('+');
    const code = parts.pop();
    if (!VALID_CODES.test(code) || parts.length > 3) return false;
    if (parts.join('+') !== MODIFIERS.filter(modifier => parts.includes(modifier)).join('+')) return false;
    if (parts.includes('Alt') && code === 'F4') return false;
    if (parts.includes('Ctrl') && ['KeyR', 'KeyW'].includes(code)) return false;
    if (parts.includes('Ctrl') && parts.includes('Shift') && ['KeyI', 'KeyJ', 'KeyC'].includes(code)) return false;
    return true;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return { ...DEFAULTS };
      const merged = Object.fromEntries(ACTIONS.map(action => [action.id, saved[action.id] ?? action.initial]));
      if (Object.values(merged).some(chord => !validChord(chord))) return { ...DEFAULTS };
      if (new Set(Object.values(merged)).size !== ACTIONS.length) return { ...DEFAULTS };
      return merged;
    } catch { return { ...DEFAULTS }; }
  }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings)); } catch {} }
  function formatChord(chord) {
    const parts = chord.split('+');
    const code = parts.pop();
    const label = CODE_LABELS[code] || code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, '小键盘 ');
    return [...parts, label].join(' + ');
  }
  function message(text, error = false) {
    const feedback = page?.querySelector('#shortcut-feedback');
    if (!feedback) return;
    feedback.textContent = text;
    feedback.classList.toggle('error', error);
  }
  function render() {
    const list = page?.querySelector('#shortcut-list');
    if (!list) return;
    list.replaceChildren();
    let group = '';
    for (const action of ACTIONS) {
      if (action.group !== group) {
        group = action.group;
        const heading = document.createElement('h3');
        heading.className = 'shortcut-group-title';
        heading.textContent = group;
        list.append(heading);
      }
      const row = document.createElement('div');
      row.className = 'shortcut-row';
      row.dataset.action = action.id;
      const label = document.createElement('span');
      label.className = 'shortcut-action';
      label.textContent = action.label;
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'shortcut-key';
      key.textContent = recording === action.id ? '按下新组合键…' : formatChord(bindings[action.id]);
      key.setAttribute('aria-label', '修改' + action.label + '的快捷键');
      key.addEventListener('click', () => {
        recording = action.id;
        message('请按下新快捷键；Esc 取消。');
        render();
        page.querySelector('.shortcut-row[data-action="' + action.id + '"] .shortcut-key')?.focus();
      });
      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'shortcut-reset';
      reset.textContent = '重置';
      reset.setAttribute('aria-label', '重置' + action.label + '的快捷键');
      reset.addEventListener('click', () => {
        const occupied = ACTIONS.find(other => other.id !== action.id && bindings[other.id] === action.initial);
        if (occupied) { message('默认按键已被“' + occupied.label + '”占用，请先修改它或重置全部。', true); return; }
        recording = null;
        bindings[action.id] = action.initial;
        save();
        render();
        message('已恢复“' + action.label + '”的默认按键。');
      });
      row.append(label, key, reset);
      list.append(row);
    }
  }
  function capture(event) {
    if (!recording) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.key === 'Escape') { recording = null; render(); message('已取消修改。'); return; }
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return;
    if (event.metaKey) { message('Windows 键组合由系统保留，请换一个。', true); return; }
    const chord = chordFromEvent(event);
    if (!validChord(chord)) { message('这个组合由系统或软件保留，请换一个字母、数字、方向键或 F 键。', true); return; }
    const occupied = ACTIONS.find(action => action.id !== recording && bindings[action.id] === chord);
    if (occupied) { message('与“' + occupied.label + '”冲突，请换一个组合。', true); return; }
    const action = ACTIONS.find(item => item.id === recording);
    bindings[recording] = chord;
    recording = null;
    save();
    render();
    message('已将“' + action.label + '”设为 ' + formatChord(chord) + '。');
  }
  async function toggleQuickSkin() {
    if (skinSwitching || localStorage.getItem('glasswave_skin_pending_runtime')) return;
    skinSwitching = true;
    try {
      const presets = ui.getSavedPresets().filter(preset => preset && preset.id);
      if (!presets.length) { message('请先保存至少一套皮肤。', true); return; }
      const currentId = localStorage.getItem('glasswave_selected_skin');
      let pair = null;
      try { pair = JSON.parse(sessionStorage.getItem(QUICK_SKIN_KEY) || 'null'); } catch {}
      const target = pair && presets.find(preset => preset.id === pair.targetId);

      if (pair && target && currentId === pair.targetId && pair.origin) {
        if (pair.originId) localStorage.setItem('glasswave_selected_skin', pair.originId);
        else localStorage.removeItem('glasswave_selected_skin');
        try { await window.GlassWaveSkin.apply(pair.origin); }
        catch (error) {
          localStorage.setItem('glasswave_selected_skin', currentId);
          throw error;
        }
        return;
      }
      if (pair && target && currentId === pair.originId) {
        if (!await ui.applyCustomPreset(target)) throw Error('目标皮肤未能载入');
        return;
      }

      const index = presets.findIndex(preset => preset.id === currentId);
      const next = presets[(index + 1) % presets.length];
      const cached = await window.glasswaveAPI.cacheSkin(window.GlassWaveSkin.capture(ui, false));
      if (cached?.error || !cached?.data) throw Error(cached?.error || '无法保存当前皮肤作为切换起点');
      pair = { originId: index >= 0 ? currentId : null, targetId: next.id, origin: cached.data };
      sessionStorage.setItem(QUICK_SKIN_KEY, JSON.stringify(pair));
      if (!await ui.applyCustomPreset(next)) sessionStorage.removeItem(QUICK_SKIN_KEY);
    } catch (error) {
      console.error('切换皮肤失败:', error);
      message(error.message || '切换皮肤失败', true);
    } finally {
      skinSwitching = false;
    }
  }
  function runAction(id) {
    switch (id) {
      case 'playPause': ui.audioEngine.togglePlayPause(); break;
      case 'next': ui.audioEngine.next(); break;
      case 'previous': ui.audioEngine.previous(); break;
      case 'volumeUp':
      case 'volumeDown': {
        const volume = Math.max(0, Math.min(1, ui.audioEngine.volume + (id === 'volumeUp' ? 0.05 : -0.05)));
        ui.audioEngine.setVolume(volume);
        const slider = document.getElementById('volume-slider');
        if (slider) slider.value = volume;
        ui.updateVolumeSliderFill(volume);
        ui.showVolumeSliderTooltip(Math.round(volume * 100));
        break;
      }
      case 'fullscreen': ui.toggleVisualizerFullscreen(); break;
      case 'zen': ui.toggleZenMode(); break;
      case 'mini': ui.toggleMiniMode(); break;
      case 'pin': ui.cyclePinMode(); break;
      case 'nextSkin': toggleQuickSkin(); break;
    }
  }
  function handle(event) {
    if (!ui || recording || event.defaultPrevented || event.isComposing || event.metaKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest('input, textarea, select, [contenteditable], [role="textbox"]')) return;
    if (target instanceof Element && target.closest('button') && !event.ctrlKey && !event.altKey && !event.shiftKey && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) return;
    const action = ACTIONS.find(item => bindings[item.id] === chordFromEvent(event));
    if (!action) return;
    if (action.id === 'nextSkin' && !document.hasFocus()) return;
    event.preventDefault();
    if (event.repeat && !action.repeat) return;
    runAction(action.id);
  }
  function bind(instance) {
    ui = instance;
    if (bound) return;
    bound = true;
    window.addEventListener('keydown', handle);
    window.addEventListener('keydown', capture, true);
  }
  function closePage(focus = true) {
    if (!page) return false;
    recording = null;
    const drawer = document.getElementById('view-settings');
    if (!drawer.classList.contains('shortcuts-page-open')) return false;
    drawer.classList.remove('shortcuts-page-open');
    document.getElementById('settings-panel-main').inert = false;
    page.setAttribute('aria-hidden', 'true');
    render();
    if (focus && drawer.classList.contains('open')) document.getElementById('btn-manage-shortcuts')?.focus();
    return true;
  }
  function initMenu(instance) {
    ui = instance;
    const drawer = document.getElementById('view-settings');
    const panel = document.getElementById('settings-panel-main');
    if (!drawer || !panel || page) return;
    const entry = document.createElement('section');
    entry.id = 'shortcut-entry';
    entry.className = 'setting-item shortcut-entry';
    entry.innerHTML = '<div class="setting-info"><div class="setting-title">快捷键</div><div class="setting-desc">查看播放、音量、窗口与皮肤操作的按键</div></div><button type="button" class="glass-pill-btn" id="btn-manage-shortcuts">查看 / 修改 ›</button>';
    panel.append(entry);
    page = document.createElement('section');
    page.id = 'shortcut-page';
    page.setAttribute('aria-label', '快捷键设置');
    page.setAttribute('aria-hidden', 'true');
    page.innerHTML = '<div class="shortcut-page-toolbar"><button type="button" class="glass-pill-btn" id="shortcut-page-back">‹ 返回</button><strong>快捷键</strong><button type="button" class="glass-pill-btn" id="shortcut-reset-all">全部重置</button></div><div class="shortcut-page-scroll"><p class="setting-desc">点击按键即可修改。快捷切换在普通、极简和条状模式都可用，会在两套皮肤间往返并保持当前窗口模式；仅播放器获得焦点时生效。</p><div id="shortcut-list"></div><p class="setting-desc shortcut-fixed">固定操作：Esc 关闭菜单或退出全屏；键盘媒体键控制播放、上一首和下一首。</p></div><div id="shortcut-feedback" role="status" aria-live="polite"></div>';
    drawer.append(page);
    entry.querySelector('#btn-manage-shortcuts').addEventListener('click', () => {
      drawer.classList.add('shortcuts-page-open');
      panel.inert = true;
      page.setAttribute('aria-hidden', 'false');
      message('');
      render();
      page.querySelector('#shortcut-page-back').focus();
    });
    page.querySelector('#shortcut-page-back').addEventListener('click', () => closePage());
    page.querySelector('#shortcut-reset-all').addEventListener('click', () => {
      recording = null;
      bindings = { ...DEFAULTS };
      save();
      render();
      message('所有快捷键已恢复默认。');
    });
    render();
  }
  window.GlassWaveShortcuts = { bind, initMenu, closePage, getBindings: () => ({ ...bindings }) };
})();
