// Clip the native window, including the system acrylic backdrop, to the UI radius.
function roundedShape(width, height, radius = 14) {
  const r = Math.min(radius, Math.floor(width / 2), Math.floor(height / 2));
  const rects = [{ x: 0, y: r, width, height: Math.max(1, height - 2 * r) }];
  for (let y = 0; y < r; y++) {
    const inset = Math.ceil(r - Math.sqrt(r * r - (r - y - .5) ** 2));
    rects.push({ x: inset, y, width: width - inset * 2, height: 1 });
    rects.push({ x: inset, y: height - y - 1, width: width - inset * 2, height: 1 });
  }
  return rects;
}
function attach(win) {
  let signature = '';
  const refresh = (force = false) => {
    if (win.isDestroyed() || win.isMinimized() || typeof win.setShape !== 'function') return;
    const bounds = win.getBounds();
    const { width, height } = bounds;
    const scale = require('electron').screen.getDisplayMatching(bounds).scaleFactor;
    const square = win.isFullScreen() || win.isMaximized();
    const next = `${width}:${height}:${scale}:${square}`;
    if (!force && next === signature) return;
    win.setShape(square ? [{ x: 0, y: 0, width, height }] : roundedShape(width, height));
    signature = next;
  };
  for (const event of ['resize', 'restore', 'show', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen']) win.on(event, () => refresh(true));
  // A monitor change may change device scale without changing DIP dimensions.
  win.on('move', () => refresh());
  refresh(true);
  return refresh;
}
module.exports = { roundedShape, attach };
