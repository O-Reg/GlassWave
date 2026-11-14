const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const api=require('../src/renderer/js/displayElements');
test('display element ranges preserve sensible defaults and clamp corrupt skin data',()=>{
  assert.deepEqual(api.normalize(),api.DEFAULTS);assert.deepEqual(api.normalize(null),api.DEFAULTS);
  assert.deepEqual(api.normalize({cover:999,gap:-1,title:NaN,artist:null}),{cover:180,gap:0,title:26,artist:15});
});
test('display sizes apply live and skin restore does not touch playback or overwrite saved controls',()=>{
  const props={},nodes={},store=new Map(),frames=new Map();let seq=0,invalid=0,placed=0;
  for(const k of ['cover','gap','title','artist']){nodes['display-'+k]={addEventListener:(name,fn)=>nodes['display-'+k][name]=fn};nodes['display-'+k+'-value']={};}
  nodes['display-reset']={addEventListener:(name,fn)=>nodes['display-reset'][name]=fn};
  const document={documentElement:{style:{setProperty:(k,v)=>props[k]=v}},getElementById:id=>nodes[id]};
  const ctx={document,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},window:{lyricsController:{updatePlacement:()=>placed++}},requestAnimationFrame:fn=>{frames.set(++seq,fn);return seq;},cancelAnimationFrame:id=>frames.delete(id)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/displayElements.js'),'utf8'),ctx);
  const controls=ctx.window.GlassWaveDisplayElements,ui={visualizer:{invalidateCoverMetrics:()=>invalid++}};controls.init(ui);
  nodes['display-cover'].value='150';nodes['display-cover'].input({target:nodes['display-cover']});nodes['display-title'].value='39';nodes['display-title'].input({target:nodes['display-title']});
  assert.equal(frames.size,1);[...frames.values()][0]();frames.clear();
  assert.equal(props['--display-cover-ratio'],'1.5');assert.equal(props['--display-title-ratio'],'1.5');
  assert.equal(JSON.parse(store.get(api.KEY)).cover,150);assert.equal(nodes['display-cover-value'].textContent,'150%');
  store.set(api.KEY,JSON.stringify({cover:70,gap:30,title:20,artist:12}));controls.restore(ui);
  assert.equal(props['--display-cover-ratio'],'0.7');assert.equal(nodes['display-gap'].value,30);assert.ok(invalid>=3&&placed>=3);
  nodes['display-artist'].value='18';nodes['display-artist'].input({target:nodes['display-artist']});[...frames.values()][0]();frames.clear();assert.equal(JSON.parse(store.get(api.KEY)).cover,70);assert.equal(JSON.parse(store.get(api.KEY)).artist,18);
  nodes['display-reset'].click();assert.equal(store.has(api.KEY),false);assert.equal(props['--display-cover-ratio'],'1');
});
