const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function fixture(){
 const elements=new Map();function el(){const attrs=new Map(),classes=new Set();return {style:{},title:'',attrs,classList:{contains:k=>classes.has(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);}},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};}
 const ids=['btn-shuffle','btn-repeat','btn-play-pause','btn-volume-icon','icon-vol-high','icon-vol-muted','btn-queue-toggle','btn-toggle-eq','btn-toggle-lyrics','btn-pin-mode','btn-zen-mode','btn-mini-mode','btn-maximize','glass-queue-drawer','glass-eq-modal'];ids.forEach(k=>elements.set(k,el()));
 const body=el(),context={window:{GlassWaveReverb:{preset:id=>({id:id||'off',name:id==='hall'?'大厅':'关闭混响'})}},document:{getElementById:id=>elements.get(id)||null,body}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),context);
 const engine={isShuffle:false,repeatMode:'all',audio:{paused:true,ended:false},volume:.8,isMuted:false,eqEnabled:false};
 const ui=Object.assign(Object.create(context.window.UIController.prototype),{audioEngine:engine,pinMode:'off'});
 return {ui,engine,body,get:id=>elements.get(id)};
}
test('shuffle and loop state stay semantic and visibly marked across all loop states',()=>{
 const f=fixture();f.ui.syncPrimaryControlStates();assert.equal(f.get('btn-shuffle').getAttribute('aria-pressed'),'false');
 f.engine.isShuffle=true;f.ui.syncPrimaryControlStates();assert.equal(f.get('btn-shuffle').getAttribute('aria-pressed'),'true');assert.ok(f.get('btn-shuffle').classList.contains('active'));
 for(const mode of ['one','none','all']){f.engine.repeatMode=mode;f.ui.syncPrimaryControlStates();const b=f.get('btn-repeat');assert.equal(b.getAttribute('data-state'),mode);assert.equal(b.classList.contains('active'),mode!=='none');assert.ok(b.classList.contains('mode-'+mode));}
});
test('muted and zero volume use a crossed speaker rather than disappearing, and actual play state wins',()=>{
 const f=fixture();f.engine.isMuted=true;f.ui.syncPrimaryControlStates();assert.equal(f.get('btn-volume-icon').style.opacity,'1');assert.equal(f.get('icon-vol-muted').style.display,'block');assert.ok(f.get('btn-volume-icon').classList.contains('active'));
 f.engine.isMuted=false;f.engine.volume=0;f.ui.syncPrimaryControlStates();assert.equal(f.get('btn-volume-icon').getAttribute('data-state'),'zero');assert.equal(f.get('icon-vol-muted').style.display,'block');
 f.engine.volume=.7;f.engine.audio.paused=false;f.engine.isPlaying=false;f.ui.syncPrimaryControlStates();assert.equal(f.get('icon-vol-high').style.display,'block');assert.equal(f.get('btn-play-pause').getAttribute('aria-pressed'),'true');assert.match(f.get('btn-play-pause').title,/暂停/);
});
test('panel, pin and window mode states correspond to their actual owners',()=>{
 const f=fixture();f.get('glass-queue-drawer').classList.toggle('open',true);f.get('glass-eq-modal').classList.toggle('open',true);f.get('glass-eq-modal').style.display='flex';f.engine.eqEnabled=false;
 f.pinMode='always';f.ui.pinMode='always';f.body.classList.toggle('is-maximized',true);f.ui.syncPrimaryControlStates();
 assert.equal(f.get('btn-queue-toggle').getAttribute('aria-expanded'),'true');assert.equal(f.get('btn-toggle-eq').getAttribute('aria-expanded'),'true');assert.match(f.get('btn-toggle-eq').title,/均衡：旁路/);assert.equal(f.get('btn-pin-mode').getAttribute('data-state'),'always');assert.equal(f.get('btn-maximize').getAttribute('aria-pressed'),'true');
 f.get('glass-eq-modal').style.display='none';f.ui.syncPrimaryControlStates();assert.equal(f.get('btn-toggle-eq').getAttribute('aria-expanded'),'false');
});

test('flat EQ and open panels stay dark; EQ glyph and reverb ring report independent effective effects',()=>{
 const f=fixture(),b=f.get('btn-toggle-eq');f.engine.eqEnabled=true;f.engine.eqGains=[0,0,0,0,0,0,0];
 f.get('glass-eq-modal').classList.toggle('open',true);f.get('glass-eq-modal').style.display='flex';f.ui.syncPrimaryControlStates();
 assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(b.getAttribute('data-state'),'dry');assert.equal(b.classList.contains('active'),false);
 f.engine.eqGains[0]=3;f.ui.syncPrimaryControlStates();assert.equal(b.getAttribute('data-state'),'eq');assert.equal(b.getAttribute('data-eq-effect'),'on');assert.equal(b.getAttribute('data-reverb-effect'),'off');
 f.engine.reverbPreset='hall';f.ui.syncPrimaryControlStates();assert.equal(b.getAttribute('data-state'),'eq-reverb');assert.match(b.title,/大厅/);
 f.get('glass-eq-modal').style.display='none';f.ui.syncPrimaryControlStates();assert.equal(b.classList.contains('active'),true);assert.equal(b.getAttribute('aria-expanded'),'false');
 f.engine.eqEnabled=false;f.ui.syncPrimaryControlStates();assert.equal(b.getAttribute('data-state'),'reverb');assert.equal(b.getAttribute('data-eq-effect'),'off');
 f.engine.reverbPreset='off';f.ui.syncPrimaryControlStates();assert.equal(b.getAttribute('data-state'),'dry');assert.equal(b.classList.contains('active'),false);
 f.engine.eqEnabled=true;f.engine.eqGains=[0,0,0,0,0,0,0];f.ui.syncPrimaryControlStates();assert.equal(b.classList.contains('active'),false);
});
