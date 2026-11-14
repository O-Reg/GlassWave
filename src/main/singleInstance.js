// A second launch of the same profile activates its existing player instead of mixing two playback streams.
function acquire(app,getWindow){
  if(!app.requestSingleInstanceLock())return false;
  app.on('second-instance',()=>{
    const window=getWindow();if(!window||window.isDestroyed())return;
    if(window.isMinimized())window.restore();window.show();window.focus();
  });return true;
}
module.exports={acquire};
