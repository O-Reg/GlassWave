(function(root){
  function bind(engine,api){
    const audio=engine.audio,session=root.navigator?.mediaSession;let lastState='',lastTrack='';
    const execute=command=>{const handlers={'play-pause':()=>engine.togglePlayPause(),play:()=>engine.play(),pause:()=>engine.pause(),next:()=>engine.next(),previous:()=>engine.previous(),stop:()=>{engine.pause();engine.seek(0);}};handlers[command]?.();};
    for(const [name,command] of Object.entries({onMediaPlayPause:'play-pause',onMediaNext:'next',onMediaPrev:'previous',onMediaPlay:'play',onMediaPause:'pause',onMediaStop:'stop'}))api?.[name]?.(()=>execute(command));
    function sync(){
      const track=engine.currentTrack,playing=!!(audio&&!audio.paused&&!audio.ended),available=!!track||!!engine.playbackQueue?.length;
      const state={playing,available,title:track?.title||'',artist:track?.artist||''},stamp=JSON.stringify(state);
      if(stamp!==lastState){api?.updateMediaState?.(state);lastState=stamp;}
      if(session){
        try{session.playbackState=available?(playing?'playing':'paused'):'none';}catch{}
        const metadata=JSON.stringify({title:state.title,artist:state.artist,album:track?.album||''});
        if(metadata!==lastTrack){try{session.metadata=track?new root.MediaMetadata(JSON.parse(metadata)):null;lastTrack=metadata;}catch{}}
        if(audio?.duration>0&&Number.isFinite(audio.duration))try{session.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate||1,position:Math.max(0,Math.min(audio.duration,audio.currentTime||0))});}catch{}
      }
    }
    if(session)for(const [action,command] of Object.entries({play:'play',pause:'pause',previoustrack:'previous',nexttrack:'next',stop:'stop'}))try{session.setActionHandler(action,()=>api?.sendMediaCommand?api.sendMediaCommand(command):execute(command));}catch{}
    for(const event of ['play','pause','ended','loadedmetadata','durationchange','emptied','seeked','timeupdate'])audio?.addEventListener(event,sync);
    sync();return {sync};
  }
  root.GlassWaveSystemMedia={bind};
})(window);
