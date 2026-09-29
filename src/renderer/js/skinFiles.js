(() => {
  const eligible=k=>/^(glasswave_(bg_|glow_|vis_|visual_|visualizer_|display_|skin_theme$|pure_color$|custom_bg$|desktop_reveal$|desktop_frost$|desktop_blur_px$|window_glass_ratio$|interface_theme_v1$|compact_sidebar_nav$)|gw_sidebar_collapsed$)/.test(k);
  const legacyDesktopBlur=k=>k==='glasswave_desktop_frost'||k==='glasswave_desktop_blur_px';
  const pendingModeKey='glasswave_skin_pending_ui_mode';
  function capture(ui,includePresets=false){const settings={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(eligible(k)&&!legacyDesktopBlur(k))settings[k]=localStorage.getItem(k);}settings.glasswave_visual_tuning=JSON.stringify(ui.visualizer.tuning);const runtime={mouseParallax:document.getElementById('setting-parallax')?.checked!==false,mode:ui.visualizer.mode,intensity:ui.visualizer.intensity,position:ui.visualizer.positionPreset,offsetY:ui.visualizer.offsetY,scale:ui.visualizer.visScale};let presets=[];if(includePresets)try{presets=JSON.parse(localStorage.getItem('glasswave_user_presets')||'[]');}catch{}return {settings,runtime,...(includePresets?{presets}:{})};}
  async function apply(data){
    if(!data||!data.settings||!data.runtime)throw Error('皮肤数据不完整');
    for(const [k,v] of Object.entries(data.settings))if(!eligible(k)||typeof v!=='string')throw Error('皮肤包含不支持的设置');
    if(!['wave','spectrum','sphere','bars','orb','ambient','reactive','curtain'].includes(data.runtime.mode)||!['behind','below','center'].includes(data.runtime.position)||!['intensity','offsetY','scale'].every(k=>Number.isFinite(data.runtime[k])))throw Error('视觉参数无效');
    if(data.presets&&!Array.isArray(data.presets))throw Error('预设列表无效');
    const before={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);before[k]=localStorage.getItem(k);}
    const currentMode={zen:document.body.classList.contains('zen-mode'),mini:document.body.classList.contains('mini-bar-mode'),fullscreen:document.body.classList.contains('visualizer-fullscreen-active')};
    try{
      sessionStorage.setItem(pendingModeKey,JSON.stringify(currentMode));
      for(const k of Object.keys(before))if(eligible(k))localStorage.removeItem(k);
      for(const [k,v] of Object.entries(data.settings))if(!legacyDesktopBlur(k))localStorage.setItem(k,v);
      if(data.presets)localStorage.setItem('glasswave_user_presets',JSON.stringify(data.presets));
      localStorage.setItem('glasswave_skin_pending_runtime',JSON.stringify(data.runtime));
      const modeControls=JSON.parse(data.settings.glasswave_visualizer_mode_controls_v1||'null')||{[data.runtime.mode]:{intensity:data.runtime.intensity,position:data.runtime.position,offsetY:data.runtime.offsetY,scale:data.runtime.scale}};
      await glasswaveAPI.saveConfig({mouseParallax:data.runtime.mouseParallax!==false,visualizerIntensity:data.runtime.intensity,visualizerPosition:data.runtime.position,visualizerOffsetY:data.runtime.offsetY,visualizerScale:data.runtime.scale,visualizerModeControls:modeControls});
    }catch(e){
      sessionStorage.removeItem(pendingModeKey);
      localStorage.clear();for(const [k,v] of Object.entries(before))localStorage.setItem(k,v);
      throw e;
    }
    location.reload();
  }
  function restore(ui){
    let runtime,mode;
    try{runtime=JSON.parse(localStorage.getItem('glasswave_skin_pending_runtime')||'null');}catch{}
    try{mode=JSON.parse(sessionStorage.getItem(pendingModeKey)||'null');}catch{}
    localStorage.removeItem('glasswave_skin_pending_runtime');
    sessionStorage.removeItem(pendingModeKey);
    if(runtime){
      ui.switchVisualizerMode(runtime.mode);ui.visualizer.setIntensity(runtime.intensity);
      ui.visualizer.setPositionPreset(runtime.position);ui.visualizer.setOffsetY(runtime.offsetY);ui.visualizer.setScale(runtime.scale);
      ui.saveVisualizerModeControls({intensity:runtime.intensity,position:runtime.position,offsetY:runtime.offsetY,scale:runtime.scale});
      ui.selectVisualizerTuneMode?.(runtime.mode,false);
      document.querySelectorAll('.vis-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===runtime.mode));
      ui.syncVisualizerTuningUI();ui.syncVisualizerCustomizationUI();
    }
    if(mode){
      if(mode.mini)document.body.classList.add('mini-bar-mode');
      if(mode.zen)ui.toggleZenMode(true);
      if(mode.fullscreen)ui.enterVisualizerFullscreen();
      ui.visualizer?.performSyncResize?.();
    }
  }
  function initManager(ui, fileSection) {
    const drawer = document.getElementById('view-settings');
    const page = document.createElement('section'); page.id = 'skin-manager-page'; page.setAttribute('aria-label', '自定义皮肤管理');
    page.innerHTML = '<div class="skin-manager-toolbar"><button id="skin-manager-back" class="glass-pill-btn">‹ 返回</button><strong>自定义皮肤</strong><button id="skin-manager-save" class="glass-pill-btn">保存当前</button><details id="skin-manager-more"><summary>更多</summary></details></div><input id="skin-search" type="search" placeholder="搜索皮肤名称" aria-label="搜索皮肤名称"><div id="skin-manager-scroll"></div>';
    drawer.appendChild(page);
    const grid = document.getElementById('custom-preset-grid'); grid.hidden = false;
    page.querySelector('#skin-manager-scroll').appendChild(grid);
    page.querySelector('#skin-manager-more').appendChild(fileSection);
    const main = document.getElementById('settings-panel-main');
    document.getElementById('btn-manage-skins').onclick = () => { drawer.classList.add('skin-manager-open'); main.inert = true; ui.renderCustomPresets(); page.querySelector('#skin-search').focus(); };
    page.querySelector('#skin-manager-back').onclick = () => { drawer.classList.remove('skin-manager-open'); main.inert = false; page.querySelector('#skin-manager-more').open = false; document.getElementById('btn-manage-skins').focus(); };
    page.querySelector('#skin-manager-save').onclick = () => document.getElementById('btn-save-custom-preset').click();
    page.querySelector('#skin-search').oninput = () => ui.renderCustomPresets();
    page.addEventListener('toggle', e => { if (e.target.matches('details') && e.target.open) page.querySelectorAll('details[open]').forEach(d => { if(d !== e.target) d.open = false; }); }, true);
    ui.renderCustomPresets();
  }
  function init(ui){const parent=document.getElementById('interface-color-settings');if(!parent)return;const section=document.createElement('section');section.className='setting-item';section.style.cssText='display:flex;flex-direction:column;gap:10px;align-items:stretch';section.innerHTML='<div class="setting-title">完整皮肤文件</div><div class="setting-desc">保存当前外观和已有自存皮肤，包含背景图片、透明度、配色与动态效果。导入会重新载入界面。</div><div style="display:flex;gap:8px"><button id="skin-export" class="glass-pill-btn">一键导出皮肤文件</button><button id="skin-import" class="glass-pill-btn">导入并应用</button></div><div id="skin-file-status" role="status"></div>';parent.after(section);initManager(ui,section);const status=section.querySelector('#skin-file-status');section.querySelector('#skin-export').onclick=async()=>{try{ui.visualizer.saveTuning();const result=await glasswaveAPI.exportSkinFile(capture(ui,true));status.textContent=result?.canceled?'已取消':result?.error?result.error:'已导出完整皮肤（包含图片）';}catch(e){status.textContent=e.message;}};section.querySelector('#skin-import').onclick=async()=>{try{const r=await glasswaveAPI.importSkinFile();if(r?.error)throw Error(r.error);if(r&&!r.canceled)await apply(r.data);}catch(e){status.textContent=e.message;}};
const cover=document.getElementById('album-wrap');if(cover){cover.draggable=false;cover.querySelectorAll('img').forEach(img=>img.draggable=false);cover.addEventListener('dragstart',e=>{e.preventDefault();e.stopPropagation();},true);cover.addEventListener('pointerdown',e=>{if(e.button===0)e.stopPropagation();});}
  }
  window.GlassWaveSkin={capture,apply,restore,init};
})();
