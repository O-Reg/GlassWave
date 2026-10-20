const zlib=require('node:zlib');

// Transparent 32px glyphs rasterized locally, without external image dependencies.
function iconPNG(name,dark){
  const width=32,raw=Buffer.alloc((width*4+1)*width),ink=dark?242:44;
  const triangle=(x,y,left)=>left?(x>=10&&x<=25&&Math.abs(y-16)<=(x-10)*.8):(x>=8&&x<=23&&Math.abs(y-16)<=(23-x)*.8);
  for(let y=0;y<width;y++)for(let x=0;x<width;x++){
    let on=false;
    if(name==='pause')on=y>=6&&y<26&&((x>=8&&x<13)||(x>=19&&x<24));
    else if(name==='play')on=triangle(x,y,false);
    else if(name==='previous')on=(x>=5&&x<8&&y>=5&&y<27)||triangle(x,y,true);
    else if(name==='next')on=(x>=24&&x<27&&y>=5&&y<27)||triangle(x,y,false);
    if(on){const i=y*(width*4+1)+1+x*4;raw[i]=raw[i+1]=raw[i+2]=ink;raw[i+3]=255;}
  }
  function crc(data){let c=0xffffffff;for(const byte of data){c^=byte;for(let j=0;j<8;j++)c=(c>>>1)^(c&1?0xedb88320:0);}return(c^0xffffffff)>>>0;}
  function chunk(type,data){const tag=Buffer.from(type),out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length,0);tag.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([tag,data])),8+data.length);return out;}
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(width,4);header[8]=8;header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}

const SHORTCUTS={MediaPlayPause:'play-pause',MediaNextTrack:'next',MediaPreviousTrack:'previous',MediaStop:'stop'};
const CHANNELS={'play-pause':'media-play-pause',play:'media-play',pause:'media-pause',next:'media-next',previous:'media-prev',stop:'media-stop'};
class WindowsMediaControls {
  constructor({window,globalShortcut,nativeImage,nativeTheme,ipcMain,powerMonitor,log=()=>{},platform=process.platform,now=Date.now,setTimer=setInterval,clearTimer=clearInterval}){
    Object.assign(this,{window,globalShortcut,nativeImage,nativeTheme,ipcMain,powerMonitor,log,platform,now,clearTimer});
    this.state={playing:false,available:false,title:'',artist:''};this.owned=new Set();this.failed=new Set();this.icons=new Map();this.last=null;this.disposed=false;this.toolbarRetries=0;this.toolbarTimer=null;
    this.onState=(event,state)=>{if(event.sender===window.webContents)this.update(state);};
    this.onCommand=(event,command)=>{if(event.sender===window.webContents)this.dispatch(command,'media-session');};
    ipcMain.on('player-media-state',this.onState);ipcMain.on('player-media-command',this.onCommand);
    this.onAppCommand=(event,command)=>{const action={'media-play-pause':'play-pause','media-nexttrack':'next','media-previoustrack':'previous','media-play':'play','media-pause':'pause','media-stop':'stop'}[command];if(action){event.preventDefault?.();this.dispatch(action,'app-command');}};
    window.on('app-command',this.onAppCommand);
    this.onFocus=()=>this.register();window.on('focus',this.onFocus);
    this.onRefresh=()=>{this.toolbarRetries=0;this.refresh();};for(const event of ['ready-to-show','restore','show'])window.on(event,this.onRefresh);
    this.onTheme=()=>{this.icons.clear();this.refresh();};nativeTheme?.on('updated',this.onTheme);
    powerMonitor?.on('resume',this.onFocus);
    window.once('closed',()=>this.dispose());
    this.timer=setTimer(()=>{if(this.failed.size)this.register();},30000);this.timer?.unref?.();
  }
  register(){
    if(this.disposed)return;
    for(const [key,command] of Object.entries(SHORTCUTS)){
      if(this.owned.has(key)&&this.globalShortcut.isRegistered(key))continue;
      let success=false;try{success=this.globalShortcut.register(key,()=>this.dispatch(command,'global-shortcut'));}catch(error){this.log('Media key registration error: '+key+' '+error.message);}
      if(success){this.owned.add(key);if(this.failed.delete(key))this.log('Media key registration recovered: '+key);}
      else{if(!this.failed.has(key))this.log('Media key unavailable (already reserved or blocked): '+key);this.failed.add(key);}
    }
  }
  dispatch(command,source){
    if(this.disposed||!CHANNELS[command]||!this.state.available||this.window.isDestroyed())return false;
    const time=this.now(),family=['play-pause','play','pause'].includes(command)?'playback':command;
    if(this.last&&this.last.family===family&&this.last.source!==source&&time-this.last.time<120)return false;
    this.last={family,source,time};this.window.webContents.send(CHANNELS[command]);return true;
  }
  update(value){
    if(!value||typeof value!=='object')return;
    this.state={playing:value.playing===true,available:value.available===true,title:String(value.title||'').slice(0,160),artist:String(value.artist||'').slice(0,100)};this.refresh();
  }
  icon(name){const dark=!!this.nativeTheme?.shouldUseDarkColors,key=name+dark;if(!this.icons.has(key))this.icons.set(key,this.nativeImage.createFromBuffer(iconPNG(name,dark)));return this.icons.get(key);}
  refresh(){
    if(this.platform!=='win32'||this.disposed||this.window.isDestroyed())return;
    const flags=this.state.available?['enabled']:['disabled'];
    try{
      const ok=this.window.setThumbarButtons([
        {icon:this.icon('previous'),tooltip:'上一首',flags,click:()=>this.dispatch('previous','taskbar')},
        {icon:this.icon(this.state.playing?'pause':'play'),tooltip:this.state.playing?'暂停':'播放',flags,click:()=>this.dispatch('play-pause','taskbar')},
        {icon:this.icon('next'),tooltip:'下一首',flags,click:()=>this.dispatch('next','taskbar')}
      ]);
      if(ok)this.toolbarRetries=0;
      else{
        if(!this.toolbarWarning){this.log('Taskbar media buttons pending Windows taskbar initialization');this.toolbarWarning=true;}
        if(!this.toolbarTimer&&this.toolbarRetries<3){this.toolbarRetries++;this.toolbarTimer=setTimeout(()=>{this.toolbarTimer=null;this.refresh();},250);this.toolbarTimer.unref?.();}
      }
      this.window.setThumbnailToolTip((this.state.title?[this.state.title,this.state.artist].filter(Boolean).join(' — '):'GlassWave').slice(0,250));
    }catch(error){this.log('Taskbar media buttons: '+error.message);}
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;this.clearTimer(this.timer);if(this.toolbarTimer)clearTimeout(this.toolbarTimer);
    for(const key of this.owned)this.globalShortcut.unregister(key);this.owned.clear();
    this.ipcMain.removeListener('player-media-state',this.onState);this.ipcMain.removeListener('player-media-command',this.onCommand);
    this.window.removeListener('app-command',this.onAppCommand);this.window.removeListener('focus',this.onFocus);
    for(const event of ['ready-to-show','restore','show'])this.window.removeListener(event,this.onRefresh);
    this.nativeTheme?.removeListener('updated',this.onTheme);this.powerMonitor?.removeListener('resume',this.onFocus);
  }
}
module.exports={WindowsMediaControls,iconPNG,SHORTCUTS};
