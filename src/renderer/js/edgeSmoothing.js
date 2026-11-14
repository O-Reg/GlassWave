(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.GlassWaveEdgeSmoothing=factory();})(typeof window==='object'?window:globalThis,()=>{
  const DEFAULT=40;
  function normalize(value){if(value===null||value===undefined||value==='')return DEFAULT;const n=Number(value);return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):DEFAULT;}
  function parameters(value,threshold,color){
    const level=normalize(value),t=level/100,width=.025+.105*t;
    const table=Array.from({length:33},(_,i)=>{const x=i/32,smooth=x*x*(3-2*x);return Number((x+(smooth-x)*t*.7).toFixed(5));});
    return {level,width,blur:Number((1.2*t).toFixed(3)),slope:(color==='white'?-1:1)/width,intercept:(color==='white'?1-threshold:-threshold)/width,table};
  }
  return {DEFAULT,normalize,parameters};
});
