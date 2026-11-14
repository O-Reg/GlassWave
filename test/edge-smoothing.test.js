const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const edges=require('../src/renderer/js/edgeSmoothing'),{roundedShape}=require('../src/main/roundedWindow');
test('one edge quality control safely combines luma transition, a monotonic S curve and a bounded mask blur',()=>{
  assert.equal(edges.normalize(null),40);assert.equal(edges.normalize('bad'),40);assert.equal(edges.normalize(-10),0);assert.equal(edges.normalize(1000),100);
  let lastWidth=0,lastBlur=-1;
  for(const level of [0,20,40,60,80,100]){
    const p=edges.parameters(level,.16,'black');assert.ok(p.width>lastWidth);assert.ok(p.blur>lastBlur);assert.ok(p.blur<=1.2);assert.equal(p.table[0],0);assert.equal(p.table.at(-1),1);assert.ok(p.table.every((v,i)=>i===0||v>=p.table[i-1]));lastWidth=p.width;lastBlur=p.blur;
  }
});
test('black and white key masks use mirrored alpha math without changing source RGB',()=>{
  const alpha=(v,p)=>Math.max(0,Math.min(1,v*p.slope+p.intercept));
  for(const level of [0,40,100]){
    const black=edges.parameters(level,.16,'black'),white=edges.parameters(level,.16,'white');
    for(const v of [0,.1,.16,.18,.3,.5,1])assert.ok(Math.abs(alpha(v,black)-alpha(1-v,white))<1e-10);
    assert.equal(alpha(0,black),0);assert.equal(alpha(1,white),0);assert.equal(alpha(.5,black),1);assert.equal(alpha(.5,white),1);
  }
});
test('edge slider keeps independent thresholds, persists with skins and updates only mask filter controls',()=>{
  const store=new Map([['glasswave_bg_white_threshold','7']]),attrs={};
  const element=id=>({value:0,textContent:'',setAttribute:(key,value)=>attrs[id+':'+key]=value});
  const nodes=Object.fromEntries(['luma-key-func-a','luma-key-feather','luma-key-edge-curve','setting-bg-edge-softness','lbl-bg-edge-softness'].map(id=>[id,element(id)]));
  const ctx={window:{GlassWaveEdgeSmoothing:edges},document:{getElementById:id=>nodes[id]||null,body:{classList:{toggle(){},remove(){}}}},localStorage:{get length(){return store.size;},key:i=>[...store.keys()][i],getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),ctx);
  const ui=Object.create(ctx.window.UIController.prototype);ui.bgLumaColor='black';ui.bgLumaThreshold=20;ui.updateWallpaperEdgeSoftness(75);
  assert.equal(store.get('glasswave_bg_edge_softness'),'75');assert.equal(store.get('glasswave_bg_luma_threshold'),'20');assert.equal(attrs['luma-key-feather:stdDeviation'],.9);
  ui.setWallpaperKeyColor('white');assert.equal(ui.bgLumaThreshold,7);assert.equal(ui.bgEdgeSoftness,75);assert.ok(attrs['luma-key-func-a:slope']<0);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/skinFiles.js'),'utf8'),ctx);
  const skin=ctx.window.GlassWaveSkin.capture({visualizer:{tuning:{},mode:'wave',intensity:1,positionPreset:'behind',offsetY:0,visScale:1}});
  assert.equal(skin.settings.glasswave_bg_edge_softness,'75');
});
test('native rounded region leaves room for compositor antialiasing instead of cutting partial pixels',()=>{
  const hard=roundedShape(160,100,14),soft=roundedShape(160,100,14,2);
  const covers=(shape,x,y)=>shape.some(r=>x>=r.x&&x<r.x+r.width&&y>=r.y&&y<r.y+r.height);
  let gained=0;
  for(let y=0;y<14;y++)for(let x=0;x<14;x++){
    if(covers(hard,x,y))assert.ok(covers(soft,x,y));
    if(covers(soft,x,y)&&!covers(hard,x,y))gained++;
    if(Math.hypot(x+.75-14,y+.75-14)<14)assert.ok(covers(soft,x,y));
  }
  assert.ok(gained>0);assert.equal(covers(soft,0,0),false);assert.equal(covers(soft,80,50),true);
});
