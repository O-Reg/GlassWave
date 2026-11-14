const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),{EventEmitter}=require('node:events');
const LibraryScanner=require('../src/main/scanner');
test('reconciliation indexes the library once, yields, and still detects missing and changed files',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'glasswave-reconcile-'));let scanner;
 try{
  const tracks=new Map();for(let d=0;d<12;d++){const folder=path.join(dir,'d'+d);fs.mkdirSync(folder);for(let i=0;i<30;i++){const p=path.join(folder,i+'.wav');fs.writeFileSync(p,'QA');tracks.set(p,{path:p,mtime:fs.statSync(p).mtimeMs});}}
  const missing=path.join(dir,'d0','missing.wav');tracks.set(missing,{path:missing,mtime:1});
  const changed=path.join(dir,'d0','0.wav');tracks.get(changed).mtime=0;
  let reads=0,parsed=0,removed=[],yielded=false;
  const db={getAllTracks(){reads++;return [...tracks.values()];},getTrack:p=>tracks.get(p),isHidden:()=>false,upsertTrack:t=>tracks.set(t.path,t),batchRemoveTracks:ps=>{removed.push(...ps);for(const p of ps)tracks.delete(p);},save(){}};
  scanner=new LibraryScanner(db,{needsTitleRefresh:()=>false,parseFile:async p=>{parsed++;return {path:p,mtime:fs.statSync(p).mtimeMs};}});
  setImmediate(()=>{yielded=true;});await scanner.scanDirectory(dir);
  assert.equal(reads,1);assert.equal(parsed,1);assert.deepEqual(removed,[missing]);assert.equal(yielded,true);
 }finally{await scanner?.close();fs.rmSync(dir,{recursive:true,force:true});}
});
test('file-change bursts bound parser concurrency and queued duplicate paths coalesce',async()=>{
 const scanner=new LibraryScanner({},{});const jobs=[];let active=0,max=0,done=0;
 scanner.parseAndStore=async()=>{active++;max=Math.max(max,active);await new Promise(r=>jobs.push(r));active--;done++;return false;};
 try{
  for(let i=0;i<100;i++)scanner.queueFileUpdate('song'+i+'.wav',()=>true);
  for(let i=2;i<100;i++)scanner.queueFileUpdate('song'+i+'.wav',()=>true);
  assert.equal(active,2);assert.equal(scanner.pendingUpdates.size,98);
  while(scanner.activeUpdates||scanner.pendingUpdates.size){jobs.splice(0).forEach(r=>r());await new Promise(r=>setImmediate(r));}
  assert.equal(max,2);assert.equal(done,100);
 }finally{await scanner.close();}
});
test('fullscreen restore commits bounds after native exit and publishes one final state',()=>{
 const win=new EventEmitter(),applied=[],sent=[];let fsState=false,max=false;
 Object.assign(win,{isDestroyed:()=>false,isFullScreen:()=>fsState,isMaximized:()=>max,getBounds:()=>({x:0,y:0,width:1000,height:700}),setFullScreen:v=>applied.push(['fullscreen',v]),setBounds:b=>applied.push(['bounds',b]),unmaximize:()=>{max=false;},refreshRoundedShape:()=>applied.push(['shape']),webContents:{send:(...a)=>sent.push(a)}});
 const commits=[];const flush=()=>{while(commits.length)commits.shift()();};
 const context={setImmediate:fn=>commits.push(fn),mainWindow:win,isWindowMaximized:false,isWindowFullscreen:false,isMiniMode:false,savedNormalBounds:{x:25,y:30,width:1180,height:780}};
 const source=fs.readFileSync(path.join(__dirname,'../src/main/main.js'),'utf8');
 vm.runInNewContext(source.slice(source.indexOf('  let lastPresentedState'),source.indexOf('  // Window control IPC')),context);
 context.enterFullscreen();assert.equal(sent.length,0);fsState=true;win.emit('enter-full-screen');assert.equal(sent.length,0);flush();assert.equal(sent.length,2);win.emit('enter-full-screen');flush();assert.equal(sent.length,2);
 context.restoreWindow();assert.equal(applied.filter(x=>x[0]==='bounds').length,0);assert.equal(win.presentationChanging,true);
 fsState=false;win.emit('leave-full-screen');assert.equal(applied.filter(x=>x[0]==='bounds').length,0);flush();assert.equal(applied.filter(x=>x[0]==='bounds').length,1);assert.equal(sent.length,4);assert.equal(win.presentationChanging,false);
});
test('identical native resize events do not reapply the window shape',()=>{
 const handlers={},shapes=[];const win={isDestroyed:()=>false,isMinimized:()=>false,isFullScreen:()=>false,isMaximized:()=>false,getBounds:()=>({width:1180,height:780}),setShape:s=>shapes.push(s),on:(n,f)=>handlers[n]=f};
 const context={module:{exports:{}},require:()=>({screen:{getDisplayMatching:()=>({scaleFactor:1})}})};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/main/roundedWindow.js'),'utf8'),context);context.module.exports.attach(win);
 for(let i=0;i<30;i++)handlers.resize();assert.equal(shapes.length,1);
});
