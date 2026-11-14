const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{EventEmitter}=require('node:events');
const {WindowsMediaControls,iconPNG}=require('../src/main/windowsMediaControls');
function engine(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),context);return Object.create(context.window.AudioEngine.prototype);}
test('Play starts an unloaded queue, preserves the selected queue index, and does not race a pending load',()=>{
 const e=engine(),loaded=[];Object.assign(e,{audio:{src:'',getAttribute:()=>null},playbackQueue:[{path:'a.wav'},{path:'b.wav'}],queueIndex:1,loadTrack:(t,play)=>loaded.push([t.path,play]),ensureAudioContext(){throw Error('must load a source first');}});
 e.play();assert.deepEqual(loaded,[['b.wav',true]]);assert.equal(e.playIntent,true);
 e.transport={operation:{kind:'load'}};e.play();assert.equal(loaded.length,1);
 e.transport=null;e.queueIndex=-1;e.play();assert.deepEqual(loaded.at(-1),['a.wav',true]);
 e.playbackQueue=[];assert.equal(e.play(),false);
});
test('play/pause trusts actual media state when UI state is stale or rendering is paused',()=>{
 const e=engine(),calls=[];Object.assign(e,{audio:{paused:false,ended:false},isPlaying:false,play:()=>calls.push('play'),pause:()=>calls.push('pause')});
 e.togglePlayPause();e.audio.paused=true;e.isPlaying=true;e.togglePlayPause();e.audio.paused=false;e.audio.ended=true;e.togglePlayPause();
 assert.deepEqual(calls,['pause','play','play']);
});
test('taskbar clicks are not swallowed as duplicates of a nearby media key, and shell colors follow system theme',()=>{
 const window=new EventEmitter(),ipc=new EventEmitter(),theme=new EventEmitter(),sent=[];
 Object.assign(window,{webContents:{send:c=>sent.push(c)},isDestroyed:()=>false,setThumbarButtons:buttons=>{window.buttons=buttons;return true;},setThumbnailToolTip(){}});
 Object.assign(theme,{shouldUseDarkColors:true,shouldUseDarkColorsForSystemIntegratedUI:false});
 const c=new WindowsMediaControls({window,ipcMain:ipc,nativeTheme:theme,nativeImage:{createFromBuffer:b=>b},globalShortcut:{register:()=>false,isRegistered:()=>false,unregister(){}},platform:'win32',now:()=>1000,setTimer:()=>({unref(){}}),clearTimer(){}});
 c.update({available:true,playing:true});c.dispatch('pause','global-shortcut');window.buttons[1].click();
 assert.deepEqual(sent,['media-pause','media-play-pause']);assert.deepEqual(c.icon('pause'),iconPNG('pause',false));
 c.state.playing=false;window.emit('minimize');assert.equal(window.buttons[1].tooltip,'播放');c.dispose();assert.equal(window.listenerCount('minimize'),0);
});
