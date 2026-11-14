const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
  const paths=[];let gradients=0;
  class Path2D{constructor(){this.values=[];paths.push(this);}moveTo(...p){this.values.push(...p);}quadraticCurveTo(...p){this.values.push(...p);}lineTo(...p){this.values.push(...p);}}
  const context={window:{},document:{getElementById:()=>null},performance:{now:()=>100},Float32Array,Float64Array,Path2D};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
  const v=Object.assign(Object.create(context.window.Visualizer.prototype),{width:3440,height:1440,intensity:1,offsetY:0,positionPreset:'center',_waveFrameScale:2/3});
  const ctx={save(){},restore(){},stroke(){},createLinearGradient(){gradients++;return {addColorStop(){}};}};
  return {v,ctx,paths,gradients:()=>gradients};
}
test('ribbon gradients are reused, resized correctly and PCM averaging matches the original window filter',()=>{
  const f=fixture(),raw=Uint8Array.from({length:1024},(_,i)=>(i*73+19)%256);
  for(const detail of [0,.2,.4,.8,1])for(const density of [.48,8,12]){
    const t={curveSmooth:1-detail,density};f.v.drawNeonRibbon(f.ctx,{timeDomain:raw},true,t,3,'wave');
    const targets=f.v._ribbonStates.wave.targets;
    for(let i=0;i<128;i++){
      const span=Math.max(.04,Math.min(1,density/12)),at=(1-span)*1023*.5+i/127*1023*span,radius=Math.round((1-detail)*24);
      let sum=0;for(let j=-radius;j<=radius;j++)sum+=(raw[Math.max(0,Math.min(1023,Math.round(at)+j))]-128)/128;
      const local=sum/(radius*2+1),expected=Math.tanh((local*detail+local*(1-detail))*2.5);
      assert.ok(Math.abs(targets[i]-expected)<1e-12);
    }
  }
  assert.equal(f.gradients(),3);f.v.width=3840;f.v.drawNeonRibbon(f.ctx,null,false,{},3,'wave');assert.equal(f.gradients(),6);
  for(const p of f.paths)assert.ok(p.values.every(Number.isFinite));
});
test('center anchor avoids DOM measurement',()=>{
  const {v}=fixture();v.getCoverMetrics=()=>{throw Error('unnecessary layout read');};
  assert.deepEqual({...v.getAnchorPoint()},{cx:1720,cy:720});
});
test('visualizer renders each shared clock callback without a second frame limiter',()=>{
  const {v}=fixture();let callback,renders=0;
  const context={window:{glasswaveFrameClock:{setRate(){}}},performance:{now:()=>0},requestAnimationFrame:fn=>{callback=fn;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
  const instance=Object.assign(Object.create(context.window.Visualizer.prototype),{tuning:{targetFps:90},render(){renders++;}});
  instance.startLoop();for(const time of [0,8.333,25,33.333,50,58.333])callback(time);
  assert.equal(renders,6);
});
test('each frame clears obsolete GPU commands rather than retaining old ribbon pixels',()=>{
  const {v,ctx}=fixture();const clears=[];ctx.clearRect=(...p)=>clears.push(p);
  Object.assign(v,{ctx,tuning:{},audioProcessor:{},smoothedBass:0,smoothedMid:0,smoothedHigh:0,
    processAudioResponse(){},applyPalette(){},mode:'wave',drawLiquidWave(){this._ribbonPaintBounds={top:300,bottom:800,width:3440,height:1440};},drawCircularSpectrum(){}});
  v.render();v.render();v.mode='spectrum';v.render();v.render();
  assert.deepEqual(clears,Array.from({length:4},()=>[0,0,3440,1440]));
});
test('GPU subdivision retains the original quadratic path endpoints and stays finite at sharp bends',()=>{
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ribbonGpu.js'),'utf8'),context);
  const g=Object.create(context.window.GlassWaveRibbonGPU.prototype);g.curve=new Float64Array(8192);
  const count=g.flatten(new Float64Array([0,700,100,300,200,1000,300,700]));
  assert.equal(count,14);assert.equal(g.curve[0],0);assert.equal(g.curve[1],700);
  assert.equal(g.curve[(count-1)*2],300);assert.equal(g.curve[(count-1)*2+1],700);
  for(let i=0;i<count;i++){assert.ok(Number.isFinite(g.curve[i*2+1]));if(i)assert.ok(g.curve[i*2]>=g.curve[(i-1)*2]);}
});
test('GPU failure falls back in the same frame without advancing PCM smoothing or flow twice',()=>{
  const a=fixture(),b=fixture(),raw=Uint8Array.from({length:1024},(_,i)=>(i*13)%256);
  a.v._ribbonGPU={lost:false,draw(){throw Error('simulated context loss');}};
  a.v.tuning={modeColors:{wave:{palette:'original'}}};a.v.mode='wave';
  for(const f of [a,b])f.v.drawNeonRibbon(f.ctx,{timeDomain:raw},true,{},3,'wave');
  assert.equal(a.v._ribbonGPU,null);
  assert.equal(a.v._ribbonStates.wave.drift,b.v._ribbonStates.wave.drift);
  assert.deepEqual(a.v._ribbonStates.wave.values,b.v._ribbonStates.wave.values);
  assert.equal(a.paths.length,3);
});
