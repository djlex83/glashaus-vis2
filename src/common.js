/* Glashaus · gemeinsamer Seitencode: Helfer, Theme, Skulptur, Uhr, Energie- und Jahresmodell */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const de = (v, d = 0) => Number(v).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d });
function tween(el, to, d = 0, suf = "", ms = 900) {
  if (!el) return;
  const from = el._v ?? 0; el._v = to;
  if (RM) { el.textContent = de(to, d) + suf; return; }
  const t0 = performance.now(); cancelAnimationFrame(el._raf);
  const st = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = de(from + (to - from) * e, d) + suf; if (k < 1) el._raf = requestAnimationFrame(st); };
  el._raf = requestAnimationFrame(st);
}
const RC = 2 * Math.PI * 27;
function ring(el, p, label) {
  if (!el.firstChild) el.innerHTML = '<svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="27"/><circle class="fg" cx="32" cy="32" r="27" stroke-dasharray="' + RC + '" stroke-dashoffset="' + RC + '"/></svg><b></b>';
  requestAnimationFrame(() => requestAnimationFrame(() => { el.querySelector(".fg").style.strokeDashoffset = RC * (1 - Math.max(0, Math.min(1, p))); }));
  el.querySelector("b").textContent = label ?? Math.round(p * 100) + " %";
}
function toast(m) { const t = $(".toast"); t.querySelector("span").textContent = m; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); }
addEventListener("pointermove", (e) => { const g = e.target.closest && e.target.closest(".glass"); if (!g) return; const r = g.getBoundingClientRect(); g.style.setProperty("--mx", e.clientX - r.left + "px"); g.style.setProperty("--my", e.clientY - r.top + "px"); }, { passive: true });

/* Theme */
const root = document.documentElement;
const cssv = (n) => getComputedStyle(root).getPropertyValue(n).trim();
const isDark = () => { const m = /^#?([0-9a-f]{6})$/i.exec(cssv("--bg")); if (!m) return false; const n = parseInt(m[1], 16); return ((n >> 16 & 255) * 0.2126 + (n >> 8 & 255) * 0.7152 + (n & 255) * 0.0722) / 255 < 0.45; };
function themeIcon() { const d = isDark(), b = $("[data-theme-toggle]"); if (!b) return; b.innerHTML = '<svg><use href="#i-' + (d ? "sun" : "moon") + '"/></svg>'; b.setAttribute("aria-label", d ? "Helles Design" : "Dunkles Design"); }
$("[data-theme-toggle]")?.addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; themeIcon(); });
themeIcon();
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", themeIcon);

/* Skulptur */
/* Motive für die Partikel-Engine: Linienzeichnungen, im Browser gezeichnet (transparent, je Design hell/dunkel) */
function makeArt(draw) {
  const mk = (dark, mobile) => {
    const W = mobile ? 1300 : 2000, H = mobile ? 1080 : 800, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d");
    if (mobile) { const s = 1300 / 1500; g.translate(-250 * s, (H - 800 * s) / 2); g.scale(s, s); }
    const o = { dark, ink: dark ? "#ece6da" : "#25241f", soft: dark ? "#a9a296" : "#7d776c" };
    draw(g, o);
    return c.toDataURL("image/png");
  };
  return { light: mk(false, false), dark: mk(true, false), mlight: mk(false, true), mdark: mk(true, true) };
}
function kit(g, o) {
  const L = (pts, w = 4, col = o.ink, a = 1, close = false, fill = null, fa = 1) => {
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); if (close) g.closePath();
    if (fill) { g.globalAlpha = fa; g.fillStyle = fill; g.fill(); }
    if (w > 0) { g.globalAlpha = a; g.lineWidth = w; g.strokeStyle = col; g.lineJoin = "round"; g.lineCap = "round"; g.stroke(); }
    g.globalAlpha = 1;
  };
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  return { L, rnd };
}
/* ================= Wetter im Motiv (gleicher Strichstil) =================
   wx = { sky: 'sun'|'moon'|null, clouds: 0..3, rain, snow, storm, fog, wind, night }
   Geometrie der Hausansicht: freie Himmelsflächen links/rechts und über dem Dach, Schneekanten. */
const ZU_WX = { left: [-9, -4.6], right: [14.8, 21], roof: [-.5, 13.5], roofTop: 10.3, top: 13,
  snow: [[[-.5, 6.2], [.6, 10.3], [12.4, 10.3], [13.5, 6.2]], [[8.4, 8.9], [11.8, 8.9]], [[11.9, 11.3], [12.4, 11.3]], [[-4.35, 3.15], [0, 3.15]], [[8.2, 3.9], [12.4, 3.9]], [[6.2, 2.45], [8, 2.45]]] };
const WX = {
  sonne: { label: "Sonnig", sky: "sun" }, heiter: { label: "Heiter", sky: "sun", clouds: 1 }, wolken: { label: "Bewölkt", clouds: 3 },
  regen: { label: "Regen", clouds: 3, rain: 1 }, gewitter: { label: "Gewitter", clouds: 3, rain: 1, storm: 1 }, schnee: { label: "Schnee", clouds: 2, snow: 1 },
  nebel: { label: "Nebel", fog: 1 }, wind: { label: "Windig", clouds: 2, wind: 1 },
  sonne_nacht: { label: "Klar", sky: "moon", night: 1 }, heiter_nacht: { label: "Leicht bewölkt", sky: "moon", clouds: 1, night: 1 },
};
const wxKey = (k, night) => (night && WX[k + "_nacht"]) ? k + "_nacht" : WX[k] ? k : "heiter";
const wxOf = (k, night) => { const b = WX[wxKey(k, night)]; return { ...b, night: b.night || !!night }; };
function wxLayer(g, o, M, s, L, wx, phase, Z) {
  const rnd = (() => { let q = 11; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
  const bg = o.dark ? "#111110" : "#ebe9e5", sun = o.dark ? "#f0b453" : "#d8921f", rainc = o.dark ? "#79b8e8" : "#3681bf";
  const snowc = o.dark ? "#f4f1ea" : "#ffffff", snowEdge = o.dark ? "#cfd8e3" : "#9fb3c8";
  const circ = (x, y, r, w, c, a, fill) => { const p = M(x, y); g.beginPath(); g.arc(p[0], p[1], r * s, 0, 7); if (fill) { g.globalAlpha = a; g.fillStyle = fill; g.fill(); } if (w) { g.globalAlpha = a; g.lineWidth = w; g.strokeStyle = c; g.stroke(); } g.globalAlpha = 1; };
  const cloud = (x, y, w, dark) => {               /* Wolke: Bögen oben, gerade unten, mit Hintergrund gefüllt */
    const p = M(x, y), W = w * s, H = W * .34; g.beginPath(); g.moveTo(p[0] - W / 2, p[1]);
    g.arc(p[0] - W * .32, p[1] - H * .5, H * .62, Math.PI * .95, Math.PI * 1.75);
    g.arc(p[0] - W * .03, p[1] - H * .8, H * .82, Math.PI * 1.15, Math.PI * 1.9);
    g.arc(p[0] + W * .27, p[1] - H * .5, H * .66, Math.PI * 1.3, Math.PI * .05);
    g.lineTo(p[0] + W / 2, p[1]); g.closePath();
    g.fillStyle = dark ? (o.dark ? "#1c1c1b" : "#d9d6d0") : bg; g.fill();
    g.lineWidth = 4; g.strokeStyle = o.ink; g.globalAlpha = .9; g.lineJoin = "round"; g.stroke(); g.globalAlpha = 1;
    for (let i = 1; i < 3; i++) L([M(x - w * .3 + i * .5, y + .12), M(x - w * .3 + i * .5 + w * .25, y + .12)], 2, o.soft, .6);
    return { x, y, w };
  };
  if (phase === "back") {
    const sx = 17.9, sy = 10.4;
    if (wx.sky === "sun") { circ(sx, sy, .78, 0, null, .95, sun);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, r0 = 1.05, r1 = 1.45 + (i % 2) * .35; L([M(sx + Math.cos(a) * r0, sy + Math.sin(a) * r0), M(sx + Math.cos(a) * r1, sy + Math.sin(a) * r1)], 3.5, sun, .85); } }
    if (wx.sky === "moon") { circ(sx, sy, .78, 0, null, .95, o.dark ? "#ece6da" : "#5b6474"); const p = M(sx + .38, sy + .22); g.beginPath(); g.arc(p[0], p[1], .7 * s, 0, 7); g.fillStyle = bg; g.fill(); }
    if (wx.night) for (let i = 0; i < 34; i++) { const zone = rnd() < .5 ? Z.left : Z.right, x = zone[0] + rnd() * (zone[1] - zone[0]), y = 6.8 + rnd() * (Z.top - 6.8);
      if (wx.sky === "moon" && Math.hypot(x - sx, y - sy) < 1.6) continue; const p = M(x, y), r = 1.6 + rnd() * 2.2; g.globalAlpha = .55 + rnd() * .4; g.fillStyle = o.ink; g.fillRect(p[0] - r / 2, p[1] - r / 2, r, r); g.globalAlpha = 1; }
    const cl = [];
    const spots = [[-6.4, 10.1, 4.4], [16.4, 10.7, 3.9], [4.2, 11.3, 2.8]];
    spots.slice(0, wx.clouds || 0).forEach(([x, y, w]) => cl.push(cloud(x + (wx.wind ? .8 : 0), y, w, wx.rain || wx.storm)));
    if (wx.rain) cl.forEach((c) => { const top = c.y - .25, bottom = c.y > 11 ? Z.roofTop + .25 : 0.2;
      for (let i = 0; i < Math.round(c.w * 5); i++) { const x = c.x - c.w * .42 + rnd() * c.w * .84;
        for (let y = top - rnd() * .6; y > bottom; y -= 1.1 + rnd() * .4) L([M(x + (top - y) * .18, y), M(x + (top - y) * .18 + .12, y - .5)], 2.2, rainc, .75); } });
    if (wx.storm && cl[0]) { const c = cl[0], x = c.x + .4, y = c.y - .3;
      L([M(x, y), M(x - .55, y - 1.6), M(x + .05, y - 1.55), M(x - .5, y - 3.3), M(x + .9, y - 1.2), M(x + .25, y - 1.25), M(x + .7, y)], 3, o.ink, 1, true, sun, .95); }
    if (wx.snow) for (let i = 0; i < 70; i++) { const zone = [Z.left, Z.right, Z.roof][i % 3], x = zone[0] + rnd() * (zone[1] - zone[0]);
      const y = zone === Z.roof ? Z.roofTop + .5 + rnd() * (Z.top - Z.roofTop - .7) : .6 + rnd() * 9.5, p = M(x, y), r = 4 + rnd() * 5;
      g.globalAlpha = .85; g.strokeStyle = o.dark ? "#e9eef5" : "#7d8ea3"; g.lineWidth = 1.8;
      for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(p[0] - Math.cos(a) * r, p[1] - Math.sin(a) * r); g.lineTo(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r); g.stroke(); } g.globalAlpha = 1; }
    if (wx.wind) for (let i = 0; i < 6; i++) { const zone = i % 2 ? Z.left : Z.right, x = zone[0] + .3 + rnd() * (zone[1] - zone[0] - 3), y = 4.5 + rnd() * 5;
      const p = M(x, y), q = M(x + 2.4, y); g.beginPath(); g.moveTo(p[0], p[1]); g.bezierCurveTo(p[0] + 40, p[1] - 14, q[0] - 50, q[1] + 16, q[0], q[1] - 10);
      g.arc(q[0], q[1] - 22, 12, Math.PI / 2, -Math.PI * .6, true); g.lineWidth = 2.4; g.strokeStyle = o.soft; g.globalAlpha = .8; g.stroke(); g.globalAlpha = 1; }
  } else {
    if (wx.snow) { Z.snow.forEach((pl) => { L(pl.map(([x, y]) => M(x, y + .1)), 9, snowEdge, .9); L(pl.map(([x, y]) => M(x, y + .12)), 6, snowc, 1); });
      L([M(-9, .1), M(21, .1)], 10, snowEdge, .8); L([M(-9, .12), M(21, .12)], 7, snowc, 1); }
    if (wx.fog) for (let i = 0; i < 9; i++) { const y = .5 + i * .62, off = (i % 3) * 1.3; g.setLineDash([60 + i * 6, 22 + i * 3]);
      L([M(-9 + off, y), M(21, y)], 5 - i * .3, o.soft, .5 - i * .035); g.setLineDash([]); }
  }
}
const ART = {
  /* Zuhause: Südansicht des erfundenen Beispielhauses (Satteldach mit Gaube, PV, Carport links) */
  zuhause(g, o, cx = 1000, s = 56, gy = 735, wx = null) {
    const { L, rnd } = kit(g, o), M = (x, y) => [cx + (x - 6.5) * s, gy - y * s];
    const R = (x0, y0, x1, y1, w, c, a, f, fa) => L([M(x0, y0), M(x1, y0), M(x1, y1), M(x0, y1)], w, c, a, true, f, fa);
    const glass = o.dark ? "#8fb6d6" : "#5d8fb8", pv = o.dark ? "#4f74b0" : "#2b4a78", tile = o.dark ? "#f08a5d" : "#c4532c";
    const lit = wx && wx.night, warmw = o.dark ? "#f0b453" : "#d8921f";
    if (wx) wxLayer(g, o, M, s, L, wx, "back", ZU_WX);
    const win = (x0, x1, y0, y1, parts) => { R(x0, y0, x1, y1, 4, o.ink, .9, lit ? warmw : glass, lit ? .32 : .18); for (let i = 1; i < parts; i++) { const x = x0 + (x1 - x0) * i / parts; L([M(x, y0), M(x, y1)], 3, o.ink, .8); } };
    L([M(-9, 0), M(21, 0)], 5, o.ink, .75);
    for (let x = -8; x < 21; x += 1.1) L([M(x, -.45), M(x + .5, -.43)], 3, o.soft, .5);
    /* Satteldach, Traufe zur Straße: Ziegelschraffur, PV-Feld links, Gaube rechts, Schornstein */
    for (let x = -.3; x < 13.3; x += .3) L([M(x, 6.3), M(x + .9, 10.2)], 2, tile, .35);
    L([M(-.5, 6.2), M(.6, 10.3), M(12.4, 10.3), M(13.5, 6.2)], 5, o.ink, 1, true);
    for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) R(.9 + i * .9 + j * .25, 6.9 + j * 1.45, 1.72 + i * .9 + j * .25, 8.2 + j * 1.45, 2.4, o.dark ? "#7d9bd0" : "#3d5f94", .9, pv, .6);
    R(8.6, 6.6, 11.6, 8.9, 4, o.ink, 1, o.dark ? "#111110" : "#ebe9e5", 1); L([M(8.4, 8.9), M(11.8, 8.9)], 5, o.ink, 1);
    win(9.0, 11.2, 6.9, 8.5, 3);
    R(11.9, 9.6, 12.4, 11.3, 4, o.ink, .9);
    /* Hauswand, Geschossbänder, Fenster */
    R(0, 0, 13, 6.2, 5, o.ink, 1);
    for (const y of [2.7, 5.4]) L([M(0, y), M(13, y)], 2, o.soft, .35);
    win(.9, 2.5, 3.3, 4.8, 2); win(3.2, 4.8, 3.3, 4.8, 2); win(6.2, 7.2, 3.5, 4.8, 1); win(8.4, 12.2, 3.3, 4.8, 3);
    /* Balkon vor dem großen Fenster */
    R(8.2, 2.75, 12.4, 3.25, 3, o.ink, .9); for (let x = 8.35; x < 12.4; x += .28) L([M(x, 3.25), M(x, 3.9)], 1.8, o.ink, .65); L([M(8.2, 3.9), M(12.4, 3.9)], 3, o.ink, .9);
    /* Erdgeschoss zur Straße: Garagentor, Haustür mit Vordach, Fenster */
    R(.6, 0, 5.6, 2.25, 5, o.ink, 1); for (let y = .45; y < 2.2; y += .45) L([M(.7, y), M(5.5, y)], 2, o.soft, .7);
    R(6.6, 0, 7.6, 2.2, 4, o.ink, 1, glass, .1); L([M(6.75, 1.1), M(6.75, 1.4)], 3, o.ink, .9);
    R(6.2, 2.3, 8.0, 2.45, 4, o.ink, 1); L([M(6.3, 2.3), M(6.3, 1.9)], 2, o.soft, .8); L([M(7.9, 2.3), M(7.9, 1.9)], 2, o.soft, .8);
    win(8.6, 10.6, .9, 2.0, 2); win(11.1, 12.3, .9, 2.0, 1);
    /* Carport mit Flachdach links */
    L([M(-4.1, 0), M(-4.1, 2.85)], 5, o.ink, 1); L([M(-.35, 0), M(-.35, 2.85)], 5, o.ink, 1);
    R(-4.35, 2.85, 0, 3.15, 4, o.ink, 1);
    /* Bäume */
    const tree = (x, r, h) => { L([M(x, 0), M(x, h)], 6, o.ink, .9); for (let i = 0; i < 46; i++) { const a = rnd() * 6.28, d = Math.sqrt(rnd()) * r, c = M(x + Math.cos(a) * d, h + 1.2 + Math.sin(a) * d * .9);
      g.beginPath(); g.arc(c[0], c[1], (.25 + rnd() * .35) * s, 0, 7); g.lineWidth = 2; g.strokeStyle = o.soft; g.globalAlpha = .55; g.stroke(); g.globalAlpha = 1; } };
    tree(-7.2, 1.9, 2.8); tree(17.4, 2.2, 3.0);
    if (wx) wxLayer(g, o, M, s, L, wx, "front", ZU_WX);
    return { M, L, s };
  },
  /* Energie: PV-Dach, Sonne, Kabel zu Wechselrichter und BYD */
  energie(g, o) {
    const { L } = kit(g, o), sun = o.dark ? "#f0b453" : "#d8921f", pv = o.dark ? "#4f74b0" : "#2b4a78";
    const c = [1480, 230]; g.beginPath(); g.arc(c[0], c[1], 88, 0, 7); g.globalAlpha = .9; g.fillStyle = sun; g.fill(); g.globalAlpha = 1;
    for (let i = 0; i < 28; i++) { const a = i / 28 * 6.283, r0 = 112, r1 = 150 + (i % 2) * 34; L([[c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1]], 4, sun, .85); }
    const P = (u, v) => [380 + u * 120 + v * 70, 640 - v * 92 - u * 18];
    for (let u = 0; u < 7; u++) for (let v = 0; v < 4; v++) { const q = [P(u, v), P(u + .94, v), P(u + .94, v + .92), P(u, v + .92)];
      L(q, 3, o.dark ? "#7d9bd0" : "#3d5f94", .9, true, pv, .62); L([P(u + .47, v), P(u + .47, v + .92)], 1.4, o.soft, .5); }
    L([P(-.2, -.1), P(7.2, -.1)], 5, o.ink, .9); L([P(-.2, -.1), P(-.2, 4.1)], 4, o.ink, .7);
    for (let i = 0; i < 9; i++) { const t0 = i / 9; L([[c[0] - 120, c[1] + 60 + i * 6], [P(1 + t0 * 6, 3.6)[0], P(1 + t0 * 6, 3.6)[1]]], 1.6, sun, .3); }
    const iv = [1290, 470, 150, 190]; L([[iv[0], iv[1]], [iv[0] + iv[2], iv[1]], [iv[0] + iv[2], iv[1] + iv[3]], [iv[0], iv[1] + iv[3]]], 5, o.ink, 1, true);
    L([[iv[0] + 104, iv[1] + 18], [iv[0] + 134, iv[1] + 18], [iv[0] + 134, iv[1] + 36], [iv[0] + 104, iv[1] + 36]], 3, "#1f5ba8", 1, true, "#1f5ba8", .9);
    L([[iv[0] + 90, iv[1] + 160], [iv[0] + 136, iv[1] + 160]], 6, o.dark ? "#6be38a" : "#2c9c4f", 1);
    const tw = [1560, 400, 120];
    L([[tw[0], tw[1]], [tw[0] + tw[2], tw[1]], [tw[0] + tw[2], tw[1] + 60], [tw[0], tw[1] + 60]], 5, o.ink, 1, true, o.soft, .45);
    for (let m = 0; m < 3; m++) { const y = tw[1] + 66 + m * 78; L([[tw[0], y], [tw[0] + tw[2], y], [tw[0] + tw[2], y + 72], [tw[0], y + 72]], 5, o.ink, 1, true);
      L([[tw[0] + 14, y + 72 - 20 - m * 6], [tw[0] + tw[2] - 14, y + 72 - 20 - m * 6]], 4, o.dark ? "#6be38a" : "#2c9c4f", .8); }
    L([[tw[0] - 4, tw[1] + 302], [tw[0] + tw[2] + 4, tw[1] + 302], [tw[0] + tw[2] + 4, tw[1] + 322], [tw[0] - 4, tw[1] + 322]], 5, o.ink, 1, true, o.soft, .45);
    const cab = (pts, col) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); g.lineWidth = 4; g.strokeStyle = col; g.globalAlpha = .85; g.stroke(); g.globalAlpha = 1; };
    cab([P(7, .5), [1050, 600], [1180, 720], [iv[0] + 30, iv[1] + iv[3]]], sun);
    cab([[iv[0] + 80, iv[1] + iv[3]], [iv[0] + 90, 760], [tw[0] - 60, 760], [tw[0] + 20, tw[1] + 322]], o.dark ? "#6be38a" : "#2c9c4f");
    cab([[iv[0] + 130, iv[1] + iv[3]], [iv[0] + 150, 740], [1820, 740], [1880, 700]], o.dark ? "#a49ef0" : "#6760c4");
    L([[1840, 560], [1880, 700], [1920, 560]], 4, o.ink, .9); L([[1852, 600], [1908, 600]], 3, o.ink, .8);
  },
  /* Heizung: Speicher im Schnitt, Kollektoren, Brenner, Heizkörper */
  heizung(g, o) {
    const { L } = kit(g, o), heat = o.dark ? "#f08a5d" : "#c4532c", cool = o.dark ? "#79b8e8" : "#3681bf";
    const T = [920, 110, 160, 580];
    g.save(); g.beginPath(); g.roundRect(T[0], T[1], T[2], T[3], 80); g.clip();
    const gr = g.createLinearGradient(0, T[1], 0, T[1] + T[3]); gr.addColorStop(0, heat); gr.addColorStop(.55, o.dark ? "#d8a07c" : "#b98a6a"); gr.addColorStop(1, cool);
    g.globalAlpha = .55; g.fillStyle = gr; g.fillRect(T[0], T[1], T[2], T[3]); g.globalAlpha = 1;
    for (let y = T[1] + 70; y < T[1] + T[3]; y += 52) L([[T[0], y], [T[0] + T[2], y]], 2, o.soft, .35);
    const coil = (y0, n, col) => { for (let i = 0; i < n; i++) { const y = y0 + i * 22; g.beginPath(); g.ellipse(T[0] + T[2] / 2, y, 56, 9, 0, 0, 7); g.lineWidth = 4; g.strokeStyle = col; g.globalAlpha = .9; g.stroke(); g.globalAlpha = 1; } };
    coil(T[1] + 430, 5, o.dark ? "#ffcf7a" : "#c47f1a"); coil(T[1] + 250, 4, heat);
    g.restore();
    g.beginPath(); g.roundRect(T[0], T[1], T[2], T[3], 80); g.lineWidth = 6; g.strokeStyle = o.ink; g.stroke();
    for (const [x, y, a] of [[960, 520, -1], [1040, 360, 1]]) { g.beginPath(); g.arc(x, y, 34, a > 0 ? 3.6 : .5, a > 0 ? 5.8 : 2.7); g.lineWidth = 3; g.setLineDash([8, 8]); g.strokeStyle = o.ink; g.globalAlpha = .6; g.stroke(); g.setLineDash([]); g.globalAlpha = 1; }
    for (let n = 0; n < 3; n++) { const x = 180 + n * 150, q = [[x, 300], [x + 132, 270], [x + 132, 130], [x, 160]]; L(q, 4, o.ink, 1, true, o.dark ? "#2a2d33" : "#1e2126", .8);
      for (let k = 1; k < 8; k++) L([[x + k * 16.5, 300 - k * 3.75], [x + k * 16.5, 160 - k * 3.75]], 1.6, o.soft, .7); }
    const pipe = (pts, col) => L(pts, 6, col, .9);
    pipe([[640, 250], [760, 250], [760, 560], [T[0], 560]], o.dark ? "#ffcf7a" : "#c47f1a"); pipe([[640, 300], [720, 300], [720, 600], [T[0], 600]], cool);
    const bx = 1260, by = 520; L([[bx, by], [bx + 150, by], [bx + 150, by + 160], [bx, by + 160]], 5, o.ink, 1, true);
    g.beginPath(); g.moveTo(bx + 75, by + 128); g.bezierCurveTo(bx + 30, by + 100, bx + 60, by + 70, bx + 75, by + 40); g.bezierCurveTo(bx + 92, by + 70, bx + 120, by + 100, bx + 75, by + 128); g.globalAlpha = .9; g.fillStyle = heat; g.fill(); g.globalAlpha = 1;
    pipe([[bx, by + 40], [1180, by + 40], [1180, 380], [T[0] + T[2], 380]], heat); pipe([[bx, by + 120], [1140, by + 120], [1140, 430], [T[0] + T[2], 430]], cool);
    const rx = 1500, ry = 220; for (let i = 0; i < 9; i++) L([[rx + i * 34, ry], [rx + i * 34 + 22, ry], [rx + i * 34 + 22, ry + 200], [rx + i * 34, ry + 200]], 3.5, o.ink, .9, true);
    pipe([[T[0] + T[2], 200], [1440, 200], [1440, 250], [rx, 250]], heat); pipe([[rx, 400], [1420, 400], [1420, 470], [T[0] + T[2], 470]], cool);
    pipe([[T[0] + 80, T[1]], [T[0] + 80, 70], [1700, 70], [1700, 110]], heat);
    L([[1660, 110], [1740, 110], [1720, 135], [1680, 135]], 4, o.ink, 1, true);
    for (let i = 0; i < 9; i++) L([[1675 + i * 6, 145], [1668 + i * 7.5, 200 + (i % 3) * 14]], 2, cool, .7);
  },
  /* Geräte: Garage, Waschmaschine, Trockner, Spülmaschine, Echo */
  geraete(g, o) {
    const { L } = kit(g, o), gy = 700, blue = o.dark ? "#79b8e8" : "#3681bf", heat = o.dark ? "#f08a5d" : "#c4532c", home = o.dark ? "#a49ef0" : "#6760c4";
    const C = (cx, cy, r, w, col, a, fill, fa) => { g.beginPath(); g.arc(cx, cy, r, 0, 7); if (fill) { g.globalAlpha = fa; g.fillStyle = fill; g.fill(); } if (w) { g.globalAlpha = a; g.lineWidth = w; g.strokeStyle = col; g.stroke(); } g.globalAlpha = 1; };
    const box = (x, w, h, lw = 5) => L([[x, gy], [x + w, gy], [x + w, gy - h], [x, gy - h]], lw, o.ink, 1, true);
    L([[60, gy], [1940, gy]], 4, o.soft, .7);
    for (let x = 80; x < 1930; x += 66) L([[x, gy + 14], [x + 30, gy + 14]], 3, o.soft, .45);
    /* Garage mit Sektionaltor */
    L([[110, gy], [110, gy - 300], [280, gy - 400], [450, gy - 300], [450, gy]], 5, o.ink, 1);
    L([[160, gy], [160, gy - 250], [400, gy - 250], [400, gy]], 4, o.ink, .9);
    for (let i = 1; i < 6; i++) L([[164, gy - 250 + i * 41.5], [396, gy - 250 + i * 41.5]], 2.4, o.soft, .8);
    L([[170, gy - 266], [390, gy - 266]], 7, o.dark ? "#f0b453" : "#d8921f", .8);
    /* Waschmaschine */
    const wx = 560, w = 270, hh = 360; box(wx, w, hh);
    L([[wx, gy - hh + 66], [wx + w, gy - hh + 66]], 3, o.ink, .8);
    L([[wx + 18, gy - hh + 18], [wx + 92, gy - hh + 18], [wx + 92, gy - hh + 48], [wx + 18, gy - hh + 48]], 3, o.ink, .8, true);
    C(wx + w - 42, gy - hh + 33, 16, 3, o.ink, .9);
    const wc = [wx + w / 2, gy - 148];
    C(wc[0], wc[1], 100, 7, o.ink, 1); C(wc[0], wc[1], 80, 3, o.soft, .8, blue, .14);
    g.save(); g.beginPath(); g.arc(wc[0], wc[1], 79, 0, 7); g.clip();
    g.beginPath(); g.moveTo(wc[0] - 82, wc[1] + 22); for (let x = -82; x <= 82; x += 8) g.lineTo(wc[0] + x, wc[1] + 22 + Math.sin(x / 13) * 7);
    g.lineTo(wc[0] + 82, wc[1] + 90); g.lineTo(wc[0] - 82, wc[1] + 90); g.closePath(); g.globalAlpha = .4; g.fillStyle = blue; g.fill(); g.globalAlpha = 1;
    for (const [dx, dy, r] of [[-30, 0, 26], [18, 14, 30], [-6, -30, 20]]) C(wc[0] + dx, wc[1] + dy, r, 2.4, o.soft, .8);
    g.restore();
    /* Trockner (Mitte) */
    const dx = 865, dh = 360; box(dx, w, dh);
    L([[dx, gy - dh + 66], [dx + w, gy - dh + 66]], 3, o.ink, .8);
    L([[dx + 100, gy - dh + 20], [dx + 200, gy - dh + 20], [dx + 200, gy - dh + 46], [dx + 100, gy - dh + 46]], 3, o.ink, .9, true, o.dark ? "#2a2d33" : "#1e2126", .85);
    L([[dx + 18, gy - dh + 22], [dx + 76, gy - dh + 22], [dx + 76, gy - dh + 44], [dx + 18, gy - dh + 44]], 3, o.ink, .8, true);
    const dc = [dx + w / 2, gy - 150];
    C(dc[0], dc[1], 100, 7, o.ink, 1); C(dc[0], dc[1], 80, 3, o.soft, .8, heat, .1);
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; L([[dc[0] + Math.cos(a) * 40, dc[1] + Math.sin(a) * 40], [dc[0] + Math.cos(a) * 76, dc[1] + Math.sin(a) * 76]], 1.6, o.soft, .6); }
    for (let k = 0; k < 3; k++) { g.beginPath(); const x0 = dc[0] - 36 + k * 36; g.moveTo(x0, dc[1] - 112); g.bezierCurveTo(x0 - 16, dc[1] - 132, x0 + 16, dc[1] - 152, x0, dc[1] - 172);
      g.lineWidth = 3; g.strokeStyle = heat; g.globalAlpha = .55; g.stroke(); g.globalAlpha = 1; }
    /* Spülmaschine vollintegriert, Röntgenblick, timeLight */
    const sx = 1170, sh = 380; box(sx, w, sh);
    L([[sx, gy - 42], [sx + w, gy - 42]], 3, o.ink, .8); L([[sx + 30, gy - sh + 26], [sx + w - 30, gy - sh + 26]], 6, o.ink, .9);
    g.setLineDash([9, 8]);
    for (const y of [gy - 250, gy - 130]) L([[sx + 24, y], [sx + w - 24, y], [sx + w - 30, y + 70], [sx + 30, y + 70]], 2.6, o.soft, .8, true);
    g.setLineDash([]);
    for (let i = 0; i < 9; i++) L([[sx + 46 + i * 22, gy - 182], [sx + 46 + i * 22, gy - 246]], 2.2, o.soft, .7);
    for (let i = 0; i < 4; i++) C(sx + 70 + i * 44, gy - 90, 18, 2.2, o.soft, .7);
    L([[sx + 60, gy - 196], [sx + w - 60, gy - 196]], 4, blue, .6);
    g.beginPath(); g.ellipse(sx + w / 2, gy + 26, 70, 9, 0, 0, 7); g.globalAlpha = .5; g.fillStyle = blue; g.fill(); g.globalAlpha = 1;
    /* Echo mit Lichtring und Schallbögen */
    const ex = 1640, eh = 190, ew = 120;
    L([[ex, gy], [ex, gy - eh], [ex + ew, gy - eh], [ex + ew, gy]], 5, o.ink, 1);
    g.beginPath(); g.ellipse(ex + ew / 2, gy - eh, ew / 2, 14, 0, 0, 7); g.lineWidth = 6; g.strokeStyle = blue; g.globalAlpha = .9; g.stroke(); g.globalAlpha = 1;
    for (let y = gy - eh + 34; y < gy - 12; y += 16) L([[ex + 14, y], [ex + ew - 14, y]], 1.6, o.soft, .55);
    for (let k = 1; k <= 3; k++) { g.beginPath(); g.arc(ex + ew / 2, gy - eh - 10, 40 + k * 34, -2.4, -.74); g.lineWidth = 3; g.strokeStyle = home; g.globalAlpha = .75 - k * .15; g.stroke(); g.globalAlpha = 1; }
  },
  /* Einfahrt: Südansicht wie Zuhause, davor Carport mit Auto und Wallbox, Kamera mit Blickfeld, Pflaster und Straße */
  einfahrt(g, o) {
    const { M, L, s } = ART.zuhause(g, o, 1060, 50, 662);
    const warm = o.dark ? "#f0b453" : "#d8921f", red = o.dark ? "#ff6b5a" : "#c4532c", green = o.dark ? "#6be38a" : "#2c9c4f", glass = o.dark ? "#8fb6d6" : "#5d8fb8";
    const R = (x0, y0, x1, y1, w, c = o.ink, a = 1, f = null, fa = 1) => L([M(x0, y0), M(x1, y0), M(x1, y1), M(x0, y1)], w, c, a, true, f, fa);
    /* Licht unter dem Carport */
    const t = M(-4.1, 2.85), b = M(-.35, 0), gr = g.createLinearGradient(0, t[1], 0, b[1]);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, warm); g.globalAlpha = .26; g.fillStyle = gr; g.fillRect(t[0] + 4, t[1] + 4, b[0] - t[0] - 8, b[1] - t[1] - 4); g.globalAlpha = 1;
    /* Auto von hinten unter dem Carport */
    const cx = -2.25, hw = .92;
    R(cx - hw + .06, 0, cx - hw + .32, .22, 0, o.ink, 0, o.ink, .8); R(cx + hw - .32, 0, cx + hw - .06, .22, 0, o.ink, 0, o.ink, .8);
    L([M(cx - hw, .2), M(cx - hw, .82), M(cx - hw + .2, .9), M(cx - .66, 1.42), M(cx + .66, 1.42), M(cx + hw - .2, .9), M(cx + hw, .82), M(cx + hw, .2)], 4, o.ink, 1, true);
    L([M(cx - .58, .98), M(cx - .5, 1.33), M(cx + .5, 1.33), M(cx + .58, .98)], 2.6, o.ink, .9, true, glass, .18);
    L([M(cx - hw, .45), M(cx + hw, .45)], 2, o.soft, .8);
    R(cx - hw + .06, .62, cx - hw + .42, .74, 0, red, 0, red, .9); R(cx + hw - .42, .62, cx + hw - .06, .74, 0, red, 0, red, .9);
    R(cx - .26, .5, cx + .26, .62, 2, o.ink, .9);
    /* Wallbox am Pfosten, Kabel zum Auto */
    R(-3.95, .95, -3.6, 1.45, 3, o.ink, 1, o.soft, .2); L([M(-3.88, 1.32), M(-3.67, 1.32)], 3, green, 1);
    g.beginPath(); g.moveTo(...M(-3.78, .95)); g.bezierCurveTo(...M(-3.8, .35), ...M(-3.4, .3), ...M(cx - hw, .62)); g.lineWidth = 2.4; g.strokeStyle = o.ink; g.globalAlpha = .85; g.stroke(); g.globalAlpha = 1;
    /* Kamera unter dem Carport-Dach mit Blickfeld zur Straße */
    R(-.95, 2.6, -.55, 2.82, 3, o.ink, 1); const ck = M(-.62, 2.71); g.beginPath(); g.arc(ck[0], ck[1], 4.5, 0, 7); g.fillStyle = red; g.fill();
    g.setLineDash([7, 9]); L([M(-.75, 2.6), M(-3.2, -1.3)], 2, red, .55); L([M(-.75, 2.6), M(4.0, -1.3)], 2, red, .55); g.setLineDash([]);
    /* Einfahrt: Pflaster vor Carport und Garage, Bordstein und Straße */
    for (let r = 0; r < 2; r++) for (let x = -4.3 + (r % 2) * .42; x < 5.7; x += .84) {
      const y = -.32 - r * .42; L([M(x, y), M(x + .17, y + .15), M(x + .55, y + .15), M(x + .72, y), M(x + .55, y - .15), M(x + .17, y - .15)], 1.4, o.soft, .4, true); }
    L([M(-9, -1.5), M(21, -1.5)], 3, o.ink, .6);
  },
  /* Haus: EG-Grundriss von oben */
  haus(g, o) { planArt(g, o, 1); },
  /* Zimmer: DG-Grundriss von oben */
  zimmer(g, o) { planArt(g, o, 2); },
};
function planArt(g, o, fi) {
  {
    const { L } = kit(g, o), s = 52, x0 = 1000 - 6.5 * s, y0 = 400 - 5.625 * s;
    let plan = null; try { plan = PLAN; } catch (e) {}
    const M = (p) => [x0 + p[0] * s, y0 + p[1] * s];
    if (!plan) { L([M([0, 0]), M([13, 0]), M([13, 11.25]), M([0, 11.25])], 9, o.ink, 1, true); return; }
    const eg = plan[fi];
    L([[x0 - 8 * s, y0 + 13.6 * s], [x0 + 21 * s, y0 + 13.4 * s]], 4, o.soft, .7);
    for (let x = -7; x < 20; x += 1.2) L([[x0 + x * s, y0 + 14.0 * s], [x0 + (x + .55) * s, y0 + 14.0 * s]], 3, o.soft, .5);
    L(eg.foot.map(M), 10, o.ink, 1, true);
    eg.rooms.forEach((r) => {
      if (r.u === "X") { g.setLineDash([10, 9]); L(r.p.map(M), 3, o.soft, .8, true); g.setLineDash([]); return; }
      L(r.p.map(M), 4, o.ink, .85, true, r.u === "H" ? (o.dark ? "#78aee8" : "#2d6bb0") : r.u === "O" ? (o.dark ? "#a49ef0" : "#6760c4") : null, .08);
      if (r.stair) { const [a0, a1, a2, a3] = r.p; for (let n = 1; n < 12; n++) { const u = n / 12; L([M([a0[0] + (a3[0] - a0[0]) * u, a0[1] + (a3[1] - a0[1]) * u]), M([a1[0] + (a2[0] - a1[0]) * u, a1[1] + (a2[1] - a1[1]) * u])], 2, o.ink, .6); } }
    });
    const n = [x0 + 15 * s, y0 + 1 * s]; L([[n[0], n[1] + 70], [n[0], n[1] - 10]], 4, o.ink, .9); L([[n[0] - 16, n[1] + 14], [n[0], n[1] - 14], [n[0] + 16, n[1] + 14]], 4, o.ink, .9);
    g.font = "600 34px Geist, sans-serif"; g.fillStyle = o.ink; g.textAlign = "center"; g.fillText("N", n[0], n[1] + 110);
    /* Markise über der Terrasse hinten (Nord, Mitte) */
    if (fi === 1) { const mx0 = 4.6, mx1 = 8.4, my0 = 0, my1 = -2.6;
      for (let i = 0; i <= 10; i++) { const x = mx0 + (mx1 - mx0) * i / 10; L([M([x, my0]), M([x, my1])], i % 2 ? 2 : 3.5, o.dark ? "#f08a5d" : "#c4532c", .7); }
      L([M([mx0, my1]), M([mx1, my1])], 4, o.ink, .9); }
  }
}
function initSculpture(motiv, draw) {
  $(".hint").textContent = matchMedia("(hover: none), (pointer: coarse)").matches ? "Zeichnung berühren" : "Über die Zeichnung streichen";
  const so = { stage: $(".stage"), img: $(".sc-fallback"), backdrop: $(".backdrop"), hint: $(".hint"), srcs: makeArt(draw || ART[motiv] || ART.haus), parallax: 0.3,
    band: () => { const n = $(".nav").getBoundingClientRect(), c = $(".hero-copy").getBoundingClientRect(); return { top: n.bottom + scrollY + 8, bottom: c.top + scrollY - 8 }; },
    bg: () => cssv("--bg"), dark: isDark };
  const s = GlasSculpture(so);
  /* Motiv austauschen (z. B. Wetter): neue Zeichnung, die Partikel blenden über */
  s.setArt = (d) => { so.srcs = makeArt(d); s.retheme(); };
  new MutationObserver(() => s.retheme()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => s.retheme());
  if (document.fonts) document.fonts.ready.then(() => s.place());
  const hint = $(".hint");
  addEventListener("scroll", () => (hint.style.opacity = scrollY > 60 ? "0" : ""), { passive: true });
  window.SCULPT = s;
  initTablet();
  return s;
}

/* Carport-Kamera (Demo fürs Live-Bild): Blick aus dem Carport über den gepflasterten Hof auf die Straße.
 * In VIS 2 ersetzt ein <img> mit 0_userdata.0.Einfahrt.liveBild diese Zeichnung. */
function camScene(cv, opt = {}) {
  const g = cv.getContext("2d"), W = 640, H = 360;
  let raf = 0, t0 = 0, kind = null, o = {}, fired = false, vis = true, run = false;
  const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
  const lerp = (a, b, t) => a + (b - a) * t;
  function fit() { const w = Math.max(320, Math.round(cv.clientWidth * Math.min(2, devicePixelRatio || 1))); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * 9 / 16); } }
  function poly(pts, fill, stroke, lw = 1) { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
  function scene(t) {
    g.fillStyle = "#d9d3c8"; g.fillRect(0, 0, W, H);
    poly([[300, 0], [640, 0], [640, 14], [300, 34]], "#b9654a");
    g.fillStyle = "#ece7de"; g.fillRect(300, 30, 340, 46);
    for (const x of [360, 440, 520, 600]) { g.fillStyle = "#5d6c78"; g.fillRect(x, 40, 26, 22); g.strokeStyle = "#fff"; g.lineWidth = 2; g.strokeRect(x, 40, 26, 22); }
    for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(420 + i * 9, 72 + Math.sin(i * 1.7) * 4, 9 + (i % 3) * 2, 0, 7); g.fillStyle = i % 2 ? "#5f7a4c" : "#6f8a58"; g.fill(); }
    poly([[230, 96], [640, 66], [640, 122], [212, 140]], "#55585c");
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.2; g.setLineDash([14, 12]); g.beginPath(); g.moveTo(240, 118); g.lineTo(640, 94); g.stroke(); g.setLineDash([]);
    poly([[212, 140], [640, 122], [640, 126], [212, 144]], "#9b968d");
    poly([[212, 144], [640, 126], [640, 360], [0, 360], [0, 236]], "#a9a398");
    for (let r = 0; r < 14; r++) {
      const y = 150 + Math.pow(r / 13, 1.6) * 210, s = .25 + (y - 140) / 220, x0 = lerp(212, 0, (y - 144) / 216) - 20;
      for (let x = x0 + (r % 2) * 14 * s; x < 660; x += 28 * s) {
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7 * s, y - 4 * s); g.lineTo(x + 17 * s, y - 4 * s); g.lineTo(x + 24 * s, y); g.lineTo(x + 17 * s, y + 4 * s); g.lineTo(x + 7 * s, y + 4 * s); g.closePath();
        g.strokeStyle = "rgba(70,62,52,.22)"; g.lineWidth = .8; g.stroke();
      }
    }
    g.beginPath(); g.ellipse(430, 220, 26, 8, -.05, 0, 7); g.strokeStyle = "rgba(60,55,48,.45)"; g.lineWidth = 1.5; g.stroke();
    poly([[590, 0], [640, 0], [640, 360], [598, 360]], "#f3f1ec", "#c9c4ba");
    for (let y = 40; y < 360; y += 30) { g.strokeStyle = "rgba(0,0,0,.08)"; g.beginPath(); g.moveTo(598, y); g.lineTo(640, y - 2); g.stroke(); }
    poly([[0, 0], [640, 0], [640, 16], [0, 44]], "#2b2a28");
    g.fillStyle = "#33312e"; g.fillRect(0, 0, 22, 360);
    const gl = g.createRadialGradient(80, 330, 10, 80, 330, 220); gl.addColorStop(0, "rgba(255,190,110,.35)"); gl.addColorStop(1, "rgba(255,190,110,0)"); g.fillStyle = gl; g.fillRect(0, 140, 320, 220);
    g.beginPath(); g.moveTo(0, 246); g.bezierCurveTo(70, 250, 150, 276, 196, 360); g.lineTo(0, 360); g.closePath(); g.fillStyle = "#3a4048"; g.fill();
    g.beginPath(); g.moveTo(0, 262); g.bezierCurveTo(60, 266, 120, 286, 156, 330); g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 3; g.stroke();
    const hit = o.lineHit && t - o.lineHit < 1.2;
    g.setLineDash([8, 6]); g.strokeStyle = hit ? "rgba(235,70,50,.95)" : "rgba(255,214,64,.7)"; g.lineWidth = hit ? 3 : 2;
    g.beginPath(); g.moveTo(222, 168); g.lineTo(590, 146); g.stroke(); g.setLineDash([]);
  }
  function car(x, y, s, col, lights) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(0, 30, 66, 10, 0, 0, 7); g.fill();
    g.fillStyle = col; g.beginPath(); g.roundRect(-62, -10, 124, 40, 12); g.fill();
    g.beginPath(); g.moveTo(-44, -10); g.lineTo(-30, -42); g.lineTo(30, -42); g.lineTo(44, -10); g.closePath(); g.fill();
    g.fillStyle = "rgba(25,32,40,.85)"; g.beginPath(); g.moveTo(-38, -12); g.lineTo(-26, -38); g.lineTo(26, -38); g.lineTo(38, -12); g.closePath(); g.fill();
    g.fillStyle = "rgba(255,255,255,.25)"; g.beginPath(); g.moveTo(-26, -38); g.lineTo(-6, -38); g.lineTo(-22, -14); g.lineTo(-34, -14); g.closePath(); g.fill();
    g.fillStyle = "#1c1d20"; g.fillRect(-56, 22, 18, 12); g.fillRect(38, 22, 18, 12);
    for (const sx of [-46, 46]) { g.fillStyle = lights ? "#fff6dc" : "#d9d4c8"; g.beginPath(); g.ellipse(sx, 2, 11, 6, 0, 0, 7); g.fill();
      if (lights) { const lg = g.createRadialGradient(sx, 2, 2, sx, 2, 40); lg.addColorStop(0, "rgba(255,246,220,.7)"); lg.addColorStop(1, "rgba(255,246,220,0)"); g.fillStyle = lg; g.fillRect(sx - 40, -38, 80, 80); } }
    g.fillStyle = "#f4f4f0"; g.fillRect(-20, 12, 40, 11); g.fillStyle = "#24408f"; g.fillRect(-20, 12, 5, 11);
    g.fillStyle = "#222"; g.font = "600 7px ui-monospace, Menlo, monospace"; g.textAlign = "center"; g.fillText("·· ···", 3, 20.5);
    g.restore();
  }
  function person(x, y, s, t, parcel) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(0, 46, 16, 5, 0, 0, 7); g.fill();
    const k = Math.sin(t * 7) * 7;
    g.strokeStyle = "#2b2f38"; g.lineWidth = 6; g.lineCap = "round";
    g.beginPath(); g.moveTo(-4, 18); g.lineTo(-4 + k * .6, 44); g.moveTo(4, 18); g.lineTo(4 - k * .6, 44); g.stroke();
    g.fillStyle = parcel ? "#e3b320" : "#46607a"; g.beginPath(); g.roundRect(-11, -14, 22, 36, 7); g.fill();
    g.fillStyle = "#e6c3a6"; g.beginPath(); g.arc(0, -24, 9, 0, 7); g.fill();
    g.fillStyle = parcel ? "#c6211f" : "#2b2f38"; g.fillRect(-9, -33, 18, 6);
    if (parcel) { g.fillStyle = "#b8895a"; g.fillRect(-14, -2, 28, 20); g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 1.2; g.strokeRect(-14, -2, 28, 20); g.beginPath(); g.moveTo(0, -2); g.lineTo(0, 18); g.stroke(); }
    g.restore();
  }
  function box(x, y, w, h, label) {
    g.strokeStyle = "#ffd23f"; g.lineWidth = 1.6; g.strokeRect(x - w / 2, y - h / 2, w, h);
    g.font = "600 10px ui-monospace, Menlo, monospace"; const tw = g.measureText(label).width + 8;
    g.fillStyle = "#ffd23f"; g.fillRect(x - w / 2 - .8, y - h / 2 - 14, tw, 14); g.fillStyle = "#111"; g.textAlign = "left"; g.fillText(label, x - w / 2 + 3, y - h / 2 - 3.5);
  }
  function osd() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    const txt = p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + " " + ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][d.getDay()] + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    g.font = "600 13px ui-monospace, Menlo, monospace"; g.textAlign = "left"; g.fillStyle = "rgba(0,0,0,.55)"; g.fillText(txt, 33, 63); g.fillStyle = "#fff"; g.fillText(txt, 32, 62);
    g.textAlign = "right"; g.fillStyle = "rgba(0,0,0,.55)"; g.fillText("Carport", 581, 347); g.fillStyle = "#fff"; g.fillText("Carport", 580, 346);
    if ((Date.now() / 600 | 0) % 2) { g.fillStyle = "#e5483a"; g.beginPath(); g.arc(552, 36, 4.5, 0, 7); g.fill(); }
    g.textAlign = "left"; g.fillStyle = "#fff"; g.font = "600 11px ui-monospace, Menlo, monospace"; g.fillText("LIVE", 561, 40);
  }
  function frame(now) {
    raf = 0; if (!run || !vis) return;
    fit(); const sx = cv.width / W; g.setTransform(sx, 0, 0, sx, 0, 0);
    const t = (now - t0) / 1000, ir = opt.ir ? opt.ir() : false;
    g.filter = ir ? "grayscale(1) contrast(1.2) brightness(1.05)" : "none";
    scene(t);
    if (kind === "auto") {
      const a = ease(t / 2.4), b = ease((t - 2.2) / 2.8);
      const x = t < 2.2 ? lerp(700, 420, a) : lerp(420, 250, b), y = t < 2.2 ? lerp(66, 104, a) : lerp(104, 250, b);
      const s = .32 + (y - 66) / 184 * .95;
      car(x, y, s, o.color || "#3d5f94", o.lights);
      if (y > 150 && !o.lineHit) o.lineHit = t;
      if (t > 2.6) box(x, y - 6 * s, 140 * s, 96 * s, (o.label || "Fahrzeug") + " 97 %");
    } else if (kind === "person") {
      const a = ease(t / 6), x = lerp(500, 330, a), y = lerp(118, 236, a), s = .55 + (y - 118) / 118 * .75;
      person(x, y, s, t, o.parcel);
      if (y > 156 && !o.lineHit) o.lineHit = t;
      if (t > 1.6) box(x, y + 4 * s, 46 * s, 96 * s, "Person 94 %");
    }
    if (o.lineHit && !fired && t - o.lineHit > .4) { fired = true; o.onDetect && o.onDetect(); }
    g.filter = "none";
    for (let i = 0; i < 160; i++) { g.fillStyle = Math.random() < .5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.06)"; g.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4); }
    osd();
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && run && vis) raf = requestAnimationFrame(frame); }
  new IntersectionObserver((e) => { vis = e[0].isIntersecting; start(); }).observe(cv);
  return {
    play(k, opts = {}) { kind = k; o = Object.assign({}, opts); fired = false; t0 = performance.now(); run = true; start(); },
    idle() { kind = null; o = {}; run = true; start(); },
    stop() { run = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
  };
}

/* Wand-Tablet: Bildschirmschoner, Nachtmodus 22–06 Uhr, Alarm-Banner, Display wach halten */
function initTablet() {
  const KEY = "glashaus.tablet";
  let cfg = { saver: 60, night: "auto" };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };
  const body = document.body;

  body.insertAdjacentHTML("beforeend",
    '<div class="tint" aria-hidden="true"></div>' +
    '<div class="screen" aria-hidden="true"><span class="shint" data-shint></span><div class="screen-in">' +
    '<div><div class="sclock" data-clock>00:00</div><div class="sdate" data-date></div></div>' +
    '<div class="schips">' +
    '<span class="schip glass" style="--c:var(--cool)"><svg><use href="#i-thermo"/></svg><span>9,4 °C außen</span></span>' +
    '<span class="schip glass" data-sgar style="--c:var(--ok)"><svg><use href="#i-garage"/></svg><span>Garage zu</span></span>' +
    '<span class="schip glass" style="--c:var(--batt)"><svg><use href="#i-byd"/></svg><span data-ssoc>Batterie –</span></span>' +
    "</div></div></div>" +
    '<div class="alarm glass" role="alert" aria-live="assertive"><span class="ico"><svg><use href="#i-bell"/></svg></span>' +
    '<div><b data-at></b><small data-ad></small></div><button class="btn" type="button" data-ack>Quittieren</button></div>');

  const vis = $("main.grid > details.vis");
  if (vis) vis.insertAdjacentHTML("beforebegin",
    '<article class="glass tile s-12" id="tablet" style="--i:6"><div class="tile-h"><h2><span class="ico" style="--c:var(--fg)"><svg><use href="#i-moon"/></svg></span>Wand-Tablet</h2><span class="pill" data-tstate>Tag</span></div>' +
    '<div class="tcfg">' +
    '<div><h3>Bildschirmschoner</h3><div class="segs" data-seg="saver"><button type="button" data-v="30">30 s</button><button type="button" data-v="60">1 min</button><button type="button" data-v="300">5 min</button><button type="button" data-v="0">Aus</button></div>' +
    '<div class="btns"><button class="btn" type="button" data-saver-now>Jetzt zeigen</button></div>' +
    "<p>Ohne Berührung bleibt nur die Skulptur mit Uhr. <b>Antippen</b> öffnet das Dashboard, <b>Wischen</b> spielt mit der Form.</p></div>" +
    '<div><h3>Nachtmodus</h3><div class="segs" data-seg="night"><button type="button" data-v="auto">22–06 Uhr</button><button type="button" data-v="on">Immer</button><button type="button" data-v="off">Aus</button></div>' +
    "<p>Dunkel und gedimmt. Schon nach <b>20 Sekunden</b> nur noch Uhr, Außentemperatur, Garage und Batterie.</p></div>" +
    '<div><h3>Alarm testen</h3><div class="btns"><button class="btn" type="button" data-alarm="info">Info</button><button class="btn" type="button" data-alarm="warn">Warnung</button><button class="btn" type="button" data-alarm="crit">Kritisch</button></div>' +
    '<p>Stufen wie im PV-Überwachungsscript. Kritisch färbt die Seite rot und hält das Display wach. <span data-wl></span></p>' +
    '<h3 style="margin-top:18px">Anruf testen</h3><div class="btns"><button class="btn" type="button" data-calltest="oma">Opa ruft an</button><button class="btn" type="button" data-calltest="fremd">Unbekannte Nummer</button></div>' +
    '<p>Im Standby vibriert das FRITZ!Fon und zeigt die Nummer. Tipp auf „Jetzt zeigen“ und dann einen Anruf, um es zu sehen.</p>' +
    '<h3 style="margin-top:18px">Bewegung testen</h3><div class="btns"><button class="btn" type="button" data-motiontest="auto">Auto kommt heim</button><button class="btn" type="button" data-motiontest="fremd">Fremdes Auto</button><button class="btn" type="button" data-motiontest="paket">Paketbote</button></div>' +
    '<p>Die Carport-Kamera meldet Bewegung: Das Live-Bild erscheint wie ein Anruf, im Standby groß in der Mitte.</p></div>' +
    "</div></article>");

  /* Einstellungen */
  const syncSegs = () => $$("[data-seg]").forEach((g) => g.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(cfg[g.dataset.seg]) === b.dataset.v)));
  $$("[data-seg] button").forEach((b) => b.addEventListener("click", () => {
    const k = b.closest("[data-seg]").dataset.seg; cfg[k] = k === "saver" ? +b.dataset.v : b.dataset.v; save(); syncSegs(); applyNight();
  }));
  syncSegs();

  /* Nachtmodus */
  let night = null, prevTheme = null, forced = false;
  const isNight = () => cfg.night === "on" || (cfg.night === "auto" && (new Date().getHours() >= 22 || new Date().getHours() < 6));
  function applyNight() {
    const n = isNight();
    if (n === night) return;
    night = n;
    body.classList.toggle("night", n);
    if (n) { prevTheme = root.dataset.theme ?? null; root.dataset.theme = "dark"; forced = true; }
    else if (forced) { forced = false; if (prevTheme) root.dataset.theme = prevTheme; else delete root.dataset.theme; }
    themeIcon();
    const ts = $("[data-tstate]"); if (ts) { ts.className = "pill " + (n ? "info" : "idle"); ts.textContent = n ? "Nacht" : "Tag"; }
    $("[data-shint]").textContent = n ? "Nachtmodus · antippen zum Öffnen" : "Antippen zum Öffnen · Wischen spielt mit der Form";
    if (idle) SCULPT.setAmbient(true, n ? 0.45 : 0.7);
  }

  /* Bildschirmschoner */
  let idle = false, last = Date.now(), crit = false;
  const status = () => {
    $("[data-ssoc]").textContent = "Batterie " + Math.round(D[nowIdx()].soc) + " %";
    const g = window.GH_GARAGE || "zu", gc = $("[data-sgar]");
    gc.style.setProperty("--c", g === "zu" ? "var(--ok)" : "var(--warn)");
    gc.querySelector("span").textContent = "Garage " + ({ zu: "zu", offen: "offen", oeffnet: "öffnet", schliesst: "schließt" }[g] || g);
  };
  function enter() {
    if (idle || crit) return;
    idle = true; scrollTo(0, 0); status(); clock();
    body.classList.add("idle"); $(".screen").setAttribute("aria-hidden", "false");
    SCULPT.place(); SCULPT.setAmbient(true, night ? 0.45 : 0.7);
  }
  function exit() {
    if (!idle) return;
    idle = false; last = Date.now();
    body.classList.remove("idle"); $(".screen").setAttribute("aria-hidden", "true");
    SCULPT.setAmbient(false);
  }
  const activity = () => { if (!idle) last = Date.now(); };
  ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"].forEach((ev) => addEventListener(ev, activity, { passive: true }));
  addEventListener("keydown", () => exit());
  let down = null;
  const scr = $(".screen");
  scr.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  scr.addEventListener("pointerup", (e) => { if (callBox && callBox.classList.contains("show")) return; if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 12) exit(); down = null; });
  $("[data-saver-now]").addEventListener("click", () => setTimeout(enter, 150));
  setInterval(() => {
    applyNight();
    if (idle) { status(); return; }
    const lim = (night ? 20 : cfg.saver) * 1000;
    if (cfg.saver > 0 && !crit && Date.now() - last > lim) enter();
  }, 1000);
  applyNight();

  /* Alarm-Banner */
  const AL = {
    info: { c: "var(--home)", i: "i-bolt", t: "Netzfrequenz 50,21 Hz", d: "Außerhalb 49,8–50,2 Hz · Hinweis per Telegram" },
    warn: { c: "var(--warn)", i: "i-garage", t: "Garage nachts offen", d: "Kontakt offen seit 22:14 · Telegram gesendet, Alexa schweigt bis 7 Uhr" },
    crit: { c: "var(--crit)", i: "i-power", t: "Stromausfall · Inselbetrieb", d: "SMA 30881 = 1781 · Batterie versorgt das Haus · Ansage auf beiden Echos alle 10 min" },
  };
  const box = $(".alarm");
  let infoT = 0;
  function raise(level) {
    const a = AL[level];
    box.className = "alarm glass show " + level; box.style.setProperty("--c", a.c);
    box.querySelector("use").setAttribute("href", "#" + a.i);
    $("[data-at]").textContent = a.t;
    $("[data-ad]").textContent = a.d + " · " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    crit = level === "crit"; body.classList.toggle("crit", crit);
    if (crit) { exit(); keepAwake(); }
    clearTimeout(infoT); if (level === "info") infoT = setTimeout(ack, 12000);
  }
  function ack() { box.classList.remove("show"); crit = false; body.classList.remove("crit"); last = Date.now(); }
  $("[data-ack]").addEventListener("click", ack);
  $$("[data-alarm]").forEach((b) => b.addEventListener("click", () => raise(b.dataset.alarm)));
  window.GH_ALARM = raise;


  /* Eingehender Anruf (tr-064.0.callmonitor): FRITZ!Fon vibriert und zeigt die Nummer */
  const LEITUNG = [{ ende: "123456", name: "Fam. Familie", echo: "Echo Küche" }, { ende: "45678", name: "Opa", echo: "Echo Opa" }];
  const phoneSVG = (num, name, ini) =>
    '<svg class="phone" viewBox="0 0 120 300" aria-hidden="true"><defs><linearGradient id="fbB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9eaeb"/><stop offset=".18" stop-color="#ffffff"/><stop offset=".85" stop-color="#f7f7f7"/><stop offset="1" stop-color="#d9dadc"/></linearGradient>' +
    '<linearGradient id="fbS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f6b3a"/><stop offset="1" stop-color="#9cbf6a"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="112" height="292" rx="26" fill="#cfd1d4"/><rect x="6" y="3" width="108" height="290" rx="25" fill="url(#fbB)" stroke="rgba(0,0,0,.08)"/>' +
    '<circle cx="60" cy="20" r="8.5" fill="none" stroke="#c9cbce" stroke-width="2.2"/>' +
    '<text x="60" y="39" text-anchor="middle" font-size="7.5" font-weight="800" fill="#2b2b2b" font-family="var(--font)" letter-spacing="-.2">FRITZ!Fon</text>' +
    '<rect x="14" y="44" width="92" height="84" rx="3" fill="#111"/>' +
    '<rect x="16" y="46" width="88" height="8" fill="#1d1d1d"/><rect x="18" y="49" width="6" height="3" fill="#7bd34f"/><rect x="92" y="48.5" width="9" height="4" rx="1" fill="#7bd34f"/>' +
    '<rect x="16" y="54" width="88" height="54" fill="url(#fbS)"/><circle cx="60" cy="75" r="15" fill="rgba(255,255,255,.88)"/>' +
    '<text x="60" y="80.5" text-anchor="middle" font-size="14" font-weight="600" fill="#3f6b3a" font-family="var(--font)">' + ini + "</text>" +
    '<rect x="16" y="94" width="88" height="22" fill="rgba(240,240,240,.92)"/>' +
    '<text x="60" y="103" text-anchor="middle" font-size="6.4" font-weight="600" fill="#222" font-family="var(--font)">' + num + "</text>" +
    '<text x="60" y="112" text-anchor="middle" font-size="7.2" font-weight="700" fill="#111" font-family="var(--font)">' + name + "</text>" +
    '<rect x="16" y="117" width="43" height="9" fill="#555"/><rect x="61" y="117" width="43" height="9" fill="#555"/>' +
    '<text x="37.5" y="123.6" text-anchor="middle" font-size="5" fill="#fff" font-family="var(--font)">Ablehnen</text><text x="82.5" y="123.6" text-anchor="middle" font-size="5" fill="#fff" font-family="var(--font)">Annehmen</text>' +
    '<rect x="14" y="134" width="92" height="9" rx="2" fill="#f1f1f1" stroke="#ddd" stroke-width=".6"/><text x="60" y="140.6" text-anchor="middle" font-size="4.6" fill="#555" font-family="var(--font)">MENU</text>' +
    '<rect x="44" y="146" width="32" height="32" rx="7" fill="#f4f4f4" stroke="#aaa" stroke-width="1"/><text x="60" y="165" text-anchor="middle" font-size="8" font-weight="600" fill="#333" font-family="var(--font)">OK</text>' +
    '<path d="M20 170 q3 -8 9 -9" stroke="#2e9b3e" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M92 166 q6 -4 12 0" stroke="#d43a2f" stroke-width="3" fill="none" stroke-linecap="round"/>' +
    [0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => '<rect x="' + (17 + c * 30) + '" y="' + (186 + r * 22) + '" width="26" height="18" rx="5" fill="#f6f6f6" stroke="#d2d3d5" stroke-width=".8"/>' +
      '<text x="' + (30 + c * 30) + '" y="' + (198 + r * 22) + '" text-anchor="middle" font-size="7" fill="#333" font-family="var(--font)">' + ["1","2","3","4","5","6","7","8","9","*","0","#"][r * 3 + c] + "</text>").join("")).join("") +
    '<circle cx="60" cy="282" r="1.4" fill="#bbb"/></svg>';
  body.insertAdjacentHTML("beforeend", '<div class="callfade" aria-hidden="true"></div><div class="call" role="alert" aria-live="assertive"><div class="pwrap"><span class="waves"><i></i><i></i><i></i></span><span data-cphone></span></div>' +
    '<div class="ctext"><div class="cline" data-cline>Anruf</div><div class="cname" data-cname></div><div class="cnum" data-cnum></div><div class="cecho" data-cecho></div>' +
    '<div class="cbtns"><button class="btn" type="button" data-cend>Ablehnen</button><button class="btn" type="button" data-cok>Annehmen</button></div></div></div>');
  const callBox = $(".call"), fade = $(".callfade");
  let callT = 0, current = null;
  function incoming(c) {
    const l = LEITUNG.find((x) => String(c.callee || "").endsWith(x.ende)) || LEITUNG[0];
    current = Object.assign({}, c, { leitung: l, at: new Date() });
    const name = c.callerName || "Unbekannt", num = c.caller || "Rufnummer unterdrückt";
    const ini = c.callerName ? c.callerName.trim()[0].toUpperCase() : "?";
    $("[data-cphone]").innerHTML = phoneSVG(num, name, ini);
    $("[data-cline]").textContent = "Anruf für " + l.name;
    $("[data-cname]").innerHTML = c.callerName ? name : '<em>Unbekannt</em>';
    $("[data-cnum]").textContent = num;
    $("[data-cecho]").textContent = "Ansage läuft auf " + l.echo + " · Leitung …" + l.ende;
    callBox.classList.add("show"); fade.classList.add("show");
    body.classList.add("calling");
    try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) {}
    clearTimeout(callT); callT = setTimeout(() => endCall("verpasst"), 15000);
  }
  function endCall(how) {
    clearTimeout(callT);
    callBox.classList.remove("show"); fade.classList.remove("show"); body.classList.remove("calling");
    if (how === "verpasst" && current) {
      const chips = $(".schips"), old = $(".schip.missed");
      if (old) old.remove();
      chips.insertAdjacentHTML("afterbegin", '<span class="schip glass missed"><svg><use href="#i-bell"/></svg><span>Verpasst · ' +
        (current.callerName || current.caller || "Unbekannt") + " · " + current.at.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + "</span></span>");
    }
    if (how !== "verpasst") $(".schip.missed")?.remove();
    current = null;
  }
  $("[data-cend]").addEventListener("click", () => { endCall("abgelehnt"); toast("Anruf abgelehnt (Demo)"); });
  $("[data-cok]").addEventListener("click", () => { endCall("angenommen"); toast("Bitte am FRITZ!Fon abnehmen (Demo)"); });
  const DEMO = { oma: { caller: "… 45678", callerName: "Opa", callee: "0000123456" }, fremd: { caller: "+49 170 1234567", callerName: "", callee: "0000123456" } };
  $$("[data-calltest]").forEach((b) => b.addEventListener("click", () => setTimeout(() => incoming(DEMO[b.dataset.calltest]), 600)));
  window.GH_CALL = incoming; window.GH_CALL_END = endCall;

  /* Bewegung an der Einfahrt (0_userdata.0.Einfahrt.bewegung): Live-Bild der Carport-Kamera wie ein Anruf */
  body.insertAdjacentHTML("beforeend", '<div class="camfade" aria-hidden="true"></div><div class="cam" role="alert" aria-live="assertive"><div class="cframe"><canvas data-camcv aria-label="Live-Bild der Carport-Kamera"></canvas></div>' +
    '<div class="ctext"><div class="cline" data-camline>Bewegung</div><div class="cname" data-camname></div><div class="cnum" data-camsub></div>' +
    '<div class="cbtns"><button class="btn" type="button" data-mlight>Licht an</button><button class="btn" type="button" data-mclose>Schließen</button></div></div></div>');
  const camBox = $(".cam"), camFade = $(".camfade");
  let camT = 0, camS = null;
  function motion(m) {
    if (!camS) camS = camScene($("[data-camcv]"), { ir: () => body.classList.contains("night") });
    $("[data-camline]").textContent = "Bewegung · " + (m.ziel || "Fahrzeug") + " · Carport";
    $("[data-camname]").innerHTML = "<em>Wird erkannt …</em>";
    $("[data-camsub]").textContent = "Live-Bild · ein Bild pro Sekunde";
    camBox.classList.add("show"); camFade.classList.add("show"); body.classList.add("motion");
    camS.play(m.ziel === "Person" ? "person" : "auto", { color: m.farbe, parcel: !!m.lieferdienst, lights: body.classList.contains("night"), label: m.name || "Fahrzeug",
      onDetect: () => {
        $("[data-camname]").innerHTML = m.name ? m.name + (m.richtung === "ausfahrt" ? " <em>fährt los</em>" : " <em>kommt heim</em>")
          : m.lieferdienst ? m.lieferdienst + " <em>mit Paket</em>" : m.ziel === "Person" ? "Person <em>an der Einfahrt</em>" : "<em>Unbekanntes</em> Fahrzeug";
        $("[data-camsub]").textContent = [m.kennzeichen, m.fahrzeug, m.fahrt].filter(Boolean).join(" · ") || "erkannt von der KI";
      } });
    try { if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate([200, 100, 200]); } catch (e) {}
    clearTimeout(camT); camT = setTimeout(endMotion, 30000);
  }
  function endMotion() { clearTimeout(camT); camBox.classList.remove("show"); camFade.classList.remove("show"); body.classList.remove("motion"); setTimeout(() => camS && !camBox.classList.contains("show") && camS.stop(), 700); }
  $("[data-mclose]").addEventListener("click", endMotion);
  $("[data-mlight]").addEventListener("click", (e) => { const on = e.currentTarget.classList.toggle("on"); e.currentTarget.textContent = on ? "Licht aus" : "Licht an"; toast("Carport-Spots " + (on ? "an" : "aus") + " · WLED Preset " + (on ? 11 : 1) + " (Demo)"); });
  camFade.addEventListener("click", endMotion);
  const MDEMO = {
    auto: { ziel: "Fahrzeug", name: "Kleinwagen", richtung: "einfahrt", fahrzeug: "Kombi", fahrt: "Fahrt 17:05–18:42 (1 h 37 min)", farbe: "#3d5f94" },
    fremd: { ziel: "Fahrzeug", kennzeichen: "XY ··· 12", fahrzeug: "weißer Transporter", farbe: "#ebebe7" },
    paket: { ziel: "Person", lieferdienst: "DHL", fahrzeug: "gelbe Jacke, Paket" },
  };
  $$("[data-motiontest]").forEach((b) => b.addEventListener("click", () => setTimeout(() => motion(MDEMO[b.dataset.motiontest]), 600)));
  window.GH_MOTION = motion; window.GH_MOTION_END = endMotion; window.GH_MDEMO = MDEMO;
  /* Display wach halten (Wake Lock), sobald einmal getippt wurde */
  let lock = null;
  const wl = $("[data-wl]");
  async function keepAwake() {
    if (!("wakeLock" in navigator)) { if (wl) wl.textContent = "Display-Wachhalten wird hier nicht unterstützt."; return; }
    try { lock = await navigator.wakeLock.request("screen"); if (wl) wl.textContent = "Display bleibt wach."; lock.addEventListener("release", () => { lock = null; }); }
    catch (e) { if (wl) wl.textContent = "Display-Wachhalten wurde abgelehnt."; }
  }
  addEventListener("pointerdown", () => { if (!lock) keepAwake(); }, { once: true });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !lock && navigator.userActivation?.hasBeenActive) keepAwake(); });
}

/* Uhr und Begrüßung */
function clock() {
  const n = new Date(), h = n.getHours();
  $$("[data-clock]").forEach((e) => (e.textContent = n.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })));
  $$("[data-date]").forEach((e) => (e.textContent = n.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })));
  $$("[data-greet]").forEach((e) => (e.textContent = (h < 5 ? "Gute Nacht" : h < 11 ? "Guten Morgen" : h < 17 ? "Guten Tag" : h < 22 ? "Guten Abend" : "Gute Nacht") + ","));
}
clock(); setInterval(clock, 15000);

/* Energie-Modell: Oktobertag, SMA STP + BYD HVS 7,7 kWh, 5-Minuten-Schritte (Demo) */
const D = (function () {
  const out = []; let soc = 34, gen = 0, use = 0, imp = 0, exp = 0;
  for (let i = 0; i < 288; i++) {
    const h = i / 12;
    const pv = h > 7.9 && h < 18.3 ? 3.8 * Math.pow(Math.sin(Math.PI * (h - 7.9) / 10.4), 1.3) * (0.86 + 0.14 * Math.sin(h * 3.1)) : 0;
    const g = (c, w, a) => a * Math.exp(-((h - c) ** 2) / (2 * w * w));
    const home = 0.34 + g(7, 0.6, 0.9) + g(12.3, 0.6, 1.3) + g(18.8, 1, 1.0) + g(20.3, 0.5, 0.7) + 0.05 * Math.sin(h * 7);
    const net = pv - home; let ch = 0, dis = 0, ex = 0, im = 0;
    if (net > 0) { ch = Math.min(net, 2.5, Math.max(0, (100 - soc) / 100 * 7.7 * 12)); ex = net - ch; }
    else { dis = Math.min(-net, 2.5, Math.max(0, (soc - 8) / 100 * 7.7 * 12)); im = -net - dis; }
    soc += (ch * 0.95 - dis) / 12 / 7.7 * 100; gen += pv / 12; use += home / 12; imp += im / 12; exp += ex / 12;
    out.push({ i, pv, home, batt: ch - dis, grid: ex - im, soc, gen, use, imp, exp });
  }
  return out;
})();
const nowIdx = () => { const n = new Date(); return Math.min(287, Math.floor((n.getHours() * 60 + n.getMinutes()) / 5)); };
const hhmm = (i) => String(Math.floor(i / 12)).padStart(2, "0") + ":" + String((i % 12) * 5).padStart(2, "0");

/* Jahresmodell: Demo-Tageswerte für ~9,9 kWp und BYD 7,7 kWh */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const YEAR = (function () {
  const today = new Date(), endMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const r = rng(21), Y = { endMs, PV: [], USE: [], AUT: [], EXP: [], IMP: [] };
  let cloud = 0.5;
  for (let i = 0; i < 371; i++) {
    const ms = endMs - (370 - i) * 864e5, d = new Date(ms), date = d.toISOString().slice(0, 10);
    const doy = (ms - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5, s = (1 - Math.cos(2 * Math.PI * (doy - 172) / 365)) / 2;
    cloud = cloud * 0.55 + r() * 0.45;
    const w = Math.min(1, Math.max(0.05, 1.12 - cloud * 1.15));
    const pv = Math.max(0, (64 - 54 * s) * w * (0.94 + 0.12 * r()));
    const we = [0, 6].includes(d.getUTCDay());
    const use = 10.2 + 6.5 * s + (we ? 2.4 : 0) + (r() - 0.5) * 3 + (r() < 0.04 ? 6 : 0);
    const direct = Math.min(use * 0.46, pv * 0.72), batt = Math.min(7.3, Math.max(0, pv - direct)) * 0.92;
    const self = Math.min(use, direct + Math.min(batt, use - direct));
    const exp = Math.max(0, pv - direct - Math.min(7.3, Math.max(0, pv - direct)));
    Y.PV.push({ date, value: +pv.toFixed(1) }); Y.USE.push({ date, value: +use.toFixed(1) });
    Y.AUT.push({ date, value: Math.round(100 * self / use) });
    Y.EXP.push({ date, value: +exp.toFixed(1) }); Y.IMP.push({ date, value: +(use - self).toFixed(1) });
  }
  return Y;
})();
const PAL = {
  sun: { light: ["#f1d9a6", "#e3ad55", "#c47f1a", "#83500c"], dark: ["#4a3210", "#8a5a17", "#d9952f", "#ffcf7a"] },
  blue: { light: ["#cddcea", "#8eb3d6", "#4a82ba", "#1f4d7e"], dark: ["#14304a", "#245785", "#4d8fd0", "#9ccaf5"] },
  green: { light: ["#d3e6d5", "#97c79f", "#4d975e", "#245f39"], dark: ["#173a24", "#2b6a40", "#4fae6c", "#9be0ae"] },
  violet: { light: ["#dcdaf3", "#aaa4e4", "#6d64c8", "#3b3487"], dark: ["#26234d", "#433d8c", "#7c74dd", "#bdb8fb"] },
};

/* Gemeinsame Klicks */
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-soon]")) { e.preventDefault(); toast("Diese Ansicht folgt als eigenes Artefakt"); return; }
  const cp = e.target.closest("[data-copy]");
  if (cp) {
    const pre = $(cp.dataset.copy), lb = cp.querySelector("span");
    navigator.clipboard.writeText(pre.textContent).then(() => (lb.textContent = "Kopiert"), () => {
      const r = document.createRange(); r.selectNodeContents(pre); const g = getSelection(); g.removeAllRanges(); g.addRange(r); lb.textContent = "Markiert, ⌘C drücken";
    });
    setTimeout(() => (lb.textContent = "CSS kopieren"), 2400);
  }
});

/* ================= Grundrisse (erfundenes Beispielhaus, Maße in Metern) ================= */
const W0=12,D0=10.4,T38=Math.tan(38*Math.PI/180);
const R=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
const UNIT={H:{n:'Familie',c:'--home'},O:{n:'Opa',c:'--grid'},S:{n:'Gemeinsam',c:'--fg'},X:{n:'Draußen',c:'--ok'}};
const PLAN=[
 {k:'UG',n:'Untergeschoss',z:0,box:[0,0,13,11.25],
  foot:R(0,0,13,11.25),
  rooms:[
   {id:'heizung',n:'Heizung',a:10.5,u:'S',p:R(0,0,3.5,3)},
   {id:'keller1',n:'Keller 1',a:10.5,u:'S',p:R(3.5,0,7,3)},
   {id:'waschen',n:'Waschen',a:9,u:'S',p:R(7,0,10,3)},
   {id:'abst',n:'Abstellraum',a:9,u:'S',p:R(10,0,13,3)},
   {id:'keller2',n:'Keller 2',a:15,u:'S',p:R(0,3,6,5.5)},
   {id:'flur_ug',n:'Flur',a:10,u:'S',p:R(6,3,10,5.5)},
   {id:'wc_ug',n:'WC',a:7.5,u:'S',p:R(10,3,13,5.5)},
   {id:'garage',n:'Doppelgarage',a:34.5,u:'S',p:R(0,5.5,6,11.25)},
   {id:'tr_ug',n:'Treppe',u:'S',stair:1,p:R(6,5.5,7.2,8.5)},
   {id:'mzr',n:'Mehrzweckraum',a:33,u:'S',p:[[7.2,5.5],[13,5.5],[13,11.25],[6,11.25],[6,8.5],[7.2,8.5]]},
   {id:'carport',n:'Carport',a:20,u:'X',p:R(-3.8,5.8,-.2,11.8)},
   {id:'terr_ug',n:'Terrasse',u:'X',p:R(9,11.25,13,13)}]},
 {k:'EG',n:'Erdgeschoss',z:2.7,box:[0,0,13,11.25],
  foot:R(0,0,13,11.25),
  rooms:[
   {id:'wohnen_h',n:'Wohnen + Essen',a:33.8,u:'H',p:R(0,0,6.5,5.2)},
   {id:'kochen_h',n:'Küche',a:13.2,u:'H',p:R(0,5.2,4,8.5)},
   {id:'diele_h',n:'Diele',a:16.2,u:'H',p:[[4,5.2],[6.2,5.2],[6.2,11.25],[2.2,11.25],[2.2,8.5],[4,8.5]]},
   {id:'wc_h',n:'WC',a:6,u:'H',p:R(0,8.5,2.2,11.25)},
   {id:'tr_h',n:'Treppe',u:'H',stair:1,p:R(6.2,5.2,7.3,8.6)},
   {id:'wf',n:'Windfang',a:4.8,u:'S',p:R(6.2,8.6,8,11.25)},
   {id:'tr_o',n:'Treppe',u:'O',stair:1,p:R(7.3,5.2,8.4,8.6)},
   {id:'wohnen_o',n:'Wohnen',a:18.2,u:'O',p:R(6.5,0,10,5.2)},
   {id:'diele_o',n:'Diele',a:11.3,u:'O',p:[[8.4,5.2],[10,5.2],[10,11.25],[8,11.25],[8,8.6],[8.4,8.6]]},
   {id:'kochen_o',n:'Küche',a:10.8,u:'O',p:R(10,0,13,3.6)},
   {id:'bad_o',n:'Bad',a:8.4,u:'O',p:R(10,3.6,13,6.4)},
   {id:'schlafen_o',n:'Schlafen',a:14.6,u:'O',p:R(10,6.4,13,11.25)},
   {id:'terr_h',n:'Terrasse',u:'X',p:R(.5,-2.2,4.6,0)},
   {id:'terr_m',n:'Terrasse Mitte (Markise)',u:'X',p:R(4.6,-2.6,8.4,0)},
   {id:'terr_o',n:'Terrasse',u:'X',p:R(8.4,-2.2,12.5,0)},
   {id:'eingang',n:'Eingang',u:'X',p:R(6.2,11.25,8,12.6)}]},
 {k:'DG',n:'Dachgeschoss',z:5.4,box:[0,0,13,11.25],
  foot:R(0,0,13,11.25),
  rooms:[
   {id:'buero',n:'Büro',a:14.4,u:'H',p:R(0,0,4,3.6)},
   {id:'schlafen_h',n:'Schlafen',a:12.6,u:'H',p:R(4,0,7.5,3.6)},
   {id:'balk_nw',n:'Balkon',a:3.5,u:'X',p:R(-1.4,.5,0,3)},
   {id:'leo',n:'Leo',a:15.2,u:'H',p:R(0,3.6,4,7.4)},
   {id:'mia',n:'Mia',a:15.4,u:'H',p:R(0,7.4,4,11.25)},
   {id:'flur_dg',n:'Flur',a:8.6,u:'H',p:R(4,3.6,5.6,9)},
   {id:'bad_h',n:'Bad',a:5.6,u:'H',p:R(4,9,6.5,11.25)},
   {id:'tr_h2',n:'Treppe',u:'H',stair:1,p:R(5.6,5.2,6.6,8.6)},
   {id:'tr_o2',n:'Treppe',u:'O',stair:1,p:R(6.8,5.2,7.8,8.6)},
   {id:'kind1_o',n:'Gästezimmer',a:19.8,u:'O',p:R(7.5,0,13,3.6)},
   {id:'flur_o',n:'Flur',a:9.2,u:'O',p:R(7.8,3.6,9.5,9)},
   {id:'bad_o2',n:'Bad',a:9.8,u:'O',p:R(9.5,3.6,13,6.4)},
   {id:'kind2_o',n:'Arbeitszimmer',a:17,u:'O',p:R(9.5,6.4,13,11.25)},
   {id:'balk_no',n:'Balkon',a:5.6,u:'X',p:R(13,2,14.4,6)},
   {id:'balk_o',n:'Balkon',a:4.2,u:'X',p:R(13,7,14.4,10)}]},
 {k:'Bühne',n:'Dachboden (Bühne)',z:8.1,box:[0,0,13,11.25],attic:1,
  foot:R(.3,3,12.7,8.3),
  rooms:[
   {id:'buehne',n:'Bühne · Heizung',u:'S',p:R(.4,3.1,12.6,8.2)}]}];
PLAN.forEach((f,i)=>{f.i=i;const[x0,y0,x1,y1]=f.box,m=([x,y])=>[(x-x0)/(x1-x0)*W0,(y-y0)/(y1-y0)*D0];
  f.foot=f.foot.map(m);f.m=m;f.rooms.forEach(r=>{r.f=i;r.p=r.p.map(m);r.c=r.p.reduce((s,q)=>[s[0]+q[0]/r.p.length,s[1]+q[1]/r.p.length],[0,0])})});
const ROOMS=Object.fromEntries(PLAN.flatMap(f=>f.rooms.map(r=>[r.id,r])));

/* Müllabfuhr: Beispiel-Abfuhrkalender 2026 (regelmäßiges Muster, MMTT). Eigene Termine hier eintragen,
   z. B. aus der CSV des örtlichen Abfallkalenders; live z. B. aus 0_userdata.0.Muell.termine. */
const MUELL_Y = 2026, MUELL_RAW = {
  rest: '0106 0120 0203 0217 0303 0317 0331 0414 0428 0512 0526 0609 0623 0707 0721 0804 0818 0901 0915 0929 1013 1027 1110 1124 1208 1222',
  bio: '0109 0123 0206 0220 0306 0320 0403 0417 0501 0508 0515 0522 0529 0605 0612 0619 0626 0703 0710 0717 0724 0731 0807 0814 0821 0828 0904 0911 0918 0925 1002 1016 1030 1113 1127 1211 1225',
  gelb: '0113 0127 0210 0224 0310 0324 0407 0421 0505 0519 0602 0616 0630 0714 0728 0811 0825 0908 0922 1006 1020 1103 1117 1201 1215 1229',
  papier: '0116 0213 0313 0410 0508 0605 0703 0731 0828 0925 1023 1120 1218',
  psm: '0418 1010'
};
const TONNEN = [
  { k: 'rest', n: 'Restmüll', der: 'der Restmüll', kurz: 'Rest', c: 'var(--bin-rest)', takt: 'alle 14 Tage' },
  { k: 'bio', n: 'Biotonne', der: 'die Biotonne', kurz: 'Bio', c: 'var(--bin-bio)', takt: 'alle 14 Tage, im Sommer wöchentlich' },
  { k: 'gelb', n: 'Gelber Sack', der: 'der Gelbe Sack', kurz: 'Gelb', c: 'var(--bin-gelb)', sack: 1, takt: 'alle 14 Tage' },
  { k: 'papier', n: 'Papier', der: 'das Papier', kurz: 'Papier', c: 'var(--bin-papier)', takt: 'alle 4 Wochen' }];
const MUELL = Object.fromEntries(Object.entries(MUELL_RAW).map(([k, s]) => [k, s.split(' ').map((t) => new Date(MUELL_Y, +t.slice(0, 2) - 1, +t.slice(2), 12))]));
const tag12 = (d) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };
const tageBis = (d) => Math.round((tag12(d) - tag12(new Date())) / 864e5);
const WTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const fmtTag = (d) => WTAG[d.getDay()] + ' ' + String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.';
const inTagen = (n) => n === 0 ? 'heute' : n === 1 ? 'morgen' : n === 2 ? 'übermorgen' : 'in ' + n + ' Tagen';
/* Ab 12 Uhr am Abfuhrtag gilt die Tonne als geleert, dann zählt der nächste Termin */
function muellAb() { const n = new Date(), d = tag12(n); if (n.getHours() >= 12) d.setDate(d.getDate() + 1); return d; }
const muellNext = (k, ab = muellAb()) => MUELL[k].find((d) => d >= tag12(ab)) || null;
const muellAm = (d) => TONNEN.filter((t) => MUELL[t.k].some((x) => +x === +tag12(d)));
function tonneSvg(t) {
  return t.sack
    ? '<svg class="tonne" viewBox="0 0 40 46" aria-hidden="true"><path class="lid" d="M15 9 20 13 25 9 23 6 20 8 17 6Z"/><path class="body" d="M14 12Q20 9 26 12L33 38Q34 44 20 44 6 44 7 38Z"/><path class="line" d="M14 22Q20 25 27 21M11 32Q20 36 30 31"/></svg>'
    : '<svg class="tonne" viewBox="0 0 40 46" aria-hidden="true"><rect class="lid" x="4" y="4" width="32" height="6" rx="2"/><rect class="lid" x="15" y="1.5" width="10" height="3" rx="1.5"/><path class="body" d="M6 11H34L31.5 41H8.5Z"/><path class="line" d="M15 16 15.6 36M20 16V36M25 16 24.4 36"/><circle class="wheel" cx="11" cy="42" r="3.4"/></svg>';
}
