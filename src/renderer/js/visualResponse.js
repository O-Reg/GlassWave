// Visual analysis only: never changes the audio graph, playback gain, or source buffers.
(() => {
  const profiles=['original','loudness','bass','mid','treble','hybrid','bands'];
  class VisualResponse {
    sample(input,tuning,playing,sampleRate=48000){
      const mode=profiles.includes(tuning?.responseMode)?tuning.responseMode:'original';
      if(mode==='original'||!input||!playing)return input;
      const pcm=input.timeDomain,freq=input.frequency,n=pcm?.length||0,m=freq?.length||0;
      if(!n||!m)return input;
      if(this.pcm?.length!==n){this.pcm=new Uint8Array(n);this.bands=Array.from({length:3},()=>new Uint8Array(n));}
      if(this.freq?.length!==m)this.freq=new Uint8Array(m);
      const fs=Number.isFinite(sampleRate)&&sampleRate>0?sampleRate:48000,nyquist=fs/2,binHz=nyquist/m;
      const limits=[[20,250],[250,Math.min(4000,nyquist)],[4000,nyquist]];
      const ranges=limits.map(([low,high])=>high>low?[Math.min(m,Math.ceil(low/binHz)),Math.min(m,Math.ceil(high/binHz))]:[0,0]);
      const energy=ranges.map(([start,end])=>{let sum=0;for(let i=start;i<end;i++)sum+=freq[i];return end>start?sum/((end-start)*255):0;});
      let squares=0;for(let i=0;i<n;i++){const x=(pcm[i]-128)/128;squares+=x*x;}
      const loud=Math.min(1,Math.sqrt(squares/n)*2.8),configuredMix=Number(tuning.responseMix??.5);
      const mix=Number.isFinite(configuredMix)?Math.max(0,Math.min(1,configuredMix)):.5;
      const selected={bass:0,mid:1,treble:2}[mode];
      if(selected!==undefined||mode==='bands'){
        // Two cascaded low-pass stages per crossover. Each analyser block overlaps the
        // previous block, so restart from its first sample instead of filtering it twice.
        const lowA=1-Math.exp(-2*Math.PI*250/fs),wideA=1-Math.exp(-2*Math.PI*Math.min(4000,nyquist*.9)/fs);
        let l1=(pcm[0]-128)/128,l2=l1,w1=l1,w2=l1;
        for(let i=0;i<n;i++){
          const x=(pcm[i]-128)/128;l1+=(x-l1)*lowA;l2+=(l1-l2)*lowA;w1+=(x-w1)*wideA;w2+=(w1-w2)*wideA;
          this.bands[0][i]=Math.max(0,Math.min(255,Math.round(128+l2*128)));
          this.bands[1][i]=Math.max(0,Math.min(255,Math.round(128+(w2-l2)*128)));
          this.bands[2][i]=Math.max(0,Math.min(255,Math.round(128+(x-w2)*128)));
        }
      }
      for(let band=0;band<3;band++)if(ranges[band][1]<=ranges[band][0])this.bands[band].fill(128);
      const read=(band,u)=>{const [start,end]=ranges[band];return end>start?freq[Math.min(end-1,start+Math.floor(u*(end-start)))]:0;};
      for(let i=0;i<m;i++){
        const u=i/Math.max(1,m-1);
        const band=Math.min(2,Math.floor(u*3));
        this.freq[i]=mode==='loudness'?Math.round(loud*255):selected!==undefined?read(selected,u):mode==='bands'?read(band,u*3-band):Math.round(freq[i]*(1-mix)+loud*255*mix);
      }
      if(selected!==undefined)this.pcm.set(this.bands[selected]);
      else if(mode==='bands')for(let i=0;i<n;i++){
        // Single-line/legacy layouts use low/mid/high across three horizontal regions.
        // Fade only the seams; three-line layouts use the separate full band buffers below.
        const scaled=i/Math.max(1,n-1)*3,band=Math.min(2,Math.floor(scaled)),u=scaled-band;
        const at=Math.min(n-1,Math.floor(u*(n-1))),edge=Math.max(0,Math.min(1,Math.min(u,1-u)/.04));
        this.pcm[i]=Math.round(128+(this.bands[band][at]-128)*edge*edge*(3-2*edge));
      }
      else for(let i=0;i<n;i++){
        // Loudness is explicitly an envelope-driven breathing shape, not fake PCM.
        const envelope=Math.sin(i/Math.max(1,n-1)*Math.PI*2)*loud;
        const value=mode==='loudness'?envelope:((pcm[i]-128)/128)*(1-mix)+envelope*mix;
        this.pcm[i]=Math.max(0,Math.min(255,Math.round(128+value*128)));
      }
      const projected=selected!==undefined?Array(3).fill(energy[selected]):mode==='loudness'?Array(3).fill(loud):mode==='hybrid'?energy.map(e=>e*(1-mix)+loud*mix):energy;
      const result=this.result ||= {};
      Object.assign(result,{frequency:this.freq,timeDomain:this.pcm,bassEnergy:projected[0],midEnergy:projected[1],highEnergy:projected[2],ribbonTimeDomains:mode==='bands'?this.bands:null,spatialBands:mode==='bands'});
      return result;
    }
  }
  VisualResponse.profiles=profiles;
  window.GlassWaveVisualResponse=VisualResponse;
})();
