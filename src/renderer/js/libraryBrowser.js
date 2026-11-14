(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GlassWaveLibraryBrowser=factory();})(typeof window==='object'?window:globalThis,()=>{
  const MODES={list:'紧凑列表',largeList:'大封面列表',small:'小封面网格',large:'大封面网格',full:'全封面卡片'};
  const normalize=p=>String(p||'').replace(/\\/g,'/').replace(/\/+$/,'');
  const key=p=>normalize(p).toLowerCase();
  const name=p=>normalize(p).split('/').pop()||p;
  const parent=p=>{const n=normalize(p),i=n.lastIndexOf('/');return i>=0?n.slice(0,i):'';};
  const inside=(p,dir)=>key(p).startsWith(key(dir)+'/');
  const direct=(p,dir)=>key(parent(p))===key(dir);
  const naturalName=s=>s.replace(/第([0-9〇零一二三四五六七八九十百千两]+)/,(_,raw)=>{
    if(/^[0-9]+$/.test(raw))return '第'+Number(raw);
    const digits={'〇':0,'零':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9},units={'十':10,'百':100,'千':1000};let total=0,current=0;
    for(const c of raw)if(units[c]){total+=(current||1)*units[c];current=0;}else current=digits[c];return '第'+(total+current);
  });
  function folders(tracks,dir){
    const base=normalize(dir),found=new Map();
    for(const track of tracks){if(!inside(track.path,base))continue;const rest=normalize(track.path).slice(base.length+1),i=rest.indexOf('/');if(i<0)continue;
      const label=rest.slice(0,i),id=label.toLowerCase();if(!found.has(id))found.set(id,{name:label,path:base+'/'+label,count:0});found.get(id).count++;
    }
    return [...found.values()].sort((a,b)=>naturalName(a.name).localeCompare(naturalName(b.name),'zh-CN',{numeric:true,sensitivity:'base'}));
  }
  function layout(mode,width,total){
    if(!Object.hasOwn(MODES,mode))mode='list';width=Math.max(1,Number(width)||800);
    const grid=['small','large','full'].includes(mode),gap=grid?16:0;
    const columns=grid?Math.max(1,Math.floor((width+gap)/((mode==='small'?146:218)+gap))):1;
    const cellWidth=Math.floor((width-gap*(columns-1))/columns);
    const height=grid?(mode==='full'?cellWidth:cellWidth+58):(mode==='largeList'?92:52);
    const stride=height+(grid?gap:4);
    return {mode,grid,columns,cellWidth,height,stride,totalHeight:Math.ceil(total/columns)*stride};
  }
  const offset=(index,m)=>Math.floor(index/m.columns)*m.stride;
  function range(top,height,total,m){const buffer=m.grid?2:6;return {start:Math.min(total,Math.max(0,Math.floor(top/m.stride)-buffer)*m.columns),end:Math.min(total,(Math.ceil((top+height)/m.stride)+buffer)*m.columns)};}
  return {MODES,normalize,key,name,parent,inside,direct,folders,layout,offset,range};
});
