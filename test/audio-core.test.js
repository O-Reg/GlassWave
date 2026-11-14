const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {Transport,ramp}=require('../src/renderer/js/audioTransport');
function fixture(){
 const start=performance.now(),events={},writes=[],params=[];const context={state:'running',get currentTime(){return (performance.now()-start)/1000;}};
 const gain={gain:{value:1,cancelAndHoldAtTime:t=>params.push(['hold',t]),cancelScheduledValues(){},setValueAtTime(v,t){this.value=v;params.push(['start',v,t]);},linearRampToValueAtTime(v,t){this.value=v;params.push(['end',v,t]);}}};
 let time=0;const audio={src:'song.wav',paused:false,ended:false,seeking:false,duration:100,readyState:4,
  addEventListener:(n,f)=>events[n]=f,removeEventListener:n=>delete events[n],emit:n=>events[n]?.(),pause(){this.paused=true;},
  get currentTime(){return time;},set currentTime(v){time=v;writes.push(v);this.seeking=true;setTimeout(()=>{this.seeking=false;this.emit('seeked');},1);}};
 const transport=new Transport(context,audio,gain);return {transport,audio,context,writes,params};
}
test('seek waits for the fade, coalesces rapid targets and anchors each gain ramp',async()=>{
 const f=fixture();try{const a=f.transport.seek(10),b=f.transport.seek(23);assert.equal(await a,false);assert.equal(f.writes.length,0);assert.equal(await b,true);assert.deepEqual(f.writes,[23]);assert.ok(f.params.some(x=>x[0]==='start'));assert.ok(f.params.some(x=>x[0]==='end'&&x[1]===0));}finally{f.transport.dispose();}
});
test('scrubbing previews silently, commits once, and pause never becomes play after seeking',async()=>{
 const f=fixture();try{f.transport.beginScrub();await new Promise(r=>setTimeout(r,20));assert.equal(f.writes.length,0);assert.equal(await f.transport.endScrub(51),true);assert.deepEqual(f.writes,[51]);f.audio.paused=true;assert.equal(await f.transport.seek(-4),true);assert.equal(f.audio.paused,true);assert.equal(f.audio.currentTime,0);assert.equal(await f.transport.seek(Infinity),false);assert.equal(await f.transport.seek(NaN),false);}finally{f.transport.dispose();}
});
test('metadata-delayed seeks apply to the new source and cancelled drags do not cancel track loading',async()=>{
 const f=fixture();try{f.audio.paused=true;const load=f.transport.changeSource(()=>{f.audio.src='new.wav';f.audio.duration=NaN;f.audio.readyState=0;});f.transport.beginScrub();f.transport.cancelScrub();assert.ok(f.transport.operation);assert.equal(await f.transport.seek(6),false);f.audio.duration=30;f.audio.readyState=4;f.audio.emit('loadedmetadata');await new Promise(r=>setTimeout(r,8));assert.equal(f.audio.currentTime,6);assert.equal(await load,false);}finally{f.transport.dispose();}
});
test('timeline mousedown and mouseup issue one seek, and losing focus cancels the scrub',()=>{
 const events={},windowEvents={},nodes={},calls=[];
 for(const id of ['timeline-track','timeline-progress','timeline-handle','current-time','total-duration'])nodes[id]={style:{},classList:{add(){},remove(){}},getBoundingClientRect:()=>({left:10,width:100}),addEventListener:(n,fn)=>events[n]=fn};
 const sandbox={window:{addEventListener:(n,fn)=>windowEvents[n]=fn,removeEventListener:n=>delete windowEvents[n]},document:{getElementById:id=>nodes[id]}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),sandbox);const ui=Object.create(sandbox.window.UIController.prototype);
 ui.audioEngine={audio:{duration:100,currentTime:4},beginScrub:()=>calls.push('begin'),endScrub:v=>calls.push(v),cancelScrub:()=>calls.push('cancel')};ui.formatTime=String;ui.bindTimeline();
 events.mousedown({button:0,clientX:50});assert.deepEqual(calls,['begin']);windowEvents.mousemove({clientX:70});assert.equal(calls.length,1);windowEvents.mouseup({clientX:80});assert.deepEqual(calls,['begin',70]);
 events.mousedown({button:0,clientX:30});windowEvents.blur();assert.equal(calls.at(-1),'cancel');assert.equal(ui.isDraggingTimeline,false);
});
function engineFixture(api={}){
 const node=()=>({gain:{value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}},frequency:{value:0},Q:{value:0},connect(){}});
 const ctx={currentTime:0,state:'running',destination:node(),createGain:node,createAnalyser:node,createMediaElementSource:node,createBiquadFilter:node};
 const events={},audio={src:'original.wav',duration:100,currentTime:41,paused:true,addEventListener:(n,fn)=>events[n]=fn,emit:n=>events[n]?.(),pause(){this.paused=true;},load(){},play:()=>Promise.resolve()};
 const sandbox={window:{glasswaveAPI:api,AudioContext:function(){return ctx;}},document:{getElementById:()=>audio},console,localStorage:{getItem:()=>null,setItem(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),sandbox);return {engine:new sandbox.window.AudioEngine('audio'),audio,ctx};
}
test('volume uses exactly one gain stage; pre-context mute and invalid inputs stay safe',()=>{
 const {engine:e,audio}=engineFixture();e.toggleMute();assert.equal(audio.muted,true);e.ensureAudioContext();assert.equal(audio.volume,1);assert.equal(audio.muted,false);assert.equal(e.gainNode.gain.value,0);e.toggleMute();assert.equal(e.gainNode.gain.value,.8);
 e.setVolume(NaN);e.setVolume(Infinity);assert.equal(e.volume,.8);e.setVolume(.6);assert.equal(e.gainNode.gain.value,.6);assert.equal(audio.volume,1);
 const gains=Array.from(e.eqGains);e.setEQBand(0,NaN);e.setEQBand(.2,3);assert.deepEqual(Array.from(e.eqGains),gains);
});
test('a late compatibility decode result cannot replace a newly chosen song or resume a paused one',async()=>{
 let resolve;const f=engineFixture({compatibleAudioSource:()=>new Promise(r=>resolve=r)}),e=f.engine;e.currentTrack={path:'old.wma'};e.playIntent=true;
 const job=e.tryCompatibleSource();e.loadGeneration++;e.currentTrack={path:'new.wav'};e.playIntent=false;resolve({url:'file:///cached.wav'});await job;assert.equal(f.audio.src,'original.wav');assert.equal(f.audio.paused,true);assert.equal(e.currentTrack.path,'new.wav');
});
test('seeking to the end while paused cannot auto-advance or resume playback',()=>{
 const {engine,audio}=engineFixture();let advances=0;engine.handleTrackEnded=()=>advances++;
 engine.playIntent=false;audio.emit('ended');assert.equal(advances,0);engine.playIntent=true;audio.emit('ended');assert.equal(advances,1);
});
