const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function clock(){
 const pending=new Map();let id=0,visibility;
 const context={window:{requestAnimationFrame:fn=>{pending.set(++id,fn);return id;},cancelAnimationFrame:n=>pending.delete(n)},document:{hidden:false,documentElement:{classList:{toggle(){}}},addEventListener:(name,fn)=>{visibility=fn;}},setTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/frameClock.js'),'utf8'),context);
 return {window:context.window,pending,context,visibility,step(now){const batch=[...pending.values()];pending.clear();batch.forEach(fn=>fn(now));}};
}
test('clock supports explicit 60/90/120/144/180 rates and native refresh without duplicate work',()=>{
 for(const [display,target] of [[180,60],[180,90],[180,120],[180,144],[180,180],[180,'native'],[60,180],[240,'native']]){
   const f=clock();f.window.glasswaveFrameClock.setRate(target);let frames=0;
   const loop=()=>{frames++;f.window.requestAnimationFrame(loop);};f.window.requestAnimationFrame(loop);
   for(let i=0;i<display;i++){f.step(i*1000/display);assert.ok(f.pending.size<=1);}
   const expected=target==='native'?display:Math.min(target,display);
   assert.ok(Math.abs(frames-expected)<=1,`${display}Hz/${target}: ${frames}`);
 }
});
test('pause stops native scheduling, resume works, and setting the same cap does not reset cadence',()=>{
 const f=clock();f.window.glasswaveFrameClock.setRate(90);let frames=0;
 const loop=()=>{frames++;f.window.requestAnimationFrame(loop);};f.window.requestAnimationFrame(loop);
 f.step(0);f.window.glasswaveFrameClock.setRate(90);f.step(1000/180);assert.equal(frames,1);
 f.window.glasswaveFrameClock.setPaused(true);assert.equal(f.pending.size,0);f.step(100);assert.equal(frames,1);
 f.window.glasswaveFrameClock.setPaused(false);f.step(200);assert.equal(frames,2);
 const cancelled=f.window.requestAnimationFrame(()=>{throw Error('cancelled callback');});f.window.cancelAnimationFrame(cancelled);
 f.window.glasswaveFrameClock.setRate('native');f.step(205);assert.equal(frames,3);
});
test('native/high-refresh settings persist, reload with skins, and reset the clock without changing visual defaults',()=>{
 const values=new Map(),rates=[];
 const context={window:{glasswaveFrameClock:{setRate:v=>rates.push(v)}},document:{getElementById:()=>null},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},performance:{now:()=>0},requestAnimationFrame(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
 const C=context.window.Visualizer,v=new C('missing',{});v.performSyncResize=()=>{};
 for(const rate of [120,144,180,'native']){v.setTargetFps(String(rate));v.loadTuning();assert.equal(v.tuning.targetFps,rate);assert.equal(rates.at(-1),rate);}
 values.set('glasswave_visual_tuning',JSON.stringify({targetFps:'unlimited'}));v.loadTuning();assert.equal(v.tuning.targetFps,90);
 v.setTargetFps('corrupt');assert.equal(v.tuning.targetFps,90);
 v.setTargetFps(180);v.resetAllVisualTuning();assert.equal(v.tuning.targetFps,90);assert.equal(rates.at(-1),90);
});
test('ambient backgrounds keep their previous 90Hz budget on a 180Hz clock',()=>{
 let callback,paints=0,colors=0;
 const context={window:{},document:{body:{classList:{contains:()=>false}},documentElement:{style:{getPropertyValue:()=>0}}},requestAnimationFrame:fn=>{callback=fn;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/colorEngine.js'),'utf8'),context);
 const v=Object.assign(Object.create(context.window.ColorEngine.prototype),{updateColors(){colors++;},drawFluidMesh(){paints++;}});
 v.startRenderLoop();for(let i=0;i<180;i++)callback(i*1000/180);
 assert.equal(paints,90);assert.equal(colors,90);
});
