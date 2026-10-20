const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('Zen library reuses one search cluster; leaving the page or Zen restores the titlebar without clearing the input',()=>{
  const classes=new Set(),input={value:'The Pattern',selectionStart:4,selectionEnd:7},title={};
  const cluster={parentElement:title,input},host={hidden:true},popover={classList:{remove(){}},style:{}};
  let moved=0;for(const parent of [title,host])parent.appendChild=node=>{moved++;node.parentElement=parent;};
  const document={body:{classList:{contains:k=>classes.has(k)}},querySelector:()=>title,getElementById:id=>({'search-cluster':cluster,'library-search-host':host,'search-more-popover':popover}[id]||null)};
  const context={window:{},document};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),context);
  const ui=Object.create(context.window.UIController.prototype);ui.currentView='library';ui.syncLibrarySearchPlacement();assert.equal(cluster.parentElement,title);assert.equal(host.hidden,true);
  classes.add('zen-mode');ui.syncLibrarySearchPlacement();assert.equal(cluster.parentElement,host);assert.equal(host.hidden,false);assert.equal(moved,1);
  ui.currentSubView='favorites';ui.syncLibrarySearchPlacement();assert.equal(moved,1);assert.equal(input.value,'The Pattern');assert.equal(input.selectionStart,4);
  ui.currentView='player';ui.syncLibrarySearchPlacement();assert.equal(cluster.parentElement,title);assert.equal(host.hidden,true);
  ui.currentView='library';ui.syncLibrarySearchPlacement();classes.delete('zen-mode');ui.syncLibrarySearchPlacement();assert.equal(cluster.parentElement,title);assert.equal(host.hidden,true);assert.equal(input.value,'The Pattern');
});
