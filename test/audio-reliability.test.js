const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
  let now=0,id=0;const timers=new Map(),logs=[],events=()=>{const handlers={};return {addEventListener:(n,fn)=>handlers[n]=fn,removeEventListener:n=>delete handlers[n],emit:n=>handlers[n]?.()};};
  const audio={...events(),paused:false,ended:false,src:'song.wav',currentTime:73,readyState:4};
  const context={...events(),state:'running',currentTime:10,sampleRate:48000,baseLatency:.02,resumes:0,async resume(){this.resumes++;this.state='running';this.emit('statechange');}};
  const devices=events(),clock={now:()=>now};
  const sandbox={window:{},Date:clock,setTimeout:(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;},clearTimeout:n=>timers.delete(n)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioReliability.js'),'utf8'),sandbox);
  let fades=0;const monitor=sandbox.window.GlassWaveAudioReliability.install(context,audio,{devices,fadeIn:()=>fades++,log:(event,data)=>logs.push({event,...data})});
  const tick=async()=>{const [key,timer]=[...timers.entries()][0];timers.delete(key);now=timer.at;await timer.fn();};
  return {context,audio,monitor,devices,timers,logs,tick,fades:()=>fades};
}
test('a render error followed by suspension recovers the same source without loading or seeking',async()=>{
  const f=fixture();f.context.emit('error');f.context.state='suspended';f.context.emit('statechange');f.context.emit('error');assert.equal(f.timers.size,1);
  await f.tick();assert.equal(f.context.resumes,1);assert.equal(f.fades(),1);assert.equal(f.audio.src,'song.wav');assert.equal(f.audio.currentTime,73);assert.equal(f.audio.paused,false);assert.ok(f.logs.some(l=>l.event==='recovered'));
});
test('recovery is bounded to three tries in thirty seconds and coalesces device events',async()=>{
  const f=fixture();f.context.resume=async()=>{f.context.resumes++;throw Error('device unavailable');};f.context.state='suspended';
  f.context.emit('error');f.devices.emit('devicechange');
  for(let n=0;n<3;n++){assert.equal(f.timers.size,1);await f.tick();}
  assert.equal(f.context.resumes,3);assert.equal(f.timers.size,0);assert.ok(f.logs.some(l=>l.event==='recovery-limit'));
  f.context.emit('statechange');assert.equal(f.timers.size,0);
});
test('paused, ended and closed contexts do not auto-play; pause/dispose cancel pending recovery',async()=>{
  const f=fixture();f.context.state='suspended';f.audio.paused=true;f.context.emit('error');assert.equal(f.timers.size,0);
  f.audio.paused=false;f.audio.ended=true;f.context.emit('statechange');assert.equal(f.timers.size,0);f.audio.ended=false;
  f.context.state='closed';f.context.emit('error');assert.equal(f.timers.size,0);
  f.context.state='interrupted';f.context.emit('statechange');assert.equal(f.timers.size,1);f.audio.paused=true;f.audio.emit('pause');assert.equal(f.timers.size,0);
  f.audio.paused=false;f.audio.emit('play');assert.equal(f.timers.size,1);f.monitor.dispose();assert.equal(f.timers.size,0);f.context.emit('statechange');assert.equal(f.timers.size,0);
});
test('duplicate launches activate the existing window while preserving mode',()=>{
  const {acquire}=require('../src/main/singleInstance'),events={},calls=[];const app={requestSingleInstanceLock:()=>true,on:(n,fn)=>events[n]=fn};
  const window={isDestroyed:()=>false,isMinimized:()=>true,restore:()=>calls.push('restore'),show:()=>calls.push('show'),focus:()=>calls.push('focus')};
  assert.equal(acquire(app,()=>window),true);events['second-instance']();assert.deepEqual(calls,['restore','show','focus']);
  let subscribed=false;assert.equal(acquire({requestSingleInstanceLock:()=>false,on:()=>subscribed=true},()=>null),false);assert.equal(subscribed,false);
});
test('audio context requests playback buffering and healthy flat audio has no extra effects',()=>{
  let options;const node=()=>({gain:{value:0},frequency:{value:0},Q:{value:0},connect(){}}),ctx={state:'running',destination:node(),createGain:node,createAnalyser:node,createMediaElementSource:node,createBiquadFilter:node};
  const audio={addEventListener(){},volume:1},sandbox={window:{AudioContext:function(value){options=value;return ctx;}},document:{getElementById:()=>audio},console,localStorage:{getItem:()=>null}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),sandbox);const e=new sandbox.window.AudioEngine('audio');e.ensureAudioContext();
  assert.equal(options.latencyHint,'playback');assert.equal(e.eqFilters.length,7);assert.equal(e.gainNode.gain.value,.8);assert.equal(e.reverb,null);assert.ok(e.eqFilters.every(f=>f.gain.value===0));
});
