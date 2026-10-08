const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('mini mouse parallax is bounded even outside the strip and preserves the normal user setting',()=>{
  const classes=new Set(['mini-bar-mode']),events={},frames=[],properties={};
  const album={style:{}},background={style:{setProperty:(k,v)=>properties[k]=v}};
  const sandbox={document:{body:{classList:{contains:k=>classes.has(k)}},getElementById:id=>id==='album'?album:id==='custom-bg-image'?background:null},window:{innerWidth:480,innerHeight:88,addEventListener:(k,fn)=>events[k]=fn},requestAnimationFrame:fn=>frames.push(fn)};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/parallax.js'),'utf8'),sandbox);
  const parallax=new sandbox.window.MouseParallax('deck','album');
  events.mousemove({clientX:9000,clientY:-9000});for(let i=0;i<150;i++)frames.shift()();
  assert.ok(parseFloat(properties['--mini-parallax-x'])<0);assert.ok(Math.abs(parseFloat(properties['--mini-parallax-x']))<=8);
  assert.ok(parseFloat(properties['--mini-parallax-y'])>0);assert.ok(Math.abs(parseFloat(properties['--mini-parallax-y']))<=3);
  assert.equal(album.style.transform,undefined);assert.equal(parallax.enabled,true);
  events.mouseleave();for(let i=0;i<150;i++)frames.shift()();assert.ok(Math.abs(parseFloat(properties['--mini-parallax-x']))<.01);
  parallax.setEnabled(false);events.mousemove({clientX:0,clientY:0});frames.shift()();assert.equal(parseFloat(properties['--mini-parallax-x']),0);assert.equal(parseFloat(properties['--mini-parallax-y']),0);
  parallax.setEnabled(true);classes.delete('mini-bar-mode');events.mousemove({clientX:0,clientY:0});frames.shift()();assert.notEqual(parallax.currentX,0);assert.ok(background.style.transform.includes('translate3d'));assert.equal(properties['--mini-parallax-x'],'0px');
});
