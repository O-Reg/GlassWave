(() => {
  const KEY='glasswave_interface_theme_v1';
  const presets={dark:{name:'深色玻璃',background:'#080c16',panel:'#121622',accent:'#8ac4ff',selection:'#29466b'},light:{name:'浅色玻璃',background:'#f5f7fa',panel:'#ffffff',accent:'#2563eb',selection:'#dbeafe'},warm:{name:'暖白纸感',background:'#f4efe5',panel:'#fffaf0',accent:'#936028',selection:'#ead7b9'},blue:{name:'冷灰蓝',background:'#e9eff5',panel:'#dce5ee',accent:'#195ba6',selection:'#bbd4ed'},cover:{name:'跟随封面',background:'#080c16',panel:'#121622',accent:'#8ac4ff',selection:'#29466b'}};
  const valid=s=>/^#[0-9a-f]{6}$/i.test(s||'');
  const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const ink=h=>{const v=rgb(h).map(c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return (.2126*v[0]+.7152*v[1]+.0722*v[2])>.179?'#172033':'#f8fafc';};
  const base={enabled:false,preset:'dark',...presets.dark,separate:false,sidebar:'#121622',topbar:'#121622',playerbar:'#121622',profiles:[]};
  let state={...base},section,scheduled=0;
  try{state={...base,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{}
  for(const k of ['background','panel','accent','selection','sidebar','topbar','playerbar'])if(!valid(state[k]))state[k]=base[k];
  if(!Array.isArray(state.profiles))state.profiles=[];
  function apply(){
    document.body.classList.toggle('ui-custom-colors',!!state.enabled);
    document.body.classList.toggle('ui-light-glass',!!state.enabled&&state.preset==='light');
    const style=document.body.style,set=(k,v)=>style.setProperty('--ui-'+k,v);
    for(const k of ['background','panel','accent','selection','sidebar','topbar','playerbar']){
      const color=['sidebar','topbar','playerbar'].includes(k)&&!state.separate?state.panel:state[k];
      set(k,color);set(k+'-rgb',rgb(color).join(','));set(k+'-ink',ink(color));
    }
    set('muted',ink(state.panel)==='#172033'?'#526176':'#adb9ca');
    set('track',ink(state.panel)==='#172033'?'#8997a8':'#607087');
    set('border',ink(state.panel)==='#172033'?'rgba(20,35,55,.25)':'rgba(235,245,255,.24)');
    const logo=document.querySelector('.brand-logo-icon');
    if(logo){
      const surface=state.separate?state.topbar:state.panel;
      const onLight=state.enabled&&ink(surface)==='#172033';
      const image=onLight?'assets/brand-on-light.png':'assets/brand-on-dark.png';
      if(logo.getAttribute('src')!==image)logo.setAttribute('src',image);
      logo.dataset.appearance=onLight?'light':'dark';
    }
    localStorage.setItem(KEY,JSON.stringify(state));
  }
  function refresh(){if(!section)return;section.querySelector('#ui-colors-enabled').checked=state.enabled;section.querySelector('#ui-color-preset').value=presets[state.preset]?state.preset:'custom';section.querySelector('#ui-colors-separate').checked=state.separate;section.querySelector('#ui-color-individual').hidden=!state.separate;
    for(const el of section.querySelectorAll('[data-color]'))el.value=state[el.dataset.color];
    const list=section.querySelector('#ui-saved-themes');list.replaceChildren(new Option('选择已保存配色',''));
    state.profiles.forEach((p,i)=>list.add(new Option(p.name,String(i))));
  }
  function queueApply(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;apply();});}
  function usePreset(key){if(!presets[key])return;Object.assign(state,presets[key],{preset:key,enabled:true,separate:false});for(const k of ['sidebar','topbar','playerbar'])state[k]=state.panel;apply();refresh();if(key==='cover')followCover();}
  function followCover(){if(state.preset!=='cover'||!state.enabled)return;const img=document.getElementById('current-cover');if(!img?.naturalWidth)return;try{const c=document.createElement('canvas');c.width=c.height=12;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,12,12);const d=ctx.getImageData(0,0,12,12).data;let sums=[0,0,0],n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]<128)continue;for(let k=0;k<3;k++)sums[k]+=d[i+k];n++;}if(!n)return;const hex=sums.map(v=>Math.round(Math.max(75,Math.min(225,v/n*1.25))).toString(16).padStart(2,'0')).join('');state.accent='#'+hex;state.selection='#'+sums.map(v=>Math.round(v/n*.45).toString(16).padStart(2,'0')).join('');apply();refresh();}catch{/* Local inaccessible artwork keeps the current palette. */}}
  function init(){
    const panel=document.getElementById('settings-panel-main');if(!panel||document.getElementById('interface-color-settings'))return;
    section=document.createElement('section');section.id='interface-color-settings';section.className='setting-item';
    section.innerHTML='<div class="setting-title">界面配色</div><div class="setting-desc">文字与图标自动适配深浅；配色和通透度分别控制。图片、封面及波形使用各自的颜色设置。</div><label><input id="ui-colors-enabled" type="checkbox"> 启用自定义配色</label><label class="ui-theme-row">配色预设<select id="ui-color-preset" class="glass-select"></select></label><div id="ui-color-fields"></div><details><summary>分别设置面板</summary><label><input id="ui-colors-separate" type="checkbox"> 使用各栏独立颜色</label><div id="ui-color-individual"></div></details><div class="ui-theme-save"><input id="ui-theme-name" placeholder="我的配色名称" maxlength="24"><button id="ui-theme-save" class="glass-pill-btn">保存配色</button></div><div class="ui-theme-save"><select id="ui-saved-themes" class="glass-select"></select><button id="ui-theme-load" class="glass-pill-btn">应用</button><button id="ui-theme-delete" class="glass-pill-btn">删除</button></div><button id="ui-theme-reset" class="glass-pill-btn">恢复深色默认</button><div id="ui-theme-status" role="status"></div>';
    const ps=section.querySelector('#ui-color-preset');for(const [key,p] of Object.entries(presets))ps.add(new Option(p.name,key));ps.add(new Option('自定义','custom'));
    for(const [key,label] of [['background','背景色'],['panel','统一面板色'],['accent','强调 / 进度色'],['selection','歌曲选中色'],['sidebar','侧栏色'],['topbar','顶部栏色'],['playerbar','播放栏色']]){
      const row=document.createElement('div');row.className='ui-theme-row';const title=document.createElement('label');title.textContent=label;title.htmlFor='ui-color-'+key;row.append(title);
      const picker=document.createElement('input');picker.type='color';picker.id='ui-color-'+key;picker.dataset.color=key;picker.setAttribute('aria-label',label);row.append(picker);
      const text=document.createElement('input');text.type='text';text.dataset.color=key;text.maxLength=7;text.setAttribute('aria-label',label+'色值');row.append(text);
      const reset=document.createElement('button');reset.textContent='重置';reset.className='glass-pill-btn';row.append(reset);
      const update=value=>{if(!valid(value))return;state[key]=value.toLowerCase();state.enabled=true;state.preset='custom';picker.value=text.value=state[key];ps.value='custom';section.querySelector('#ui-colors-enabled').checked=true;queueApply();};
      picker.addEventListener('input',()=>update(picker.value));text.addEventListener('change',()=>{if(valid(text.value))update(text.value);else text.value=state[key];});reset.onclick=()=>update(base[key]);
      section.querySelector(['sidebar','topbar','playerbar'].includes(key)?'#ui-color-individual':'#ui-color-fields').append(row);
    }
    ps.onchange=()=>usePreset(ps.value);section.querySelector('#ui-colors-enabled').onchange=e=>{state.enabled=e.target.checked;apply();};section.querySelector('#ui-colors-separate').onchange=e=>{state.separate=e.target.checked;state.enabled=true;apply();refresh();};section.querySelector('#ui-theme-reset').onclick=()=>usePreset('dark');
    const status=message=>section.querySelector('#ui-theme-status').textContent=message;
    section.querySelector('#ui-theme-save').onclick=()=>{const name=section.querySelector('#ui-theme-name').value.trim();if(!name){status('先填写配色名称');return;}const {profiles,...colors}=state;const saved={name,colors};const i=state.profiles.findIndex(p=>p.name===name);if(i>=0)state.profiles[i]=saved;else{if(state.profiles.length>=12){status('最多保存 12 套，请先删除一套');return;}state.profiles.push(saved);}apply();refresh();status('已保存：'+name);};
    section.querySelector('#ui-theme-load').onclick=()=>{const value=section.querySelector('#ui-saved-themes').value;if(value==='')return;const p=state.profiles[Number(value)];if(!p)return;Object.assign(state,p.colors,{enabled:true});apply();refresh();status('已应用：'+p.name);if(state.preset==='cover')followCover();};
    section.querySelector('#ui-theme-delete').onclick=()=>{const value=section.querySelector('#ui-saved-themes').value;if(value==='')return;state.profiles.splice(Number(value),1);apply();refresh();status('已删除已保存配色');};
    document.getElementById('transparency-controls')?.after(section);if(!section.parentNode)panel.prepend(section);
    document.getElementById('current-cover')?.addEventListener('load',followCover);apply();refresh();followCover();
  }
  function restore(){
    try{state={...base,...JSON.parse(localStorage.getItem(KEY)||'{}')};}catch{state={...base};}
    for(const k of ['background','panel','accent','selection','sidebar','topbar','playerbar'])if(!valid(state[k]))state[k]=base[k];
    if(!Array.isArray(state.profiles))state.profiles=[];
    apply();if(section)refresh();followCover();
  }
  window.GlassWaveTheme={init,apply,restore,usePreset,setBackground:hex=>{if(state.enabled&&valid(hex)){state.background=hex;state.preset="custom";apply();refresh();}},getState:()=>JSON.parse(JSON.stringify(state))};
})();
