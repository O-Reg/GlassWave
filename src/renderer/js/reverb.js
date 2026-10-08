/* Small deterministic stereo room responses; no downloads or personal assets. */
(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GlassWaveReverb=api;
})(typeof window==='object'?window:globalThis,()=>{
  const PRESETS=Object.freeze([
    {id:'off',name:'关闭混响',icon:'M5 5l14 14M8 4v8a4 4 0 0 0 4 4m4-8V4M5 11v1a7 7 0 0 0 14 0M12 19v3'},
    {id:'studio',name:'录音棚 · 轻微空间',seconds:.35,wet:.12,delay:.004,damping:.48,icon:'M4 4h16v16H4zM8 8v8M12 6v12M16 8v8'},
    {id:'room',name:'小房间 · 贴近温暖',seconds:.6,wet:.18,delay:.008,damping:.32,icon:'M4 20V8l8-5 8 5v12H4zM9 20v-7h6v7'},
    {id:'chamber',name:'室内厅堂 · 柔和包围',seconds:.95,wet:.22,delay:.012,damping:.42,icon:'M3 20V7l9-4 9 4v13M7 8v12M12 8v12M17 8v12M3 20h18'},
    {id:'plate',name:'板式混响 · 明亮人声',seconds:1.3,wet:.21,delay:.014,damping:.78,icon:'M5 3h14v18H5zM8 8l8 8M8 16l8-8'},
    {id:'spring',name:'弹簧混响 · 复古颤尾',seconds:1.1,wet:.18,delay:.007,damping:.6,spring:true,icon:'M12 2v3l-5 2 10 3-10 3 10 3-5 3v3'},
    {id:'club',name:'现场俱乐部 · 紧凑律动',seconds:.8,wet:.2,delay:.018,damping:.36,icon:'M4 20V8h16v12M7 8V4h10v4M8 12v4M12 11v6M16 12v4'},
    {id:'hall',name:'音乐厅 · 宽广自然',seconds:1.8,wet:.25,delay:.023,damping:.48,icon:'M3 8l9-5 9 5M5 8v12M10 8v12M14 8v12M19 8v12M3 21h18'},
    {id:'cathedral',name:'大教堂 · 悠长回响',seconds:2.8,wet:.29,delay:.03,damping:.4,icon:'M4 21V10l4-4 4 4 4-4 4 4v11M12 3v4M10 5h4M9 21v-6h6v6'},
    {id:'canyon',name:'峡谷 · 开阔回声',seconds:2.1,wet:.25,delay:.06,damping:.52,echo:true,icon:'M3 3l4 8-2 10M21 3l-4 8 2 10M10 8l4 4-4 4'},
    {id:'dream',name:'梦境 · 空灵长尾',seconds:3.2,wet:.3,delay:.04,damping:.28,icon:'M19 15a8 8 0 0 1-10-10 8 8 0 1 0 10 10zM18 3v4M16 5h4'}
  ]);
  const preset=id=>PRESETS.find(p=>p.id===id)||PRESETS[0];
  function createImpulse(context,p){
    const rate=context.sampleRate, length=Math.ceil(rate*(p.seconds+p.delay));
    const buffer=context.createBuffer(2,length,rate);
    for(let channel=0;channel<2;channel++){
      const samples=buffer.getChannelData(channel);let seed=12345+channel*9173+Math.round(p.seconds*1000),smooth=0,energy=0;
      const offset=Math.floor(p.delay*rate);
      for(let i=offset;i<length;i++){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const noise=seed/2147483648-1,t=(i-offset)/rate;
        smooth+=p.damping*(noise-smooth);
        const decay=Math.exp(-6.9*t/p.seconds);
        const attack=Math.min(1,t/.012);
        const modulation=p.spring ? .45+.55*Math.pow(Math.cos(t*45+channel*.3),2) : 1;
        samples[i]=smooth*decay*attack*modulation;
        energy+=samples[i]*samples[i];
      }
      // Equal energy across rooms/sample rates keeps presets at comparable loudness.
      const scale=.85/Math.sqrt(Math.max(energy,1e-9));
      for(let i=offset;i<length;i++)samples[i]*=scale;
      const taps=p.echo?[.09,.18,.3]:[.013,.027,.043];
      taps.forEach((time,i)=>{const index=offset+Math.round((time+channel*.0017)*rate);if(index<length)samples[index]+=(p.echo ? .14 : .055)/(i+1);});
    }
    return buffer;
  }
  class Processor {
    constructor(context,input,output){
      this.context=context;this.input=input;this.output=output;this.active=null;
      this.dry=context.createGain();this.dry.gain.value=1;input.connect(this.dry);this.dry.connect(output);
      this.cache=new Map();this.timers=new Set();this.id='off';
    }
    select(id){
      const p=preset(id);if(this.id===p.id)return p.id;
      const context=this.context,now=context.currentTime;
      const previous=this.active;
      let next=null;
      if(p.id!=='off'){
        let buffer=this.cache.get(p.id);
        if(!buffer){buffer=createImpulse(context,p);this.cache.set(p.id,buffer);if(this.cache.size>3)this.cache.delete(this.cache.keys().next().value);}
        const convolver=context.createConvolver(),gain=context.createGain();
        convolver.normalize=false;convolver.buffer=buffer;gain.gain.value=0;
        this.input.connect(convolver);convolver.connect(gain);gain.connect(this.output);
        gain.gain.setTargetAtTime(p.wet,now,.025);next={convolver,gain};
      }
      this.dry.gain.cancelScheduledValues(now);
      this.dry.gain.setTargetAtTime(p.id==='off'?1:1-p.wet*.35,now,.025);
      if(previous){
        previous.gain.gain.setTargetAtTime(0,now,.015);
        const timer=setTimeout(()=>{
          this.input.disconnect(previous.convolver);previous.convolver.disconnect();previous.gain.disconnect();this.timers.delete(timer);
        },120);this.timers.add(timer);
      }
      this.active=next;this.id=p.id;return p.id;
    }
  }
  return {PRESETS,preset,createImpulse,Processor};
});
