const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
  const handlers={},elements={},changes=[];
  const context={window:{innerHeight:800,addEventListener:(name,fn)=>{handlers[name]=fn;}},document:{getElementById:id=>elements[id]||null}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),context);
  const ui=Object.assign(Object.create(context.window.UIController.prototype),{currentView:'player',adjustVolumeByWheel:up=>changes.push(up)});
  const target=(...ancestors)=>({closest:selectors=>selectors.split(',').some(s=>ancestors.includes(s.trim()))?{}:null});
  ui.bindGlobalVolumeWheel();
  const wheel=(ancestors,extra={})=>{const e={target:target(...ancestors),clientX:700,clientY:20,deltaY:-100,prevented:false,preventDefault(){this.prevented=true;},...extra};handlers.wheel(e);return e;};
  return {ui,elements,changes,wheel};
}
test('titlebar and playback chrome control volume in every page without changing library scrolling',()=>{
  const f=fixture();
  for(const view of ['player','library','favorites','recent','folders','settings']){
    f.ui.currentView=view;
    for(const chrome of ['#titlebar','.glass-player-bar','.zen-floating-toggle'])assert.equal(f.wheel([chrome]).prevented,true);
    const before=f.changes.length;
    assert.equal(f.wheel(['#view-library','.track-row']).prevented,false);
    assert.equal(f.changes.length,before);
  }
  assert.equal(f.changes.length,18);assert.ok(f.changes.every(Boolean));
});
test('open drawers do not steal wheels over the header or bottom bar outside their actual rectangle',()=>{
  for(const id of ['glass-queue-drawer','view-settings']){
    const f=fixture(),list={scrollTop:0};f.ui.currentView='library';
    f.elements['queue-track-list']=list;
    f.elements[id]={classList:{contains:()=>true},getBoundingClientRect:()=>({left:600,right:1000,top:48,bottom:700}),querySelector:()=>list};
    assert.equal(f.wheel(['#titlebar']).prevented,true);
    assert.equal(f.wheel(['.glass-player-bar'],{clientY:760}).prevented,true);
    assert.equal(list.scrollTop,0);assert.equal(f.changes.length,2);
    f.wheel([id],{clientY:100});assert.equal(f.changes.length,2);assert.equal(list.scrollTop,-100);
  }
});
test('menus, lyric settings, sliders, consumed events and zoom gestures never change volume',()=>{
  const f=fixture();
  for(const surface of ['.lyrics-settings-panel','#view-visualizer-drawer','.settings-content','.search-more-popover','.glass-hifi-popover','.glass-modal-backdrop','.glass-confirm-dialog','select','textarea','input[type="range"]']){
    assert.equal(f.wheel([surface,'#titlebar']).prevented,false,surface);
  }
  for(const extra of [{deltaY:0},{deltaY:NaN},{ctrlKey:true},{defaultPrevented:true}])assert.equal(f.wheel(['#titlebar'],extra).prevented,false);
  assert.equal(f.changes.length,0);
  assert.equal(f.wheel(['#titlebar'],{deltaY:100}).prevented,true);assert.deepEqual(f.changes,[false]);
});
