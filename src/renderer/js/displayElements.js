(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GlassWaveDisplayElements=api;})(typeof window==='object'?window:globalThis,()=>{
  const KEY='glasswave_display_layout_v1';
  const DEFAULTS={cover:100,gap:100,title:26,artist:15};
  const limits={cover:[40,180],gap:[0,250],title:[14,48],artist:[10,30]};
  function normalize(value={}){
    if(!value||typeof value!=='object')value={};
    return Object.fromEntries(Object.entries(DEFAULTS).map(([key,fallback])=>{const v=value[key],n=v===null||v===''?NaN:Number(v);return [key,Number.isFinite(n)?Math.round(Math.max(limits[key][0],Math.min(limits[key][1],n))):fallback];}));
  }
  function restore(ui){let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{}return apply(data,ui);}
  function fitArtwork(ui){
    const art=document.getElementById('album-wrap'),stage=document.getElementById('view-player'),meta=document.getElementById('track-meta');
    if(!stage?.getBoundingClientRect||!art||typeof getComputedStyle!=='function')return;
    const r=stage.getBoundingClientRect();if(!r.height||!r.width)return;
    const zoom=document.body.classList.contains('zen-mode')?1.12:1;
    const margin=parseFloat(getComputedStyle(art).marginBottom)||0;
    const limit=Math.max(48,Math.min((r.width-48)/zoom,(r.height*.84-(meta?.getBoundingClientRect().height||0)-margin-24)/zoom));
    document.documentElement.style.setProperty('--display-cover-limit',limit.toFixed(2)+'px');
    ui?.visualizer?.invalidateCoverMetrics?.();
  }
  function apply(value,ui){
    const data=normalize(value),style=document.documentElement.style;
    for(const [key,n] of Object.entries(data)){
      style.setProperty('--display-'+key+'-ratio',String(n/(key==='title'?26:key==='artist'?15:100)));
      const input=document.getElementById('display-'+key),label=document.getElementById('display-'+key+'-value');
      if(input)input.value=data[key];if(label)label.textContent=n+(['cover','gap'].includes(key)?'%':'px');
    }
    fitArtwork(ui);ui?.visualizer?.invalidateCoverMetrics?.();
    if(typeof window==='object')window.lyricsController?.updatePlacement?.();
    return data;
  }
  function init(ui){
    let data=restore(ui),frame=null,pending=null;
    const flush=()=>{frame=null;if(!pending)return;data=apply(pending,ui);pending=null;localStorage.setItem(KEY,JSON.stringify(data));};
    for(const key of Object.keys(DEFAULTS))document.getElementById('display-'+key)?.addEventListener('input',e=>{
      const current=Object.fromEntries(Object.keys(DEFAULTS).map(k=>[k,Number(document.getElementById('display-'+k)?.value??DEFAULTS[k])]));
      pending={...current,[key]:Number(e.target.value)};
      if(frame===null)frame=requestAnimationFrame(flush);
    });
    document.getElementById('display-reset')?.addEventListener('click',()=>{
      if(frame!==null)cancelAnimationFrame(frame);frame=null;pending=null;data=apply(DEFAULTS,ui);localStorage.removeItem(KEY);
    });
    if(typeof ResizeObserver==='function'){
      let resizeFrame=null;
      const observer=new ResizeObserver(()=>{if(resizeFrame!==null)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=null;fitArtwork(ui);if(typeof window==='object')window.lyricsController?.updatePlacement?.();});});
      for(const id of ['view-player','track-meta']){const node=document.getElementById(id);if(node)observer.observe(node);}
    }
  }
  return {KEY,DEFAULTS,normalize,apply,restore,init};
});
