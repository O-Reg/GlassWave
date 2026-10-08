const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const api=require('../src/renderer/js/reverb.js');
function context(rate=48000){
  const nodes=[];
  const make=()=>{
    const node={targets:new Set(),gain:{value:1,cancelScheduledValues(){},setTargetAtTime(value){this.value=value;}},connect(target){this.targets.add(target);},disconnect(target){if(target)this.targets.delete(target);else this.targets.clear();}};
    nodes.push(node);return node;
  };
  return {sampleRate:rate,currentTime:0,nodes,createGain:make,createConvolver:make,
    createBuffer(channels,length,rate){const samples=Array.from({length:channels},()=>new Float32Array(length));return {length,sampleRate:rate,getChannelData:i=>samples[i]};}};
}
test('ten distinct stereo reverb presets have finite, bounded energy and decaying tails',()=>{
  const presets=api.PRESETS.filter(p=>p.id!=='off');assert.equal(presets.length,10);
  const signatures=new Set();
  for(const rate of [44100,48000])for(const p of presets){
    const buffer=api.createImpulse(context(rate),p),a=buffer.getChannelData(0),b=buffer.getChannelData(1);
    assert.ok(buffer.length<=rate*3.3);let energy=0,tail=0;
    for(let i=0;i<a.length;i++){assert.ok(Number.isFinite(a[i]));energy+=a[i]*a[i];if(i>a.length*.8)tail+=a[i]*a[i];}
    assert.ok(energy>.7&&energy<1);assert.ok(tail/energy<.01);
    assert.notDeepEqual(a,b);assert.equal(a[0],0);
    if(rate===48000)signatures.add(buffer.length+':'+a[Math.floor(a.length*.1)]);
  }
  assert.equal(signatures.size,10);
});
test('disabled reverb is a unity dry path without a convolver',()=>{
  const ctx=context(),input=ctx.createGain(),output=ctx.createGain(),processor=new api.Processor(ctx,input,output);
  assert.equal(processor.select('unknown'),'off');assert.equal(processor.active,null);
  assert.equal(processor.dry.gain.value,1);assert.equal(input.targets.size,1);assert.equal(processor.cache.size,0);
});
test('rapid switches retire every old branch, bound cache, and return to the dry path',async()=>{
  const ctx=context(),input=ctx.createGain(),output=ctx.createGain(),processor=new api.Processor(ctx,input,output);
  for(const p of api.PRESETS.slice(1))processor.select(p.id);
  assert.equal(processor.cache.size,3);assert.equal(processor.active.gain.gain.value,.3);
  processor.select('off');await new Promise(resolve=>setTimeout(resolve,160));
  assert.equal(input.targets.size,1);assert.equal(processor.active,null);assert.equal(processor.timers.size,0);assert.equal(processor.dry.gain.value,1);
});
test('reverb selection persists independently without touching playback or EQ',()=>{
  const storage=new Map(),audio={currentTime:42,paused:false,addEventListener(){}};
  storage.set('glasswave_reverb_preset','hall');
  const sandbox={window:{GlassWaveReverb:api},document:{getElementById:()=>audio},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),sandbox);
  const engine=new sandbox.window.AudioEngine('audio-player');assert.equal(engine.reverbPreset,'hall');
  const gains=Array.from(engine.eqGains);engine.currentTrack={path:'song.wav'};engine.playbackQueue=[engine.currentTrack];
  engine.setReverbPreset('plate');assert.equal(storage.get('glasswave_reverb_preset'),'plate');
  assert.equal(audio.currentTime,42);assert.equal(audio.paused,false);assert.equal(engine.currentTrack.path,'song.wav');assert.deepEqual(Array.from(engine.eqGains),gains);
  engine.setReverbPreset('invalid');assert.equal(engine.reverbPreset,'off');
});

test('audio engine routes the EQ into dry and wet paths before the analyser and volume',()=>{
  const ctx=context();ctx.state='running';ctx.destination=ctx.createGain();
  ctx.createAnalyser=ctx.createGain;ctx.createMediaElementSource=ctx.createGain;
  ctx.createBiquadFilter=()=>{const node=ctx.createGain();node.frequency={value:0};node.Q={value:0};return node;};
  const audio={addEventListener(){}};
  const sandbox={window:{GlassWaveReverb:api,AudioContext:function(){return ctx;}},document:{getElementById:()=>audio},localStorage:{getItem:()=>null,setItem(){}},console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),sandbox);
  const engine=new sandbox.window.AudioEngine('audio-player');engine.setReverbPreset('hall');engine.ensureAudioContext();
  const last=engine.eqFilters.at(-1);assert.ok(last.targets.has(engine.reverb.dry));assert.ok(last.targets.has(engine.reverb.active.convolver));
  assert.ok(engine.reverb.dry.targets.has(engine.analyser));assert.ok(engine.reverb.active.gain.targets.has(engine.analyser));
  assert.ok(engine.analyser.targets.has(engine.gainNode));assert.ok(engine.gainNode.targets.has(ctx.destination));
  engine.setReverbPreset('off');
});
