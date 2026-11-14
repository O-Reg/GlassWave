const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('Space overrides focused buttons and sliders, consumes keyup/repeat, and leaves typing and IME alone',()=>{
 const listeners={},counts={play:0,next:0};
 class Element{constructor(kind){this.kind=kind;this.type=kind;}closest(selector){if(selector==='input')return ['text','range'].includes(this.kind)?this:null;if(selector.includes('textarea, select'))return ['textarea','select','editable'].includes(this.kind)?this:null;return this.kind==='button'&&selector==='button'?this:null;}}
 const context={Element,window:{addEventListener:(name,fn)=>{(listeners[name]||=[]).push(fn);}},document:{hasFocus:()=>true},localStorage:{getItem:()=>null,setItem(){}},console};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/shortcuts.js'),'utf8'),context);
 context.window.GlassWaveShortcuts.bind({audioEngine:{togglePlayPause(){counts.play++;},next(){counts.next++;}}});
 const fixed=listeners.keyup[0];
 const fire=(type,kind,extra={})=>{const e={type,code:'Space',key:' ',target:new Element(kind),prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};fixed(e);return e;};
 assert.equal(fire('keydown','button').prevented,true);assert.equal(counts.play,1);
 assert.equal(fire('keyup','button').prevented,true);assert.equal(counts.play,1);
 assert.equal(fire('keydown','button',{repeat:true}).prevented,true);assert.equal(counts.play,1);
 fire('keydown','range');assert.equal(counts.play,2);
 for(const kind of ['text','textarea','select','editable'])assert.equal(fire('keydown',kind).prevented,false);
 for(const extra of [{isComposing:true},{ctrlKey:true},{altKey:true}])assert.equal(fire('keydown','button',extra).prevented,false);
 assert.equal(counts.play,2);assert.equal(counts.next,0);
});
function ribbon(){
 const context={window:{},document:{getElementById:()=>null},performance:{now:()=>0},Path2D:class{moveTo(){}quadraticCurveTo(){}lineTo(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/visualizer.js'),'utf8'),context);
 const v=Object.assign(Object.create(context.window.Visualizer.prototype),{width:3440,height:1440,intensity:1,offsetY:0,positionPreset:'center',_waveFrameScale:1});
 const ctx={save(){},restore(){},stroke(){},createLinearGradient:()=>({addColorStop(){}})};
 return {v,draw(raw,playing,t){v.drawNeonRibbon(ctx,{timeDomain:raw},playing,t,3,'wave');return v._ribbonStates.wave;}};
}
const pcm=Uint8Array.from({length:1024},(_,i)=>128+Math.round(50*Math.sin(i*.03)));
test('active music geometry is independent of background drift speed, while the hidden flow continues',()=>{
 const a=ribbon(),b=ribbon(),t={idleMotion:2,playFlow:0};
 for(let frame=0;frame<20;frame++){a.draw(pcm,true,{...t,driftSpeed:0});b.draw(pcm,true,{...t,driftSpeed:4});}
 const sa=a.v._ribbonStates.wave,sb=b.v._ribbonStates.wave;
 assert.equal(sa.flowWeight,0);assert.equal(sb.flowWeight,0);assert.notEqual(sa.drift,sb.drift);
 for(let row=0;row<3;row++)assert.deepEqual([...sa.rows[row]],[...sb.rows[row]]);
});
test('silence and pause restore flow smoothly; controls cover legacy flow and immediate recovery',()=>{
 const f=ribbon();let state;
 for(let i=0;i<10;i++)state=f.draw(pcm,true,{idleMotion:2,playFlow:0});assert.equal(state.flowWeight,0);
 const phase=state.drift;state=f.draw(null,false,{idleMotion:2,playFlow:0});assert.ok(state.flowWeight>0&&state.flowWeight<1);assert.ok(state.drift>phase);
 for(let i=0;i<50;i++)state=f.draw(new Uint8Array(1024).fill(128),true,{idleMotion:2,playFlow:0});assert.equal(state.flowWeight,1);
 for(let i=0;i<10;i++)state=f.draw(pcm,true,{playFlow:.4});assert.ok(Math.abs(state.flowWeight-.4)<1e-8);
 state=f.draw(null,false,{flowReturnMs:0});assert.equal(state.flowWeight,1);
 for(let i=0;i<10;i++)state=f.draw(pcm,true,{playFlow:1});assert.equal(state.flowWeight,1);
});
