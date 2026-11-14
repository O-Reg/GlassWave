(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GlassWaveAudioReliability=api;})(typeof window==='object'?window:globalThis,()=>{
  function install(context,audio,{fadeIn=()=>{},log=(event,data)=>console.warn('[AudioHealth] '+event,JSON.stringify(data)),devices=typeof navigator==='object'?navigator.mediaDevices:null}={}){
    let timer=null,busy=false,disposed=false;const attempts=[],logs=new Map();
    const wanted=()=>!!audio&&!audio.paused&&!audio.ended&&!!(audio.currentSrc||audio.src);
    const snapshot=()=>({context:context.state,sampleRate:context.sampleRate,baseLatency:context.baseLatency,outputLatency:context.outputLatency,mediaTime:Number(audio?.currentTime)||0,readyState:audio?.readyState,paused:audio?.paused});
    function record(event,extra={}){const now=Date.now();if(now-(logs.get(event)??-Infinity)<5000)return;logs.set(event,now);log(event,{...snapshot(),...extra});}
    function request(reason){
      if(disposed||!wanted()||context.state==='running'||context.state==='closed'||timer!==null||busy)return;
      const now=Date.now();while(attempts.length&&now-attempts[0]>=30000)attempts.shift();
      if(attempts.length>=3){record('recovery-limit',{reason});return;}
      timer=setTimeout(async()=>{
        timer=null;if(disposed||!wanted()||!['suspended','interrupted'].includes(context.state))return;
        attempts.push(Date.now());busy=true;let retry=false;
        try{fadeIn();await context.resume();record(context.state==='running'?'recovered':'resume-pending',{reason,attempt:attempts.length});retry=context.state!=='running';}
        catch(error){record('resume-failed',{reason,message:String(error?.message||error)});retry=true;}
        finally{busy=false;if(retry)request(reason);}
      },[80,400,1200][attempts.length]);
    }
    const error=()=>{record('render-error');request('render-error');};
    const state=()=>{record('context-'+context.state);request('state-change');};
    const play=()=>request('play');
    const pause=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
    const mediaError=()=>record('media-error',{code:audio.error?.code,message:audio.error?.message});
    const waiting=()=>record('media-waiting'),stalled=()=>record('media-stalled');
    const device=()=>{record('device-change');request('device-change');};
    const bindings=[[context,'error',error],[context,'statechange',state],[audio,'play',play],[audio,'pause',pause],[audio,'error',mediaError],[audio,'waiting',waiting],[audio,'stalled',stalled],[devices,'devicechange',device]];
    for(const [target,event,handler]of bindings)target?.addEventListener?.(event,handler);
    record('context-created');
    return {request,snapshot,dispose(){disposed=true;pause();for(const [target,event,handler]of bindings)target?.removeEventListener?.(event,handler);}};
  }
  return {install};
});
