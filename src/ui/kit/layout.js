// Layout helpers. Items are Pixi display objects; size is read from `.w/.h` if present, else from width/height.
const sw = (o) => (o.w != null ? o.w : o.width);
const sh = (o) => (o.h != null ? o.h : o.height);

/** hstack(items, { x=0, y=0, gap=8, align:'top'|'middle'|'bottom', justify:'start'|'center'|'end'|'between', w }) -> {w,h}  (positions in place) */
export function hstack(items, { x = 0, y = 0, gap = 8, align = 'top', justify = 'start', w } = {}) {
  items = items.filter(Boolean);
  const total = items.reduce((a, o) => a + sw(o), 0) + gap * Math.max(0, items.length - 1);
  const h = items.reduce((a, o) => Math.max(a, sh(o)), 0);
  let cx = x, g = gap;
  if (w != null) {
    if (justify === 'center') cx = x + (w - total) / 2; else if (justify === 'end') cx = x + w - total;
    else if (justify === 'between' && items.length > 1) g = (w - items.reduce((a, o) => a + sw(o), 0)) / (items.length - 1);
  }
  for (const o of items) {
    o.x = Math.round(cx); o.y = Math.round(y + (align === 'middle' ? (h - sh(o)) / 2 : align === 'bottom' ? h - sh(o) : 0));
    cx += sw(o) + g;
  }
  return { w: total, h };
}
/** vstack(items, { x=0, y=0, gap=8, align:'left'|'center'|'right', w, h, justify }) -> {w,h} */
export function vstack(items, { x = 0, y = 0, gap = 8, align = 'left', w, h: boxH, justify = 'start' } = {}) {
  items = items.filter(Boolean);
  const total = items.reduce((a, o) => a + sh(o), 0) + gap * Math.max(0, items.length - 1);
  const mw = w != null ? w : items.reduce((a, o) => Math.max(a, sw(o)), 0);
  let cy = y;
  if (boxH != null) { if (justify === 'center') cy = y + (boxH - total) / 2; else if (justify === 'end') cy = y + boxH - total; }
  for (const o of items) {
    o.y = Math.round(cy); o.x = Math.round(x + (align === 'center' ? (mw - sw(o)) / 2 : align === 'right' ? mw - sw(o) : 0));
    cy += sh(o) + gap;
  }
  return { w: mw, h: total };
}
/** grid(items, { cols, cellW, cellH, gapX=8, gapY=8, x=0, y=0 }) -> {w,h}. Items are centred inside their cell. */
export function grid(items, { cols = 3, cellW, cellH, gapX = 8, gapY = 8, x = 0, y = 0 } = {}) {
  items = items.filter(Boolean);
  cellW = cellW ?? Math.max(...items.map(sw)); cellH = cellH ?? Math.max(...items.map(sh));
  items.forEach((o, i) => { const c = i % cols, r = Math.floor(i / cols); o.x = Math.round(x + c * (cellW + gapX) + (cellW - sw(o)) / 2); o.y = Math.round(y + r * (cellH + gapY) + (cellH - sh(o)) / 2); });
  const rows = Math.ceil(items.length / cols);
  return { w: cols * cellW + (cols - 1) * gapX, h: rows * cellH + (rows - 1) * gapY };
}
/** anchor(obj, {w,h}, 'tl'|'tc'|'tr'|'ml'|'c'|'mr'|'bl'|'bc'|'br', { dx=0, dy=0 }) — place obj inside a rect of size w×h (at 0,0). */
export function anchor(obj, rect, where = 'tl', { dx = 0, dy = 0 } = {}) {
  const ow = sw(obj), oh = sh(obj);
  const col = where[1] === undefined ? 'c' : where[1]; const row = where[0] === 'c' ? 'm' : where[0];
  const hx = where === 'c' ? 'c' : where[1]; const vy = where === 'c' ? 'm' : where[0];
  obj.x = Math.round((hx === 'l' ? 0 : hx === 'r' ? rect.w - ow : (rect.w - ow) / 2) + dx);
  obj.y = Math.round((vy === 't' ? 0 : vy === 'b' ? rect.h - oh : (rect.h - oh) / 2) + dy);
  return obj;
}

/** centerOn(obj, cx, cy) — position obj so its LOCAL BOUNDS are centred on (cx,cy). Handy for icons (origin may differ). Returns obj. */
export function centerOn(obj, cx, cy) {
  const b = obj.getLocalBounds();
  obj.x = cx - (b.x + b.width / 2) * (obj.scale?.x ?? 1); obj.y = cy - (b.y + b.height / 2) * (obj.scale?.y ?? 1);
  return obj;
}
