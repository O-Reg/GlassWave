const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const script=name=>fs.readFileSync(path.join(__dirname,'../src/renderer/js',name),'utf8');
function storage(seed={}){const map=new Map(Object.entries(seed));return {map,get length(){return map.size},key:i=>[...map.keys()][i],getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear()};}
function fixture(){
  const values=storage({glasswave_state:'unchanged playback',glasswave_user_presets:'[]'}),classes=new Set(['zen-mode']);
  const calls=[];
  const ui={visualizer:{tuning:{},mode:'wave',intensity:1,positionPreset:'behind',offsetY:0,visScale:1,
    loadTuning(){this.tuning=JSON.parse(values.getItem('glasswave_visual_tuning')||'{}');},
    setIntensity(v){this.intensity=v;},setPositionPreset(v){this.positionPreset=v;},setOffsetY(v){this.offsetY=v;},setScale(v){this.visScale=v;},setEnabled(v){this.enabled=v;}},
    colorEngine:{restoreSettings(){calls.push('colors');}},parallax:{setEnabled(v){calls.push(['parallax',v]);}},
    switchVisualizerMode(v){this.visualizer.mode=v;},initCustomWallpaper(){calls.push(['background',values.getItem('glasswave_custom_bg')]);},
    updateDesktopReveal(v){calls.push(['reveal',v]);},updateWindowGlassRatio(v){calls.push(['glass',v]);}};
  for(const name of ['renderThemePresets','renderPureColors','bindAmbientGlowControls','saveVisualizerModeControls','syncVisualizerTuningUI','syncVisualizerCustomizationUI','renderCustomPresets'])ui[name]=()=>{};
  const playback={currentTrack:{path:'playing.wav'},playbackQueue:[{path:'playing.wav'},{path:'next.wav'}],queueIndex:0,audio:{currentTime:73.25,paused:false,src:'playing.wav'}};
  ui.audioEngine=playback;
  const node={classList:{contains:k=>classes.has(k),remove:k=>classes.delete(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)}};
  const context={window:{ui,GlassWaveTheme:{restore(){calls.push('theme');}}},glasswaveAPI:{async saveConfig(){calls.push('config');}},
    localStorage:values,document:{body:node,documentElement:node,getElementById:()=>null},location:{reload(){throw Error('Reload interrupts audio');}}};
  vm.runInNewContext(script('skinFiles.js'),context);
  return {context,values,classes,calls,ui,playback,skin:context.window.GlassWaveSkin};
}

test('full skin changes update appearance without touching audio, queue, timing or mode',async()=>{
  const f=fixture(),audio=f.playback.audio,queue=f.playback.playbackQueue;
  const data={settings:{glasswave_visual_tuning:'{"wave":{"lineWidth":8}}',glasswave_custom_bg:'wallpaper.png',glasswave_desktop_reveal:'70',glasswave_window_glass_ratio:'35'},
    runtime:{mode:'reactive',intensity:2,position:'center',offsetY:45,scale:1.4,mouseParallax:false}};
  for(const mode of ['zen-mode','mini-bar-mode','normal']){
    f.classes.clear();if(mode!=='normal')f.classes.add(mode);
    await f.skin.apply(data);
    assert.equal(f.playback.audio,audio);assert.equal(audio.currentTime,73.25);assert.equal(audio.src,'playing.wav');
    assert.equal(f.playback.playbackQueue,queue);assert.equal(f.playback.queueIndex,0);assert.equal(f.playback.currentTrack.path,'playing.wav');
    assert.equal(f.values.getItem('glasswave_state'),'unchanged playback');
    assert.equal(f.classes.has('zen-mode'),mode==='zen-mode');assert.equal(f.classes.has('mini-bar-mode'),mode==='mini-bar-mode');
  }
  audio.paused=true;await f.skin.apply(data);assert.equal(audio.paused,true);
  assert.equal(f.ui.visualizer.mode,'reactive');assert.equal(f.ui.visualizer.visScale,1.4);
  assert.ok(f.calls.some(c=>c[0]==='reveal'&&c[1]==='70'));
});

test('skin capture excludes playback, and malformed skin cannot alter it',async()=>{
  const f=fixture();
  assert.equal(f.skin.capture(f.ui).settings.glasswave_state,undefined);
  await assert.rejects(f.skin.apply({settings:{glasswave_state:'song'},runtime:{}}),/不支持/);
  assert.equal(f.values.getItem('glasswave_state'),'unchanged playback');
});

test('rapid skin switches are applied in order without restoring playback state',async()=>{
  const f=fixture(),data=mode=>({settings:{glasswave_desktop_reveal:mode==='wave'?'20':'80'},runtime:{mode,intensity:1,position:'behind',offsetY:0,scale:1}});
  await Promise.all([f.skin.apply(data('wave')),f.skin.apply(data('sphere'))]);
  assert.equal(f.ui.visualizer.mode,'sphere');assert.equal(f.values.getItem('glasswave_desktop_reveal'),'80');
  assert.equal(f.playback.audio.currentTime,73.25);
});

test('failed skin save restores original appearance preferences and keeps playback',async()=>{
  const f=fixture();f.values.setItem('glasswave_desktop_reveal','20');
  f.context.glasswaveAPI.saveConfig=async()=>{throw Error('save failed');};
  await assert.rejects(f.skin.apply({settings:{glasswave_desktop_reveal:'80'},runtime:{mode:'wave',position:'behind',intensity:1,offsetY:0,scale:1}}),/save failed/);
  assert.equal(f.values.getItem('glasswave_desktop_reveal'),'20');assert.equal(f.playback.audio.currentTime,73.25);
});

test('ambient restore retains stored theme and pure background while reusing the engine',()=>{
  const values=storage({glasswave_skin_theme:'twilight',glasswave_pure_color:'#ffffff',glasswave_glow_speed:'0.4'});
  const context={window:{},localStorage:values};vm.runInNewContext(script('colorEngine.js'),context);
  const engine=Object.create(context.window.ColorEngine.prototype);
  engine.clearPureColor=()=>{values.removeItem('glasswave_pure_color');values.setItem('glasswave_skin_theme','aurora');};
  engine.setTheme=v=>{engine.currentThemeKey=v;values.setItem('glasswave_skin_theme',v);};
  engine.setPureColor=(v,name,persist)=>{if(persist)values.setItem('glasswave_pure_color',v);};
  engine.restoreSettings();
  assert.equal(engine.currentThemeKey,'twilight');assert.equal(values.getItem('glasswave_pure_color'),'#ffffff');assert.equal(engine.speedMultiplier,.4);
});

test('modal drag selection cannot dismiss backdrop, while a fresh outside click can',()=>{
  const events={},context={window:{},document:{addEventListener:(name,fn)=>events[name]=fn}};
  vm.runInNewContext(script('ui.js'),context);const ui=Object.create(context.window.UIController.prototype);ui.bindModalDismissGuard();
  const backdrop={matches:()=>true},input={matches:()=>false};
  function click(target,x,y){let blocked=false;events.click({target,clientX:x,clientY:y,detail:1,preventDefault(){blocked=true;},stopImmediatePropagation(){}});return blocked;}
  events.pointerdown({target:input,clientX:10,clientY:10});assert.equal(click(backdrop,150,10),true);
  events.pointerdown({target:backdrop,clientX:150,clientY:10});assert.equal(click(backdrop,150,10),false);
  events.pointerdown({target:backdrop,clientX:10,clientY:10});assert.equal(click(backdrop,150,10),true);
  events.pointerdown({target:input,clientX:10,clientY:10});events.pointercancel();assert.equal(click(backdrop,150,10),true);
});

test('renaming a skin changes only its name, never recaptures a song or skin settings',async()=>{
  const values=storage(),nodes={},events={};
  for(const id of ['btn-save-custom-preset','modal-save-preset','input-preset-name','btn-cancel-save-preset','btn-confirm-save-preset'])nodes[id]={value:'',disabled:false,dataset:{},style:{},classList:{add(){},remove(){}},querySelector:()=>null,focus(){},select(){}};
  const context={window:{},document:{getElementById:id=>nodes[id],addEventListener:(name,fn)=>events[name]=fn,removeEventListener(){}},localStorage:values,requestAnimationFrame:fn=>fn(),setTimeout:()=>0,alert:msg=>{throw Error(msg);}};
  vm.runInNewContext(script('ui.js'),context);const ui=Object.create(context.window.UIController.prototype);
  const preset={id:'skin-a',name:'Old',fullSkin:{settings:{test:'preserved'}}};
  ui.getSavedPresets=()=>[preset];ui.renderCustomPresets=()=>{};
  ui.saveCurrentAsPreset=()=>{throw Error('Rename must not capture current skin');};
  ui.bindCustomPresetActions();nodes['btn-save-custom-preset'].click=()=>nodes['btn-save-custom-preset'].onclick();
  ui.openSkinRename(preset);nodes['input-preset-name'].value='New';await nodes['btn-confirm-save-preset'].onclick();
  const saved=JSON.parse(values.getItem('glasswave_user_presets'));
  assert.equal(saved[0].name,'New');assert.deepEqual(saved[0].fullSkin,preset.fullSkin);
});
