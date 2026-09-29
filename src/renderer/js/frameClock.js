// Share a compositor-synchronised configurable clock; never use timers to present frames.
(() => {
  const requestNative=window.requestAnimationFrame.bind(window),cancelNative=window.cancelAnimationFrame.bind(window);
  const callbacks=new Map();let nextId=1,scheduled=0,last=null,delivering=false;
  let period=1000/90, paused=false;
  window.glasswaveFrameClock={setPaused(value){paused=!!value;last=null;if(paused&&scheduled){cancelNative(scheduled);scheduled=0;}if(!paused)schedule();},get paused(){return paused;},setRate(fps){const n=Number(fps);period=1000/(Number.isFinite(n)&&n>=30?Math.min(144,n):90);last=null;}};
  function schedule(){if(!paused&&!scheduled&&!delivering&&callbacks.size)scheduled=requestNative(tick);}
  function tick(now){
    scheduled=0;
    if(paused)return;
    if(last!==null&&now-last<period-.5){schedule();return;}
    last=last===null?now:last+Math.max(1,Math.floor((now-last+.5)/period))*period;
    delivering=true;
    const pending=[...callbacks.keys()];
    for(const id of pending){const fn=callbacks.get(id);if(!fn)continue;callbacks.delete(id);try{fn(now);}catch(e){setTimeout(()=>{throw e;},0);}}
    delivering=false;schedule();
  }
  window.requestAnimationFrame=fn=>{if(typeof fn!=='function')throw new TypeError('Animation callback required');const id=nextId++;callbacks.set(id,fn);schedule();return id;};
  window.cancelAnimationFrame=id=>{callbacks.delete(id);if(!callbacks.size&&scheduled){cancelNative(scheduled);scheduled=0;}};
  const setPaused=value=>{window.glasswaveFrameClock.setPaused(value);document.documentElement.classList.toggle('window-animation-paused',!!value);};
  window.glasswaveAPI?.onAnimationPaused(setPaused);
  document.addEventListener('visibilitychange',()=>setPaused(document.hidden));
})();
