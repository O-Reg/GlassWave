(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GlassWaveAudioHeadroom=api;})(typeof window==='object'?window:globalThis,()=>{
  class Headroom {
    constructor(context,frequencies){
      this.context=context;this.frequencies=frequencies;this.probes=frequencies.map((freq,i)=>{
        const f=context.createBiquadFilter();f.type=i===0?'lowshelf':i===frequencies.length-1?'highshelf':'peaking';f.frequency.value=freq;f.Q.value=1.4;return f;
      });
      this.samples=Float32Array.from({length:1024},(_,i)=>10*Math.pow(context.sampleRate*.499/10,i/1023));
      this.magnitude=new Float32Array(1024);this.phase=new Float32Array(1024);this.product=new Float64Array(1024);
    }
    factor(gains,enabled){
      if(!enabled||!gains.some(g=>g>0))return 1;
      this.product.fill(1);
      for(let i=0;i<this.probes.length;i++){
        const p=this.probes[i];p.gain.value=gains[i];p.getFrequencyResponse(this.samples,this.magnitude,this.phase);
        for(let k=0;k<this.product.length;k++)this.product[k]*=this.magnitude[k];
      }
      let peak=1;for(const value of this.product)if(Number.isFinite(value))peak=Math.max(peak,value);
      // A modest reserve reduces filter transient overshoot without a compressor or clipping waveshaper.
      return Math.min(1,1/(peak*Math.pow(10,1.5/20)));
    }
  }
  return {Headroom};
});
