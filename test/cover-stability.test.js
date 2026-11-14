const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const browser=require('../src/renderer/js/libraryBrowser');
test('scrolling preserves the exact card node for every song still inside the rendered range',()=>{
 const scroll={scrollTop:0,clientHeight:700,clientWidth:1000},container={clientWidth:1000,appendChild(){}},spacer={style:{}};
 const context={window:{GlassWaveLibraryBrowser:browser},document:{getElementById:id=>id==='track-list-scroll-view'?scroll:id==='track-list-container'?container:id==='virtual-scroll-spacer'?spacer:null}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),context);
 const ui=Object.assign(Object.create(context.window.UIController.prototype),{filteredTracks:Array.from({length:1000},(_,i)=>({path:'song'+i,id:i})),audioEngine:{currentTrack:null},selectedTrackPaths:new Set(),rowPool:[],isLibraryScrolling:true,BUFFER_ITEMS:6,ROW_STRIDE:56});
 ui.createPoolRow=()=>({dataset:{},style:{},classList:{}});ui.updatePoolRow=(row,track,index)=>{row.dataset.trackPath=track.path;row.dataset.index=index;row.style.display='block';};
 for(const mode of Object.keys(browser.MODES)){
  ui.libraryDisplayMode=mode;ui.updateVirtualScroll(true);
  for(let step=1;step<30;step++){
   const before=new Map(ui.rowPool.filter(r=>r.style.display!=='none').map(r=>[r.dataset.trackPath,r]));
   scroll.scrollTop=step*ui.getLibraryLayout().stride;ui.updateVirtualScroll();
   for(const row of ui.rowPool.filter(r=>r.style.display!=='none'))if(before.has(row.dataset.trackPath))assert.equal(row,before.get(row.dataset.trackPath),'retained song was unnecessarily rebound');
  }
 }
});
