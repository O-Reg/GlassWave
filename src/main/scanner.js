const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const AUDIO_EXTS = new Set(['.mp3','.flac','.wav','.aac','.m4a','.ogg','.opus','.aiff','.wma']);
const IMAGE_EXTS = new Set(['.jpg','.jpeg','.png','.webp','.bmp']);
const inside=(p,root)=>{const r=path.relative(root,p);return r==='' || (r!=='..'&&!r.startsWith('..'+path.sep)&&!path.isAbsolute(r));};
class LibraryScanner {
  constructor(database,metadataParser,onUpdateCallback) {
    this.db=database;this.parser=metadataParser;this.onUpdate=onUpdateCallback;
    this.watchers=new Map();this.scans=new Map();this.versions=new Map();this.debounceTimer=null;
    this.pendingUpdates=new Map();this.activeUpdates=0;this.closed=false;
    this.reconcileTimer=setInterval(()=>this.reconcile(),30000);this.reconcileTimer.unref();
  }
  isSupportedAudio(p){return AUDIO_EXTS.has(path.extname(p).toLowerCase());}
  isSupportedImage(p){return IMAGE_EXTS.has(path.extname(p).toLowerCase());}
  reconcile(){
    if(this.closed)return Promise.resolve();
    if(this.reconcileJob)return this.reconcileJob;
    this.reconcileJob=(async()=>{for(const root of this.watchers.keys())await this.scanDirectory(root);})()
      .finally(()=>{this.reconcileJob=null;});
    return this.reconcileJob;
  }
  queueFileUpdate(p,valid){
    this.pendingUpdates.set(p,valid);
    this.drainFileUpdates();
  }
  drainFileUpdates(){
    while(!this.closed && this.activeUpdates<2 && this.pendingUpdates.size){
      const [p,valid]=this.pendingUpdates.entries().next().value;
      this.pendingUpdates.delete(p);this.activeUpdates++;
      (async()=>{
        if(!valid())return;
        if(this.isSupportedAudio(p)){if(await this.parseAndStore(p,valid))this.scheduleSaveAndUpdate();}
        else if(this.isSupportedImage(p))await this.scanDirectory(path.dirname(p));
      })().catch(e=>console.warn('Music update:',e.message)).finally(()=>{
        this.activeUpdates--;setImmediate(()=>this.drainFileUpdates());
      });
    }
  }
  async refreshAmbiguousTitles(){
    let changed=false;
    for(const track of this.db.getAllTracks()){
      if(this.parser.needsTitleRefresh(track)) changed=(await this.parseAndStore(track.path))||changed;
    }
    if(changed)this.scheduleSaveAndUpdate();
  }
  async parseAndStore(p,valid=()=>true){
    const version=(this.versions.get(p)||0)+1;this.versions.set(p,version);
    try {
      if(this.db.isHidden(p))return false;
      const before=await fs.promises.stat(p),track=await this.parser.parseFile(p),after=await fs.promises.stat(p);
      if(!valid()||this.versions.get(p)!==version||this.db.isHidden(p)||before.mtimeMs!==after.mtimeMs||before.size!==after.size)return false;
      this.db.upsertTrack(track);return true;
    } catch(e){if(!['ENOENT','ENOTDIR'].includes(e.code))console.warn('Audio scan:',p,e.message);return false;}
  }
  scanDirectory(root){
    if(this.scans.has(root))return this.scans.get(root);
    const watcher=this.watchers.get(root),valid=()=>!watcher||this.watchers.get(root)===watcher;
    const job=this.scan(root,valid).finally(()=>this.scans.delete(root));this.scans.set(root,job);return job;
  }
  async scan(root,valid){
    let changed=false;const missing=[];
    // Index once: never enrich and re-walk the complete library for every folder.
    const tracks=this.db.tracks instanceof Map?[...this.db.tracks.values()]:this.db.getAllTracks();
    const children=new Map();let work=0;
    for(const track of tracks){
      if(inside(track.path,root)){
        const parts=path.relative(root,track.path).split(path.sep);let dir=root;
        for(const name of parts){
          if(!children.has(dir))children.set(dir,new Map());
          const names=children.get(dir),key=name.toLowerCase();
          if(!names.has(key))names.set(key,[]);
          names.get(key).push(track.path);dir=path.join(dir,name);
        }
      }
      if(++work%256===0)await new Promise(resolve=>setImmediate(resolve));
    }
    const walk=async dir=>{
      if(!valid())return;
      let entries;
      try{entries=await fs.promises.readdir(dir,{withFileTypes:true});}
      catch(e){if(['ENOENT','ENOTDIR'].includes(e.code))for(const paths of children.get(dir)?.values()||[])missing.push(...paths);return;}
      const names=new Set(entries.map(e=>e.name.toLowerCase()));
      // Only prune absent children of directories that were successfully read.
      for(const [name,paths] of children.get(dir)||[])if(!names.has(name))missing.push(...paths);
      for(const e of entries){
        if(++work%64===0)await new Promise(resolve=>setImmediate(resolve));
        if(!valid())return;
        const p=path.join(dir,e.name);
        if(e.isDirectory())await walk(p);
        else if(e.isFile()&&this.isSupportedAudio(p)&&!this.db.isHidden(p)){
          try{const stat=await fs.promises.stat(p),old=this.db.getTrack(p);if(!old||old.mtime!==stat.mtimeMs||this.parser.needsTitleRefresh?.(old))changed=(await this.parseAndStore(p,valid))||changed;}catch{}
        }
      }
    };
    await walk(root);if(!valid())return;
    if(missing.length){for(const p of missing)this.versions.set(p,(this.versions.get(p)||0)+1);this.db.batchRemoveTracks([...new Set(missing)]);changed=true;}
    if(changed)this.scheduleSaveAndUpdate();
  }
  watchFolder(root){
    if(this.watchers.has(root))return;
    const watcher=chokidar.watch(root,{ignored:/(^|[\/\\])\../,persistent:true,ignoreInitial:true,awaitWriteFinish:{stabilityThreshold:1000,pollInterval:150}});
    this.watchers.set(root,watcher);
    const valid=()=>this.watchers.get(root)===watcher;
    const update=p=>{if(valid()&&(this.isSupportedAudio(p)||this.isSupportedImage(p)))this.queueFileUpdate(p,valid);};
    watcher.on('add',update).on('change',update).on('unlink',p=>{
      if(!valid()||!this.isSupportedAudio(p))return;
      this.versions.set(p,(this.versions.get(p)||0)+1);this.db.batchRemoveTracks([p]);this.scheduleSaveAndUpdate();
    }).on('unlinkDir',dir=>{
      if(!valid())return;const removed=this.db.getAllTracks().filter(t=>inside(t.path,dir)).map(t=>t.path);
      for(const p of removed)this.versions.set(p,(this.versions.get(p)||0)+1);
      if(removed.length){this.db.batchRemoveTracks(removed);this.scheduleSaveAndUpdate();}
    }).on('ready',()=>{if(valid())this.scanDirectory(root);}).on('error',e=>console.warn('Music watcher:',root,e.message));
  }
  async unwatchFolder(root){const w=this.watchers.get(root);this.watchers.delete(root);if(w)await w.close();}
  scheduleSaveAndUpdate(){
    // Bounded batching: a continuous import must not postpone the UI forever.
    if(this.debounceTimer)return;
    this.debounceTimer=setTimeout(()=>{this.debounceTimer=null;this.db.save();this.triggerUpdate();},750);
  }
  triggerUpdate(){if(this.onUpdate)this.onUpdate(this.db.getAllTracks());}
  async close(){this.closed=true;this.pendingUpdates.clear();clearInterval(this.reconcileTimer);clearTimeout(this.debounceTimer);await Promise.all([...this.watchers.keys()].map(p=>this.unwatchFolder(p)));}
}
module.exports=LibraryScanner;
