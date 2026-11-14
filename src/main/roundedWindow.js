// Native hit region leaves a 2-DIP guard for the compositor's antialiased UI edge.
function roundedShape(width, height, radius = 14, guard = 0) {
  const r = Math.min(radius, Math.floor(width / 2), Math.floor(height / 2));
  const rects = [{ x: 0, y: r, width, height: Math.max(1, height - 2 * r) }];
  for (let y = 0; y < r; y++) {
    const inset = Math.max(0, Math.ceil(r - Math.sqrt(r * r - (r - y - .5) ** 2)) - guard);
    rects.push({ x: inset, y, width: width - inset * 2, height: 1 });
    rects.push({ x: inset, y: height - y - 1, width: width - inset * 2, height: 1 });
  }
  return rects;
}
function attach(win) {
  let signature = '';
  const refresh = (force = false) => {
    if (win.isDestroyed() || win.isMinimized() || win.presentationChanging || typeof win.setShape !== 'function') return;
    const bounds = win.getBounds();
    const { width, height } = bounds;
    const scale = require('electron').screen.getDisplayMatching(bounds).scaleFactor;
    const square = win.presentationFullscreen || win.isFullScreen() || win.isMaximized();
    const next = `${width}:${height}:${scale}:${square}`;
    if (!force && next === signature) return;
    win.setShape(square ? [{ x: 0, y: 0, width, height }] : roundedShape(width, height, 14, 2));
    signature = next;
  };
  for (const event of ['resize', 'restore', 'show', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(event, () => refresh());
  // A monitor change may change device scale without changing DIP dimensions.
  win.on('move', () => refresh());
  refresh(true);
  return refresh;
}
module.exports = { roundedShape, attach };
