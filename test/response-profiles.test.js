const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function sampler(){const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualResponse.js'),'utf8'),context);return new context.window.GlassWaveVisualResponse();}
const tone=(hz,n=2048,rate=48000)=>Uint8Array.from({length:n},(_,i)=>128+Math.round(35*Math.sin(i*2*Math.PI*hz/rate)));
function input(hz){const frequency=new Uint8Array(2048);frequency[Math.round(hz/(24000/2048))]=220;return {timeDomain:tone(hz),frequency,bassEnergy:.2,midEnergy:.3,highEnergy:.4};}
const power=pcm=>Math.sqrt([...pcm].slice(512).reduce((s,v)=>s+(v-128)**2,0)/(pcm.length-512));
test('original response is exact pass-through and all other profiles leave audio input untouched',()=>{
 const s=sampler(),data=input(1000),pcm=Buffer.from(data.timeDomain),freq=Buffer.from(data.frequency);
 assert.equal(s.sample(data,{responseMode:'original'},true),data);
 for(const mode of ['loudness','bass','mid','treble','hybrid','bands']){
   const out=s.sample(data,{responseMode:mode,responseMix:.5},true);
   assert.deepEqual(Buffer.from(data.timeDomain),pcm);assert.deepEqual(Buffer.from(data.frequency),freq);
   assert.ok([out.bassEnergy,out.midEnergy,out.highEnergy].every(Number.isFinite));assert.ok(out.frequency.every(v=>v>=0&&v<=255));
 }
 assert.equal(s.sample(data,{responseMode:'bands'},false),data);
});
test('visual band filters separate real low/mid/high tones and reconstruct PCM within quantization error',()=>{
 const s=sampler();
 for(const [hz,expected] of [[100,0],[1000,1],[8000,2]]){
   const source=input(hz),out=s.sample(source,{responseMode:'bands'},true),powers=out.ribbonTimeDomains.map(power);
   assert.equal(powers.indexOf(Math.max(...powers)),expected,`${hz}Hz: ${powers}`);
   const energies=[out.bassEnergy,out.midEnergy,out.highEnergy];assert.equal(energies.indexOf(Math.max(...energies)),expected);
   for(let i=0;i<source.timeDomain.length;i++){const sum=out.ribbonTimeDomains.reduce((v,p)=>v+p[i]-128,128);assert.ok(Math.abs(sum-source.timeDomain[i])<=2);}
 }
});
test('loudness response follows amplitude rather than pitch; buffers are reused and silence remains silent',()=>{
 const s=sampler(),data=input(1500);data.timeDomain=Uint8Array.from({length:2048},(_,i)=>i%32<16?163:93);
 const first=s.sample(data,{responseMode:'loudness'},true),snapshot=Buffer.from(first.timeDomain),buffer=first.timeDomain;
 data.timeDomain=Uint8Array.from({length:2048},(_,i)=>i%8<4?163:93);const second=s.sample(data,{responseMode:'loudness'},true);
 assert.equal(second.timeDomain,buffer);assert.deepEqual(Buffer.from(second.timeDomain),snapshot);
 data.timeDomain.fill(128);data.frequency.fill(0);const silent=s.sample(data,{responseMode:'loudness'},true);
 assert.ok(silent.timeDomain.every(v=>v===128));assert.ok(silent.frequency.every(v=>v===0));
});
test('default ribbon flow stays continuous across play and pause',()=>{
 const context={window:{},document:{getElementById:()=>null},performance:{now:()=>0},Path2D:class{moveTo(){}quadraticCurveTo(){}lineTo(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
 const v=Object.assign(Object.create(context.window.Visualizer.prototype),{width:3440,height:1440,intensity:1,offsetY:0,positionPreset:'center',_waveFrameScale:1});
 const ctx={save(){},restore(){},stroke(){},createLinearGradient:()=>({addColorStop(){}})},data=input(1000);
 for(let i=0;i<20;i++)v.drawNeonRibbon(ctx,data,true,{},3,'wave');
 const state=v._ribbonStates.wave;assert.equal(state.flowWeight,1);const phase=state.drift;
 v.drawNeonRibbon(ctx,null,false,{},3,'wave');assert.equal(state.flowWeight,1);assert.ok(state.drift>phase);
});
test('hybrid endpoints are spectrum and loudness; low sample rates have no impossible high band',()=>{
 const s=sampler(),data=input(1000);
 const spectral=s.sample(data,{responseMode:'hybrid',responseMix:0},true);assert.deepEqual(Buffer.from(spectral.frequency),Buffer.from(data.frequency));assert.deepEqual(Buffer.from(spectral.timeDomain),Buffer.from(data.timeDomain));
 const loud=Buffer.from(s.sample(data,{responseMode:'loudness'},true).timeDomain);
 assert.deepEqual(Buffer.from(s.sample(data,{responseMode:'hybrid',responseMix:1},true).timeDomain),loud);
 const lowRate=s.sample(data,{responseMode:'treble'},true,8000);assert.equal(lowRate.highEnergy,0);assert.ok(lowRate.timeDomain.every(v=>v===128));
});
test('spatial response fills the last high-frequency bin and changes single-line sampling',()=>{
 const s=sampler(),data=input(1000);data.frequency=Uint8Array.from({length:2048},(_,i)=>i%251);
 const out=s.sample(data,{responseMode:'bands'},true);
 assert.equal(out.frequency.at(-1),data.frequency.at(-1));
 assert.notDeepEqual(Buffer.from(out.timeDomain),Buffer.from(data.timeDomain));
 assert.equal(out.timeDomain[0],128);assert.equal(out.timeDomain.at(-1),128);
});
test('continuous-flow migration runs once; response choices remain independent and reset per mode',()=>{
 const store=new Map([['glasswave_visual_tuning',JSON.stringify({wave:{playFlow:0,flowThreshold:.02},reactive:{playFlow:0}})]]);
 const context={window:{},document:{getElementById:()=>null},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},performance:{now:()=>0},requestAnimationFrame(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
 const v=new context.window.Visualizer('missing',{});assert.equal(v.tuning.wave.playFlow,1);assert.equal(v.tuning.wave.flowThreshold,.02);
 v.setTuningParam('wave','playFlow',0);v.setTuningParam('wave','responseMode','bass');v.setTuningParam('curtain','responseMode','loudness');v.loadTuning();
 assert.equal(v.tuning.wave.playFlow,0);assert.equal(v.tuning.wave.responseMode,'bass');assert.equal(v.tuning.curtain.responseMode,'loudness');
 v.resetModeTuning('wave');assert.equal(v.tuning.wave.playFlow,1);assert.equal(v.tuning.wave.responseMode,'original');assert.equal(v.tuning.curtain.responseMode,'loudness');
});
