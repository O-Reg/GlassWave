(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../assets/vendor/pinyin-pro-3.29.5.js'));
  else root.GlassWaveLibrarySort=factory(root.pinyinPro);
})(typeof window==='object'?window:globalThis,function(pinyin){
  const MODES={default:'默认排序',title:'歌曲名称',artist:'艺术家',album:'专辑',dateAdded:'添加时间',duration:'播放时长',fileName:'文件名称',format:'音频格式',sampleRate:'采样率',bitrate:'码率'};
  const KEY='glasswave_library_sort_v1',LETTERS=['#',...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
  const tieCollator=new Intl.Collator('zh-Hans-CN',{numeric:true,sensitivity:'variant'}),cache=new Map();
  function fileName(track){return String(track.path||'').split(/[\\/]/).pop()||'';}
  function title(track){return String(track.title||fileName(track).replace(/\.[^.]+$/,'')).trim();}
  function textKey(value){
    const raw=String(value||'');if(cache.has(raw))return cache.get(raw);
    const clean=raw.normalize('NFKC').replace(/^[^\p{L}\p{N}]+/u,'');
    const roman=/\p{Script=Han}/u.test(clean)&&pinyin?pinyin.pinyin(clean,{toneType:'none',type:'array',nonZh:'consecutive'}).join(' '):clean;
    const folded=roman.normalize('NFD').replace(/\p{M}/gu,'').trim();
    const first=folded.charAt(0).toUpperCase(),letter=/^[A-Z]$/.test(first)?first:'#';
    const key={raw,clean,roman:folded,letter};cache.set(raw,key);if(cache.size>20000)cache.delete(cache.keys().next().value);return key;
  }
  function initial(track){return textKey(title(track)).letter;}
  function compareText(a,b,groups=false){const x=textKey(a),y=textKey(b);return (groups?LETTERS.indexOf(x.letter)-LETTERS.indexOf(y.letter):0)||collator.compare(x.roman,y.roman)||tieCollator.compare(x.clean,y.clean);}
  function preferences(input){
    const value=input&&typeof input==='object'?input:{},by=Object.hasOwn(MODES,value.by)?value.by:'default',directions={};
    for(const id of Object.keys(MODES))if(typeof value.directions?.[id]==='boolean')directions[id]=value.directions[id];
    const asc=typeof value.asc==='boolean'?value.asc:(directions[by]??(by!=='dateAdded'));
    directions[by]=asc;return {by,asc,directions};
  }
  function read(storage){try{return preferences(JSON.parse(storage.getItem(KEY)||'null'));}catch{return preferences();}}
  function save(storage,by,asc,directions={}){const value=preferences({by,asc,directions:{...directions,[by]:asc}});try{storage.setItem(KEY,JSON.stringify(value));}catch{}return value;}
  function numeric(track,mode){
    const raw=['sampleRate','bitrate'].includes(mode)?track.audioSpec?.[mode]:track[mode];
    const value=mode==='dateAdded'&&typeof raw==='string'&&!/^\d+$/.test(raw)?Date.parse(raw):Number(raw);
    return Number.isFinite(value)&&value>0?value:null;
  }
  function sortTracks(tracks,by='default',asc=true){
    const result=[...tracks];if(!Object.hasOwn(MODES,by))by='default';
    if(by==='default')return asc?result:result.reverse();
    const direction=asc?1:-1;
    // Precompute transliterations before comparisons; UI and index share these keys.
    if(['title','artist','album','fileName','format'].includes(by))for(const track of result)textKey(text(track,by));
    return result.sort((a,b)=>{
      let order=0;
      if(['dateAdded','duration','sampleRate','bitrate'].includes(by)){
        const x=numeric(a,by),y=numeric(b,by);if(x===null&&y!==null)return 1;if(x!==null&&y===null)return -1;order=(x??0)-(y??0);
      }else order=compareText(text(a,by),text(b,by),by==='title');
      return direction*order||compareText(title(a),title(b),true)||collator.compare(a.path||'',b.path||'');
    });
  }
  function text(track,mode){if(mode==='title')return title(track);if(mode==='fileName')return fileName(track);if(mode==='format'){const name=fileName(track);return (name.includes('.')?name.split('.').pop():track.audioSpec?.container||'').toUpperCase();}return track[mode]||'';}
  function directionLabel(by,asc){
    const labels=by==='default'?['原有顺序','反向顺序']:by==='dateAdded'?['最早 → 最新','最新 → 最早']:by==='duration'?['短 → 长','长 → 短']:['sampleRate','bitrate'].includes(by)?['低 → 高','高 → 低']:['A → Z','Z → A'];
    return labels[asc?0:1];
  }
  return {MODES,KEY,LETTERS,initial,title,preferences,read,save,sortTracks,directionLabel};
});
