const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const handlers={},els={},timers=[];
 const context={performance:{now:()=>1000},setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},window:{addEventListener:(n,fn,opt)=>{handlers[n]=fn;handlers[n+'Options']=opt;}},document:{getElementById:id=>els[id]||null,querySelector:()=>null}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),context);
 const ui=Object.create(context.window.UIController.prototype);
 return {ui,handlers,els,timers,context};
}
test('wheel captures once before child handlers and ignores delayed input instead of replaying gain',()=>{
 const {ui,handlers}=fixture();let changes=0;ui.currentView='player';ui.adjustVolumeByWheel=()=>changes++;
 ui.bindGlobalVolumeWheel();ui.bindGlobalVolumeWheel();assert.equal(handlers.wheelOptions.capture,true);
 const fire=stamp=>{let stopped=false;const e={deltaY:100,timeStamp:stamp,target:{closest:()=>null},preventDefault(){this.defaultPrevented=true;},stopPropagation(){stopped=true;}};handlers.wheel(e);return {e,stopped};};
 assert.equal(fire(900).stopped,true);assert.equal(changes,1);
 assert.equal(fire(100).e.defaultPrevented,true);assert.equal(changes,1);
 fire(995);assert.equal(changes,2);
});
test('rapid wheel reversals commit audio immediately with a single latest-only visual update',()=>{
 const {ui,timers,els}=fixture();let feedback=[],syncs=0;
 ui.audioEngine={volume:.5,setVolume(v){this.volume=v;}};
 els['volume-slider']={style:{setProperty(){}},value:0};
 ui.syncPrimaryControlStates=()=>syncs++;ui.showVolumeSliderTooltip=p=>feedback.push(p);ui.showVolumeHud=()=>{};
 for(let i=0;i<8;i++)ui.adjustVolumeByWheel(true);
 for(let i=0;i<3;i++)ui.adjustVolumeByWheel(false);
 assert.equal(ui.audioEngine.volume,.75);assert.equal(timers.length,1);assert.equal(feedback.length,0);
 timers[0]();assert.deepEqual(feedback,[75]);assert.equal(syncs,1);assert.equal(ui.audioEngine.volume,.75);
});
function searchFixture(){
 const f=fixture(),{ui,els}=f;
 els['search-input']={value:'',addEventListener:(n,fn)=>f.handlers[n]=fn,focus(){}};
 els['btn-search-clear']={style:{},setAttribute(){}};els['search-results-count']={style:{}};
 ui.currentView='library';ui.currentSubView='all';ui.categories=[{id:'warm',trackPaths:['a','b']}];
 ui.allTracks=Array.from({length:3000},(_,i)=>({path:i===0?'a':i===1?'b':`song${i}`}));
 ui.searchQuery='';ui.filteredTracks=[];ui.applyFilterAndSort=()=>{};
 const engine=ui.audioEngine={volume:.5,currentTrack:ui.allTracks[0],audio:{currentTime:42.5,paused:false},setQueue(tracks,index,scope){this.playbackQueue=[...tracks];this.queueIndex=index;this.playbackScope=scope;},loadTrack(){throw Error('must not reload audio');}};
 ui.bindSearch();return {...f,engine};
}
test('clearing search restores 3000-song playback without replacing audio or seeking',()=>{
 const {ui,engine,els,handlers}=searchFixture();
 els['search-input'].value='a';handlers.input();engine.setQueue(ui.allTracks.slice(0,10),0,{type:'library'});
 ui._searchPlaybackSession={queue:engine.playbackQueue,paths:engine.playbackQueue.map(t=>t.path),scope:{type:'library'}};
 const current=engine.currentTrack;els['btn-search-clear'].onclick({stopPropagation(){}});
 assert.equal(engine.playbackQueue.length,3000);assert.equal(engine.currentTrack,current);assert.equal(engine.audio.currentTime,42.5);assert.equal(engine.audio.paused,false);
});
test('category search stays in category and restores only that category',()=>{
 const {ui,engine,els,handlers}=searchFixture();ui.currentSubView='category:warm';
 els['search-input'].value='a';handlers.input();assert.equal(ui.currentSubView,'category:warm');
 engine.setQueue([ui.allTracks[0]],0,{type:'category',categoryId:'warm'});
 ui._searchPlaybackSession={queue:engine.playbackQueue,paths:['a'],scope:engine.playbackScope};
 els['search-input'].value='';handlers.input();assert.deepEqual(engine.playbackQueue.map(t=>t.path),['a','b']);assert.equal(engine.playbackScope.categoryId,'warm');
});
test('clearing a search respects a manually edited queue',()=>{
 const {ui,engine}=searchFixture();engine.setQueue([ui.allTracks[0]],0,{type:'library'});
 ui._searchPlaybackSession={queue:engine.playbackQueue,paths:['a'],scope:engine.playbackScope};engine.playbackQueue.push(ui.allTracks[1]);
 ui.restoreSearchPlaybackScope();assert.equal(engine.playbackQueue.length,2);
});
