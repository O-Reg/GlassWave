const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process');
const {PlaybackDecoder}=require('../src/main/playbackDecoder');
async function fixture(fn){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'glasswave-decoder-test-'));try{await fn(dir);}finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(dir).startsWith('glasswave-decoder-test-'));await fs.rm(dir,{recursive:true,force:true});}}
test('decoder rejects unknown and relative files before creating any cache',async()=>fixture(async dir=>{
 const decoder=new PlaybackDecoder({cacheDir:path.join(dir,'cache'),isKnownTrack:()=>false});await assert.rejects(()=>decoder.resolve('relative.wma'),/当前曲库/);await assert.rejects(()=>decoder.resolve(path.join(dir,'secret.txt')),/当前曲库/);await assert.rejects(()=>fs.stat(path.join(dir,'cache')),/ENOENT/);
}));
test('missing compatible decoder reports a useful error and preserves the original',async()=>fixture(async dir=>{
 const file=path.join(dir,'song.wma');await fs.writeFile(file,'original');const decoder=new PlaybackDecoder({cacheDir:path.join(dir,'cache'),isKnownTrack:p=>p===file,executable:path.join(dir,'missing-decoder.exe')});await assert.rejects(()=>decoder.resolve(file),/FFmpeg/);assert.equal(await fs.readFile(file,'utf8'),'original');
}));
test('cache cleanup removes only generated old WAVs inside its own directory',async()=>fixture(async dir=>{
 const cache=path.join(dir,'cache');await fs.mkdir(cache);const keep=path.join(cache,'a'.repeat(64)+'.wav'),old=path.join(cache,'b'.repeat(64)+'.wav'),unrelated=path.join(cache,'personal.wav');await fs.writeFile(keep,Buffer.alloc(80));await fs.writeFile(old,Buffer.alloc(80));await fs.writeFile(unrelated,'keep me');
 const decoder=new PlaybackDecoder({cacheDir:cache,isKnownTrack:()=>true,maxBytes:100});await decoder.prune(keep);await assert.rejects(()=>fs.stat(old),/ENOENT/);assert.equal(await fs.readFile(unrelated,'utf8'),'keep me');assert.equal((await fs.stat(keep)).size,80);
}));
test('FFmpeg decodes to PCM cache without modifying source and reuses a validated cache',async t=>{
 if(cp.spawnSync('ffmpeg',['-version'],{windowsHide:true}).error){t.skip('FFmpeg unavailable');return;}
 await fixture(async dir=>{
  const file=path.join(dir,'tone.flac');cp.execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-nostdin','-f','lavfi','-i','sine=frequency=997:sample_rate=48000:duration=0.1',file],{windowsHide:true});
  const before=await fs.readFile(file),decoder=new PlaybackDecoder({cacheDir:path.join(dir,'cache'),isKnownTrack:p=>p===file});const a=await decoder.resolve(file),b=await decoder.resolve(file);assert.equal(a.cached,false);assert.equal(b.cached,true);assert.equal(a.url,b.url);assert.deepEqual(await fs.readFile(file),before);
  const output=await fs.readFile(new URL(a.url));assert.equal(output.toString('ascii',8,12),'WAVE');assert.ok(output.length>44);
 });
});
