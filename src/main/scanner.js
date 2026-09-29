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
    this.reconcileTimer=setInterval(()=>this.reconcile(),30000);this.reconcileTimer.unref();
  }
  isSupportedAudio(p){return AUDIO_EXTS.has(path.extname(p).toLowerCase());}
  isSupportedImage(p){return IMAGE_EXTS.has(path.extname(p).toLowerCase());}
  async reconcile(){for(const root of this.watchers.keys())await this.scanDirectory(root);}
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
    const walk=async dir=>{
      if(!valid())return;
      let entries;
      try{entries=await fs.promises.readdir(dir,{withFileTypes:true});}
      catch(e){if(['ENOENT','ENOTDIR'].includes(e.code))missing.push(...this.db.getAllTracks().filter(t=>inside(t.path,dir)).map(t=>t.path));return;}
      const names=new Set(entries.map(e=>e.name.toLowerCase()));
      // Only prune absent children of directories that were successfully read.
      for(const t of this.db.getAllTracks())if(inside(t.path,dir)){
        const first=path.relative(dir,t.path).split(path.sep)[0].toLowerCase();if(!names.has(first))missing.push(t.path);
      }
      for(const e of entries){
        if(!valid())return;
        const p=path.join(dir,e.name);
        if(e.isDirectory())await walk(p);
        else if(e.isFile()&&this.isSupportedAudio(p)&&!this.db.isHidden(p)){
          try{const stat=await fs.promises.stat(p),old=this.db.getTrack(p);if(!old||old.mtime!==stat.mtimeMs)changed=(await this.parseAndStore(p,valid))||changed;}catch{}
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
    const update=async p=>{if(!valid())return;if(this.isSupportedAudio(p)){if(await this.parseAndStore(p,valid))this.scheduleSaveAndUpdate();}else if(this.isSupportedImage(p))await this.scanDirectory(path.dirname(p));};
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
    this.debounceTimer=setTimeout(()=>{this.debounceTimer=null;this.db.save();this.triggerUpdate();},250);
  }
  triggerUpdate(){if(this.onUpdate)this.onUpdate(this.db.getAllTracks());}
  async close(){clearInterval(this.reconcileTimer);clearTimeout(this.debounceTimer);await Promise.all([...this.watchers.keys()].map(p=>this.unwatchFolder(p)));}
}
module.exports=LibraryScanner;
