(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GlassWaveAudioTransport=api;})(typeof window==='object'?window:globalThis,()=>{
  function ramp(param,value,context,seconds=.012){
    const t=context.currentTime;
    const current=param.value;
    if(param.cancelAndHoldAtTime)param.cancelAndHoldAtTime(t);
    else param.cancelScheduledValues(t);
    // Explicitly anchor a new ramp at the current value. Otherwise a completed
    // older ramp can become its starting point and jump the gain immediately.
    param.setValueAtTime(current,t);
    param.linearRampToValueAtTime(value,t+seconds);
  }
  class Transport {
    constructor(context,audio,gain,{onSettled=()=>{},onError=()=>{},flush=()=>{}}={}){
      Object.assign(this,{context,audio,gain,onSettled,onError,flush});this.operation=null;this.timer=null;this.pauseTimer=null;this.watchdog=null;this.scrubbing=false;this.deferredSeek=null;
      this.bindings=[];
      for(const event of ['seeked','canplay','loadeddata','playing'])this.listen(event,()=>this.ready());
      this.listen('loadedmetadata',()=>{if(this.deferredSeek!==null){const target=this.deferredSeek;this.deferredSeek=null;this.seek(target);}else this.ready();});
      this.listen('error',()=>{this.cancel(false);this.gain.gain.value=0;});
    }
    listen(event,fn){this.audio.addEventListener(event,fn);this.bindings.push([event,fn]);}
    silence(){ramp(this.gain.gain,0,this.context,.008);}
    release(){if(!this.scrubbing)ramp(this.gain.gain,1,this.context,.016);}
    cancel(release=true){
      clearTimeout(this.timer);clearTimeout(this.watchdog);this.timer=this.watchdog=null;
      if(this.operation)this.operation.resolve(false);this.operation=null;this.deferredSeek=null;
      if(release)this.release();
    }
    create(kind,action){
      this.cancel(false);this.silence();
      let resolve;const promise=new Promise(r=>resolve=r),op={kind,resolve,committed:false};this.operation=op;
      const fadeEnd=this.context.currentTime+.008,deadline=Date.now()+500;
      const commit=()=>{
        this.timer=null;if(this.operation!==op)return;
        // Wall-clock timers may fire before the next large playback render quantum.
        // Wait until the audio clock confirms the fade-out has actually rendered.
        if(this.context.state==='running'&&!this.audio.paused&&!this.audio.ended&&this.context.currentTime<fadeEnd){
          if(Date.now()<deadline){this.timer=setTimeout(commit,4);return;}
          this.gain.gain.cancelScheduledValues(this.context.currentTime);this.gain.gain.setValueAtTime(0,this.context.currentTime);
        }
        op.committed=true;
        try{action();this.watchdog=setTimeout(()=>{
          if(this.operation!==op)return;
          if(!this.audio.seeking&&this.audio.readyState>=2)this.ready();
          else{this.cancel(false);this.onError('读取目标音频位置超时，请重试或切换歌曲');}
        },8000);}catch(error){this.cancel();this.onError(error.message);}
      };
      if(this.audio.paused||this.audio.ended||this.context.state!=='running')commit();else this.timer=setTimeout(commit,12);
      return promise;
    }
    ready(){
      const op=this.operation;if(!op||!op.committed||this.audio.seeking||this.audio.readyState<2)return;
      clearTimeout(this.watchdog);this.watchdog=null;this.operation=null;op.resolve(true);this.release();this.onSettled();
    }
    seek(value){
      const n=Number(value);if(!Number.isFinite(n)||!this.audio.src)return Promise.resolve(false);
      if(this.operation?.kind==='load'&&!this.operation.committed||!Number.isFinite(this.audio.duration)||this.audio.duration<=0){this.deferredSeek=Math.max(0,n);return Promise.resolve(false);}
      const target=Math.max(0,Math.min(n,this.audio.duration));
      return this.create('seek',()=>{this.flush();this.audio.currentTime=target;});
    }
    changeSource(action){return this.create('load',()=>{this.flush();action();});}
    beginScrub(){if(this.operation?.kind!=='load')this.cancel(false);this.scrubbing=true;this.silence();}
    endScrub(value){this.scrubbing=false;return this.seek(value);}
    cancelScrub(){this.scrubbing=false;if(this.operation?.kind!=='load')this.cancel();}
    pause(){clearTimeout(this.pauseTimer);this.silence();this.pauseTimer=setTimeout(()=>{this.pauseTimer=null;this.audio.pause();},12);}
    playRequested(){clearTimeout(this.pauseTimer);this.pauseTimer=null;if(!this.operation&&!this.scrubbing)this.release();}
    dispose(){this.cancel(false);clearTimeout(this.pauseTimer);for(const [event,fn]of this.bindings)this.audio.removeEventListener(event,fn);}
  }
  return {Transport,ramp};
});
