const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process'),{pathToFileURL}=require('node:url');
class PlaybackDecoder {
  constructor({cacheDir,isKnownTrack,executable='ffmpeg',maxBytes=512*1024*1024}){Object.assign(this,{cacheDir:path.resolve(cacheDir),isKnownTrack,executable,maxBytes});this.jobs=new Map();this.tail=Promise.resolve();}
  async resolve(file){
    if(this.closed)throw Error('兼容解码器已关闭');
    if(typeof file!=='string'||!path.isAbsolute(file)||!this.isKnownTrack(file))throw Error('只能解码当前曲库中的音频');
    const stat=await fs.stat(file);if(!stat.isFile())throw Error('音频文件不存在');
    const key=crypto.createHash('sha256').update(JSON.stringify([path.resolve(file),stat.size,stat.mtimeMs,'pcm-f32-v1'])).digest('hex');
    if(this.jobs.has(key))return this.jobs.get(key);
    const job=this.tail.then(()=>this.convert(file,stat,key));this.tail=job.catch(()=>{});this.jobs.set(key,job);
    try{return await job;}finally{this.jobs.delete(key);}
  }
  async convert(file,stat,key){
    if(this.closed)throw Error('兼容解码器已关闭');
    await fs.mkdir(this.cacheDir,{recursive:true});const target=path.join(this.cacheDir,key+'.wav'),temp=path.join(this.cacheDir,key+'.next.wav');
    try{const cached=await fs.stat(target);if(cached.size>44){await fs.utimes(target,new Date(),new Date());return {url:pathToFileURL(target).href,cached:true};}}catch{}
    await new Promise((resolve,reject)=>{
      const args=['-hide_banner','-loglevel','error','-nostdin','-y','-xerror','-protocol_whitelist','file,pipe','-i',file,'-map','0:a:0','-vn','-sn','-dn','-c:a','pcm_f32le','-f','wav',temp];
      const child=spawn(this.executable,args,{windowsHide:true,stdio:['ignore','ignore','pipe']});this.child=child;let errorText='',failure=null,settled=false;
      const finish=error=>{if(settled)return;settled=true;if(this.child===child)this.child=null;clearTimeout(timeout);clearInterval(sizeCheck);error?reject(error):resolve();};
      const timeout=setTimeout(()=>{failure=Error('兼容解码超时，请重试');child.kill();},60000);
      const sizeCheck=setInterval(async()=>{try{if((await fs.stat(temp)).size>this.maxBytes){failure=Error('兼容解码缓存超过512MB，请使用原生支持格式');child.kill();}}catch{}},500);
      child.stderr.on('data',chunk=>{errorText=(errorText+chunk.toString()).slice(-3000);});
      child.on('error',error=>finish(Error(error.code==='ENOENT'?'未找到兼容解码器 FFmpeg；此格式暂无法播放':'无法启动兼容解码器')));
      child.on('close',code=>finish(failure||(code!==0?Error('兼容解码失败：'+errorText.trim().slice(-250)):null)));
    }).catch(async error=>{await fs.unlink(temp).catch(()=>{});throw error;});
    const after=await fs.stat(file),output=await fs.stat(temp);
    if(after.size!==stat.size||after.mtimeMs!==stat.mtimeMs||output.size<=44||output.size>this.maxBytes){await fs.unlink(temp).catch(()=>{});throw Error('解码期间源文件发生变化或输出无效，请重试');}
    await fs.rename(temp,target);await this.prune(target);return {url:pathToFileURL(target).href,cached:false};
  }
  async prune(keep){
    const files=[];for(const name of await fs.readdir(this.cacheDir)){
      if(!/^[a-f0-9]{64}\.wav$/.test(name))continue;const file=path.join(this.cacheDir,name);try{const s=await fs.stat(file);files.push({file,size:s.size,time:s.mtimeMs});}catch{}
    }
    let total=files.reduce((s,f)=>s+f.size,0);for(const item of files.sort((a,b)=>a.time-b.time)){
      if(total<=this.maxBytes)break;if(item.file===keep)continue;try{await fs.unlink(item.file);total-=item.size;}catch{}
    }
  }
  dispose(){this.closed=true;this.child?.kill();}
}
module.exports={PlaybackDecoder};
