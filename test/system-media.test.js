const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {WindowsMediaControls,iconPNG,SHORTCUTS}=require('../src/main/windowsMediaControls');
function native(){
  const window=new EventEmitter(),ipc=new EventEmitter(),theme=new EventEmitter(),power=new EventEmitter(),sent=[],keys=new Map(),logs=[];let now=1000,blocked='MediaNextTrack',cleared=false,retry;
  Object.assign(window,{webContents:{send:channel=>sent.push(channel)},isDestroyed:()=>false,setThumbarButtons:buttons=>{window.buttons=buttons;return true;},setThumbnailToolTip:text=>window.tip=text});theme.shouldUseDarkColors=true;
  const globalShortcut={register:(key,fn)=>{if(key===blocked)return false;keys.set(key,fn);return true;},isRegistered:key=>keys.has(key),unregister:key=>keys.delete(key)};
  const controller=new WindowsMediaControls({window,globalShortcut,nativeImage:{createFromBuffer:buffer=>buffer},nativeTheme:theme,ipcMain:ipc,powerMonitor:power,log:s=>logs.push(s),platform:'win32',now:()=>now,setTimer:fn=>{retry=fn;return {unref(){}};},clearTimer:()=>{cleared=true;}});
  return {window,ipc,theme,power,sent,keys,logs,controller,advance:ms=>now+=ms,unblock:()=>blocked='',retry:()=>retry(),isCleared:()=>cleared};
}
test('taskbar buttons use actual play state and dispatch without activating or restoring the window',()=>{
  const h=native();h.controller.refresh();assert.deepEqual(h.window.buttons.map(b=>b.tooltip),['上一首','播放','下一首']);assert.deepEqual(h.window.buttons[0].flags,['disabled']);
  h.controller.update({available:true,playing:true,title:'Song',artist:'Artist'});assert.equal(h.window.buttons[1].tooltip,'暂停');assert.equal(h.window.tip,'Song — Artist');
  h.window.buttons[0].click();h.window.buttons[1].click();h.window.buttons[2].click();assert.deepEqual(h.sent,['media-prev','media-play-pause','media-next']);
  h.controller.update({available:true,playing:false});assert.equal(h.window.buttons[1].tooltip,'播放');h.controller.dispose();
});
test('global registration handles individual failures, retries only failed keys and cleans up on quit',()=>{
  const h=native();h.controller.register();assert.equal(h.keys.size,3);assert.deepEqual([...h.controller.failed],['MediaNextTrack']);const original=h.keys.get('MediaPlayPause');
  h.unblock();h.retry();assert.equal(h.keys.size,4);assert.equal(h.keys.get('MediaPlayPause'),original);assert.equal(h.controller.failed.size,0);
  h.window.emit('focus');assert.equal(h.keys.size,4);h.power.emit('resume');assert.equal(h.keys.size,4);h.controller.dispose();assert.equal(h.keys.size,0);assert.equal(h.isCleared(),true);assert.equal(h.ipc.listenerCount('player-media-state'),0);
});
test('one physical media key arriving by multiple routes does not skip twice; intentional repeated clicks still work',()=>{
  const h=native();h.controller.update({available:true});h.controller.dispatch('next','global-shortcut');h.window.emit('app-command',{preventDefault(){}},'media-nexttrack');assert.deepEqual(h.sent,['media-next']);
  h.advance(150);h.controller.dispatch('next','taskbar');h.controller.dispatch('next','taskbar');assert.equal(h.sent.length,3);
  h.advance(150);h.controller.dispatch('play-pause','global-shortcut');h.controller.dispatch('play','media-session');assert.equal(h.sent.length,4);h.controller.dispose();
});
test('media IPC accepts the owner renderer only and rejects unknown commands',()=>{
  const h=native();h.ipc.emit('player-media-state',{sender:{}},{available:true,playing:true});assert.equal(h.controller.state.available,false);
  h.ipc.emit('player-media-state',{sender:h.window.webContents},{available:true,playing:false});h.ipc.emit('player-media-command',{sender:{}},'next');h.ipc.emit('player-media-command',{sender:h.window.webContents},'execute');assert.equal(h.sent.length,0);
  h.ipc.emit('player-media-command',{sender:h.window.webContents},'pause');assert.deepEqual(h.sent,['media-pause']);h.controller.dispose();
});
test('taskbar icons are valid transparent PNGs with distinct play, pause and navigation glyphs',()=>{
  const icons=['previous','play','pause','next'].map(name=>iconPNG(name,true));for(const png of icons){assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),32);assert.equal(png.readUInt32BE(20),32);}assert.equal(new Set(icons.map(p=>p.toString('base64'))).size,4);assert.notDeepEqual(iconPNG('play',true),iconPNG('play',false));
});
test('taskbar initialization retries a failed shell update and stops after success',async()=>{
  const h=native();let attempts=0;h.window.setThumbarButtons=()=>++attempts>=2;
  h.controller.refresh();assert.equal(attempts,1);assert.ok(h.controller.toolbarTimer);
  await new Promise(resolve=>setTimeout(resolve,300));assert.equal(attempts,2);assert.equal(h.controller.toolbarRetries,0);assert.equal(h.controller.toolbarTimer,null);h.controller.dispose();
});
test('media session and native media callbacks control the same engine and sync metadata without repeated state IPC',()=>{
  const events={},actions={},callbacks={},states=[],commands=[],positions=[];
  const audio={paused:true,ended:false,duration:120,currentTime:15,playbackRate:1,addEventListener:(name,fn)=>events[name]=fn};
  let next=0,previous=0,plays=0,pauses=0,toggles=0;
  const engine={audio,currentTrack:{title:'Song',artist:'Artist',album:'Album'},playbackQueue:[],play:()=>plays++,pause:()=>pauses++,next:()=>next++,previous:()=>previous++,togglePlayPause:()=>toggles++,seek:t=>audio.currentTime=t};
  const api={updateMediaState:s=>states.push(s),sendMediaCommand:c=>commands.push(c)};for(const name of ['onMediaPlayPause','onMediaNext','onMediaPrev','onMediaPlay','onMediaPause','onMediaStop'])api[name]=fn=>callbacks[name]=fn;
  const session={setActionHandler:(name,fn)=>actions[name]=fn,setPositionState:s=>positions.push(s)};
  const context={window:{navigator:{mediaSession:session},MediaMetadata:function(v){Object.assign(this,v);}}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/systemMedia.js'),'utf8'),context);
  const bridge=context.window.GlassWaveSystemMedia.bind(engine,api);assert.equal(states.length,1);assert.equal(session.playbackState,'paused');assert.equal(session.metadata.title,'Song');
  audio.paused=false;events.play();assert.equal(session.playbackState,'playing');assert.equal(states.length,2);events.timeupdate();events.timeupdate();assert.equal(states.length,2);
  actions.nexttrack();actions.previoustrack();actions.pause();assert.deepEqual(commands,['next','previous','pause']);
  callbacks.onMediaNext();callbacks.onMediaPrev();callbacks.onMediaPlayPause();callbacks.onMediaPlay();callbacks.onMediaPause();assert.deepEqual([next,previous,toggles,plays,pauses],[1,1,1,1,1]);callbacks.onMediaStop();assert.equal(audio.currentTime,0);
  engine.currentTrack={title:'Other',artist:'Other Artist'};bridge.sync();assert.equal(session.metadata.title,'Other');assert.ok(positions.length>0);
});
