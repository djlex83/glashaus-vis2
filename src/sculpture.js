/* Glashaus · Partikel-Motiv (eigene Canvas-2D-Umsetzung)
 * Das Linienbild jeder Seite wird in Punkte zerlegt. Der Zeiger schiebt die Punkte beiseite,
 * danach kehren sie federnd an ihren Platz zurück. Ruht alles, bleibt das statische Bild stehen.
 * Schnittstelle: GlasSculpture({ stage, img, backdrop, hint, srcs:{light,dark,mlight,mdark}, band(), bg(), dark(), parallax })
 *   → { retheme(), place(), setAmbient(on, intensity) } */
(function () {
"use strict";
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

window.GlasSculpture = function mount(opts) {
  const stage = opts.stage, img = opts.img;
  const rm = matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = document.createElement("canvas");
  canvas.className = "sc-canvas";
  stage.appendChild(canvas);
  const g = canvas.getContext("2d");
  let aspect = 2.5, rect = { x: 0, y: 0, w: 0, h: 0 }, mobile = false, src = "", im = null;
  let P = null, N = 0, raf = 0, awake = false, ambient = 0, t0 = performance.now();
  const ptr = { x: -1e4, y: -1e4, on: false };
  let dpr = 1, buf = null;

  /* Bild abtasten: jeder STEP-te Pixel mit Deckkraft wird ein Teilchen (Position relativ 0..1, Farbe) */
  function sample(image) {
    const STEP = mobile ? 3 : 4, W = image.naturalWidth, H = image.naturalHeight;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(image, 0, 0);
    const d = x.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += STEP) for (let i = 0; i < W; i += STEP) {
      const k = (y * W + i) * 4; if (d[k + 3] < 60) continue;
      pts.push(i / W, y / H, d[k], d[k + 1], d[k + 2], d[k + 3]);
    }
    N = pts.length / 6;
    P = { hx: new Float32Array(N), hy: new Float32Array(N), x: new Float32Array(N), y: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N), c: new Uint8ClampedArray(N * 4), ph: new Float32Array(N) };
    for (let n = 0; n < N; n++) { P.hx[n] = pts[n * 6]; P.hy[n] = pts[n * 6 + 1]; P.c.set(pts.slice(n * 6 + 2, n * 6 + 6), n * 4); P.ph[n] = Math.random() * 6.283; }
    home(true);
  }
  /* Teilchen auf die aktuelle Bildfläche setzen (auch nach Scrollen/Größenänderung) */
  function home(jump) {
    if (!P) return;
    for (let n = 0; n < N; n++) {
      const x = rect.x + P.hx[n] * rect.w, y = rect.y + P.hy[n] * rect.h;
      if (jump) { P.x[n] = x; P.y[n] = y; P.vx[n] = 0; P.vy[n] = 0; }
    }
  }
  function resize() {
    dpr = Math.min(2, devicePixelRatio || 1);
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;                       /* Seite (noch) unsichtbar: später erneut */
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    buf = g.createImageData(canvas.width, canvas.height);
  }

  function frame(now) {
    raf = 0;
    if (!P || !buf) return;
    const t = (now - t0) / 1000, R = 150 * (mobile ? .7 : 1), R2 = R * R, d = buf.data, W = canvas.width, H = canvas.height;
    d.fill(0);
    let moving = 0;
    for (let n = 0; n < N; n++) {
      const hx = rect.x + P.hx[n] * rect.w + (ambient ? Math.sin(t * .7 + P.ph[n]) * 2.2 * ambient : 0);
      const hy = rect.y + P.hy[n] * rect.h + (ambient ? Math.cos(t * .6 + P.ph[n] * 1.3) * 2.2 * ambient : 0);
      let ax = (hx - P.x[n]) * .045, ay = (hy - P.y[n]) * .045;
      if (ptr.on) { const dx = P.x[n] - ptr.x, dy = P.y[n] - ptr.y, q = dx * dx + dy * dy;
        if (q < R2 && q > .01) { const f = (1 - q / R2) * 3.2 / Math.sqrt(q); ax += dx * f + dy * f * .35; ay += dy * f - dx * f * .35; } }
      P.vx[n] = (P.vx[n] + ax) * .86; P.vy[n] = (P.vy[n] + ay) * .86;
      P.x[n] += P.vx[n]; P.y[n] += P.vy[n];
      if (Math.abs(P.vx[n]) + Math.abs(P.vy[n]) > .05) moving++;
      const px = (P.x[n] * dpr) | 0, py = (P.y[n] * dpr) | 0;
      if (px < 0 || py < 0 || px >= W - 1 || py >= H - 1) continue;
      for (let oy = 0; oy < 2; oy++) for (let ox = 0; ox < 2; ox++) { const k = ((py + oy) * W + px + ox) * 4; d[k] = P.c[n * 4]; d[k + 1] = P.c[n * 4 + 1]; d[k + 2] = P.c[n * 4 + 2]; d[k + 3] = P.c[n * 4 + 3]; }
    }
    g.putImageData(buf, 0, 0);
    awake = moving > 0 || ptr.on || ambient > 0;
    if (awake) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf && P && !rm.matches) raf = requestAnimationFrame(frame); };

  function place() {
    const w = stage.clientWidth, h = stage.clientHeight, b = opts.band();
    const lift = Math.min(scrollY * (opts.parallax || 0.3), h * 0.2);
    const top = b.top, bh = Math.max(120, b.bottom - b.top);
    let rw = Math.min(w * (mobile ? 1.15 : 0.94), bh * aspect), rh = rw / aspect;
    rect = { x: (w - rw) / 2, y: top + (bh - rh) / 2 - lift, w: rw, h: rh };
    img.style.cssText = "left:" + rect.x + "px;top:" + rect.y + "px;width:" + rect.w + "px;height:" + rect.h + "px";
    if (opts.backdrop) {
      const bd = opts.backdrop, chars = Math.max(1, bd.textContent.length);
      bd.style.fontSize = Math.min(bh * 0.95, (w * 0.92) / (chars * 0.56)) + "px";
      bd.style.top = top + bh / 2 - lift + "px";
    }
    if (opts.hint) {
      opts.hint.style.left = clamp(rect.x + rect.w / 2, 80, w - 80) + "px";
      opts.hint.style.top = Math.min(rect.y + rect.h * 0.95, top + bh - 20) + "px";
    }
    if (canvas.width !== Math.round(w * Math.min(2, devicePixelRatio || 1))) resize();
    home(!awake); if (awake) wake(); else if (P && !rm.matches) { awake = true; wake(); }
  }

  function pick() {
    const d = opts.dark();
    mobile = stage.clientWidth < 640;
    const s = mobile ? (d ? opts.srcs.mdark : opts.srcs.mlight) : (d ? opts.srcs.dark : opts.srcs.light);
    if (s === src) return;
    src = s;
    const next = new Image();
    next.onload = () => {
      if (src !== s) return;
      im = next; aspect = im.naturalWidth / im.naturalHeight || aspect;
      img.src = s; place();
      if (rm.matches) { stage.dataset.gl = "off"; return; }
      try { sample(im); resize(); place(); stage.dataset.gl = "on"; awake = true; wake(); }
      catch (e) { stage.dataset.gl = "off"; }
    };
    next.src = s;
  }

  const touched = () => { if (opts.hint) opts.hint.dataset.touched = "1"; };
  const move = (e) => { ptr.x = e.clientX; ptr.y = e.clientY; ptr.on = true; touched(); wake(); };
  addEventListener("pointermove", (e) => { if (e.pointerType === "touch" && e.buttons === 0 && e.pressure === 0) return; move(e); }, { passive: true });
  addEventListener("pointerdown", move, { passive: true });
  addEventListener("pointerup", (e) => { if (e.pointerType === "touch") ptr.on = false; }, { passive: true });
  addEventListener("pointercancel", () => (ptr.on = false), { passive: true });
  document.documentElement.addEventListener("pointerleave", () => (ptr.on = false));
  let sraf = 0;
  addEventListener("scroll", () => { if (!sraf) sraf = requestAnimationFrame(() => { sraf = 0; place(); }); }, { passive: true });
  new ResizeObserver(() => { const m = stage.clientWidth < 640; if (m !== mobile) pick(); resize(); place(); }).observe(stage);
  pick();
  return {
    retheme: pick, place,
    /* langsames Atmen der Form (Bildschirmschoner, Nachtmodus) */
    setAmbient(on, intensity) { ambient = on ? (intensity ?? 0.7) : 0; wake(); },
  };
};
})();
