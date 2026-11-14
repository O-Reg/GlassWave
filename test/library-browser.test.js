const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const browser=require('../src/renderer/js/libraryBrowser');
test('five layouts virtualize visible rows and index offsets consistently across narrow and ultrawide widths',()=>{
 for(const mode of Object.keys(browser.MODES))for(const width of [280,640,1600,3200]){
  const m=browser.layout(mode,width,6000);assert.ok(m.columns>=1);assert.ok(m.cellWidth*m.columns+16*(m.columns-1)<=width||!m.grid);
  for(const index of [0,199,5999]){const top=browser.offset(index,m),r=browser.range(top,700,6000,m);assert.ok(index>=r.start&&index<r.end);assert.ok(r.end-r.start<200);assert.equal(r.start%m.columns,0);}
  assert.equal(m.totalHeight,Math.ceil(6000/m.columns)*m.stride);
 }
});
test('directory browser distinguishes direct songs, child versions, prefix collisions and Windows path casing',()=>{
 const tracks=[{path:'K:\\Music\\第一版\\same.wav'},{path:'k:/music/第一版/extra/a.wav'},{path:'K:/Music/第二版/same.wav'},{path:'K:/Music/root.wav'},{path:'K:/Music-old/foreign.wav'}];
 assert.deepEqual(browser.folders(tracks,'K:/Music').map(x=>[x.name,x.count]),[['第一版',2],['第二版',1]]);
 assert.equal(tracks.filter(t=>browser.direct(t.path,'K:/Music')).length,1);assert.equal(tracks.filter(t=>browser.inside(t.path,'K:/Music')).length,4);
 assert.equal(tracks.filter(t=>browser.direct(t.path,'k:/music/第一版')).length,1);assert.equal(browser.name('K:/Music/第一版/'),'第一版');
 assert.equal(browser.inside('//server/share/music/sub/a.wav','\\\\server\\share\\music'),true);
});
test('folder playback scope survives restart without narrowing to an old search subset',()=>{
 const context={window:{GlassWaveLibraryBrowser:browser},console};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/audioEngine.js'),'utf8'),context);
 const engine=Object.create(context.window.AudioEngine.prototype),tracks=[{path:'K:/Music/第一版/a.wav'},{path:'K:/Music/第一版/b.wav'},{path:'K:/Music/第一版/sub/c.wav'},{path:'K:/Music/第二版/a.wav'}];
 engine.restoreStartupQueue(tracks,{lastTrackPath:tracks[0].path,playbackScope:{type:'folder',folderPath:'K:/Music/第一版',includeSubfolders:false}});assert.equal(engine.playbackQueue.length,2);assert.equal(engine.playbackScope.type,'folder');
 engine.restoreStartupQueue(tracks,{lastTrackPath:tracks[0].path,playbackScope:{type:'folder',folderPath:'K:/Music/第一版',includeSubfolders:true}});assert.equal(engine.playbackQueue.length,3);
 engine.restoreStartupQueue(tracks,{lastTrackPath:tracks[3].path,playbackScope:{type:'folder',folderPath:'K:/Music/第一版'}});assert.equal(engine.playbackQueue.length,4);assert.equal(engine.playbackScope.type,'library');
});
