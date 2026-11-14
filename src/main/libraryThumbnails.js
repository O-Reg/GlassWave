const fs=require('node:fs'),path=require('node:path');
class LibraryThumbnails {
  constructor(nativeImage,resolveTrack){this.nativeImage=nativeImage;this.resolveTrack=resolveTrack;this.cache=new Map();this.pending=new Map();this.bytes=0;}
  get(target){
    if(typeof target!=='string'||!target)return Promise.resolve(null);
    const image=/\.(png|jpe?g|webp|bmp)$/i.test(target)?target:this.resolveTrack(target)?.coverPath;
    if(!image)return Promise.resolve(null);
    if(this.pending.has(image))return this.pending.get(image);
    const job=this.load(image).catch(()=>null).finally(()=>this.pending.delete(image));this.pending.set(image,job);return job;
  }
  async load(image){
    const stat=await fs.promises.stat(image);if(stat.size>6*1024*1024)return null;
    const signature=stat.mtimeMs+':'+stat.size,cached=this.cache.get(image);
    if(cached?.signature===signature){this.cache.delete(image);this.cache.set(image,cached);return cached.data;}
    const buffer=await fs.promises.readFile(image),source=this.nativeImage.createFromBuffer(buffer);
    if(source.isEmpty())return null;
    const size=source.getSize(),scale=Math.min(1,320/Math.max(size.width,size.height));
    const thumbnail=source.resize({width:Math.max(1,Math.round(size.width*scale)),height:Math.max(1,Math.round(size.height*scale)),quality:'good'});
    const data=thumbnail.toDataURL();if(cached)this.bytes-=cached.data.length;
    this.cache.delete(image);this.cache.set(image,{signature,data});this.bytes+=data.length;
    while(this.cache.size>192||this.bytes>24*1024*1024){const first=this.cache.keys().next().value;this.bytes-=this.cache.get(first).data.length;this.cache.delete(first);}
    return data;
  }
}
module.exports=LibraryThumbnails;
