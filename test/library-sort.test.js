const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const sort=require('../src/renderer/js/librarySort');
const tracks=[{title:'Zulu',path:'z.wav',dateAdded:10},{title:'北京',path:'b.wav',dateAdded:30},{title:'Alpha',path:'a.wav',dateAdded:20},{title:'02 Intro',path:'intro.wav'},{title:'重庆',path:'c.wav'},{title:'“Écho”',path:'e.wav'},{title:'Song 10',path:'s10.wav'},{title:'Song 2',path:'s2.wav'}];
function list(tracks){return tracks.map(t=>t.path);}
function classes(){const set=new Set();return {toggle:(k,v)=>v?set.add(k):set.delete(k),add:k=>set.add(k),remove:k=>set.delete(k),contains:k=>set.has(k)};}
function harness(){
  const nodes={},values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const letters=sort.LETTERS.map(letter=>({dataset:{letter},classList:classes(),setAttribute(){}}));
  const bar=nodes['alphabet-index-bar']={hidden:true,children:letters,querySelector(selector){const letter=selector.match(/data-letter="([^"]+)"/)?.[1];return this.children.find(el=>el.dataset.letter===letter)||null;},appendChild(el){this.children=this.children.filter(e=>e!==el);this.children.push(el);}};
  nodes['view-library']={classList:classes()};nodes['track-list-scroll-view']={scrollTop:0};
  const document={getElementById:id=>nodes[id]||null,querySelectorAll:()=>[],addEventListener(){}};
  const ctx={window:{GlassWaveLibrarySort:sort},localStorage:storage,document,console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/renderer/js/ui.js'),'utf8'),ctx);
  const ui=Object.create(ctx.window.UIController.prototype);Object.assign(ui,{allTracks:tracks,currentSubView:'all',activeFilterTags:new Set(),searchQuery:'',sortBy:'default',sortAsc:true,ROW_STRIDE:56,renderTrackList(){},updateVirtualScroll(){},updateOverlayScrollbar(){},highlightAlphabetLetter(){}});
  return {ui,nodes,bar,ctx,storage};
}
test('default direction preserves the incoming list, reverse works, and neither mutates the library',()=>{
  const original=list(tracks);assert.deepEqual(list(sort.sortTracks(tracks,'default',true)),original);assert.deepEqual(list(sort.sortTracks(tracks,'default',false)),original.slice().reverse());assert.deepEqual(list(tracks),original);
});
test('bilingual title sorting and index share pinyin groups, word pronunciation and natural numbers',()=>{
  assert.equal(sort.initial({title:'重庆'}),'C');assert.equal(sort.initial({title:'长安'}),'C');assert.equal(sort.initial({title:'北京'}),'B');assert.equal(sort.initial({title:'“Écho”'}),'E');assert.equal(sort.initial({title:'02 Intro'}),'#');assert.equal(sort.initial({path:'C:/music/Alpha.wav'}),'A');
  const asc=sort.sortTracks(tracks,'title',true),desc=sort.sortTracks(tracks,'title',false);
  assert.deepEqual(list(asc),['intro.wav','a.wav','b.wav','c.wav','e.wav','s2.wav','s10.wav','z.wav']);assert.deepEqual(list(desc),list(asc).reverse());
});
test('date, duration, audio formats, file names and audio specs sort both ways with missing values last',()=>{
  const a={path:'C:/2.flac',dateAdded:100,duration:20,audioSpec:{sampleRate:96000,bitrate:2000}},b={path:'C:/10.wav',dateAdded:'200',duration:10,audioSpec:{sampleRate:44100,bitrate:1000}},c={path:'unknown'};
  for(const mode of ['dateAdded','duration','sampleRate','bitrate','fileName','format'])for(const asc of [true,false])assert.equal(sort.sortTracks([a,b,c],mode,asc).length,3);
  assert.deepEqual(list(sort.sortTracks([a,c,b],'dateAdded',false)),[b.path,a.path,c.path]);
  assert.deepEqual(list(sort.sortTracks([a,c,b],'sampleRate',true)),[b.path,a.path,c.path]);
  assert.deepEqual(list(sort.sortTracks([a,b],'fileName',true)),[a.path,b.path]);assert.deepEqual(list(sort.sortTracks([a,b],'duration',false)),[a.path,b.path]);
});
test('sort choice and mode-specific directions survive restart; invalid preferences are safe',()=>{
  const {ui,storage}=harness();ui.restoreLibrarySortPreferences();assert.equal(ui.sortBy,'default');assert.equal(ui.sortAsc,true);
  ui.sortBy='dateAdded';ui.sortAsc=false;ui.saveLibrarySortPreferences();ui.sortBy='title';ui.sortAsc=true;ui.saveLibrarySortPreferences();ui.restoreLibrarySortPreferences();
  assert.equal(ui.sortBy,'title');assert.equal(ui.sortAsc,true);assert.equal(ui.sortDirections.dateAdded,false);
  storage.setItem(sort.KEY,'bad json');ui.restoreLibrarySortPreferences();assert.equal(ui.sortBy,'default');assert.equal(ui.sortAsc,true);
  assert.equal(sort.preferences({by:'__proto__'}).by,'default');
});
test('letter bar appears only for title sort and jumps exactly in ascending and descending filtered lists',()=>{
  const {ui,bar,nodes}=harness();ui.applyFilterAndSort();assert.equal(bar.hidden,true);
  for(const asc of [true,false]){
    ui.sortBy='title';ui.sortAsc=asc;ui.applyFilterAndSort();assert.equal(bar.hidden,false);assert.deepEqual(bar.children.map(e=>e.dataset.letter),asc?sort.LETTERS:sort.LETTERS.slice().reverse());
    ui.scrollToLetter('B');assert.equal(nodes['track-list-scroll-view'].scrollTop,ui.filteredTracks.findIndex(t=>sort.initial(t)==='B')*56);
    ui.scrollToLetter('#');assert.equal(nodes['track-list-scroll-view'].scrollTop,ui.filteredTracks.findIndex(t=>sort.initial(t)==='#')*56);
    const before=nodes['track-list-scroll-view'].scrollTop;ui.scrollToLetter('Q');assert.equal(nodes['track-list-scroll-view'].scrollTop,before);assert.equal(bar.children.find(e=>e.dataset.letter==='Q').disabled,true);
  }
  ui.searchQuery='zulu';ui.applyFilterAndSort();assert.equal(ui.alphabetFirstIndices.size,1);assert.equal(ui.alphabetFirstIndices.get('Z'),0);
  for(const mode of ['default','artist','album','dateAdded','duration','fileName','format','sampleRate','bitrate']){ui.sortBy=mode;ui.applyFilterAndSort();assert.equal(bar.hidden,true,mode);}
});
test('default reverse and filtered sorts keep the Shift selection anchor attached to its file',()=>{
  const {ui}=harness();ui.filteredTracks=tracks.slice();ui.lastSelectedTrackIndex=1;ui.sortAsc=false;ui.applyFilterAndSort();assert.equal(ui.filteredTracks[ui.lastSelectedTrackIndex].path,'b.wav');
});
