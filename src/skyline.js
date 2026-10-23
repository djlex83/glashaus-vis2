/* Glashaus · Jahres-Skyline (Vanilla-Port von „Contribution Skyline“)
 * Ein Jahr Tageswerte als Heatmap, die sich zur isometrischen Skyline aufrichtet.
 * Ein Canvas, eine Kamera: 2D ist das Raster von oben, 3D dasselbe Raster von der Ecke.
 * Hover/Tippen zeigt den Tag, Pfeiltasten laufen durchs Raster, in 3D ziehen = drehen,
 * Doppelklick setzt zurück. Datensatzwechsel lässt die Säulen auf ihre neue Höhe gleiten. */
(function () {
"use strict";
const DAY = 86400000;
const clamp01 = (v) => (v > 0 ? (v < 1 ? v : 1) : 0);
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (x) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const toKey = (ms) => new Date(ms).toISOString().slice(0, 10);
const dayMs = (v) => {
  if (typeof v === "number") return Math.floor(v / DAY) * DAY;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(v); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};
const WAVE = 0.42;
const riseAt = (t, week, weeks, day) => easeOut((t - ((weeks > 1 ? week / (weeks - 1) : 0) * 0.36 + (day / 6) * 0.06)) / (1 - WAVE));
const YAW3 = Math.PI / 4, ELEV3 = (34 * Math.PI) / 180;
const YAWR = [(8 * Math.PI) / 180, (82 * Math.PI) / 180], ELEVR = [(18 * Math.PI) / 180, (62 * Math.PI) / 180];
const camera = (e, dY = 0, dE = 0) => {
  const yaw = Math.min(YAWR[1], Math.max(0, lerp(0, YAW3 + dY, e)));
  const elev = lerp(Math.PI / 2, Math.min(ELEVR[1], Math.max(ELEVR[0], ELEV3 + dE)), e);
  return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) };
};
const project = (c, x, y, z) => [x * c.cs - y * c.sn, (x * c.sn + y * c.cs) * c.se - z * c.ce];
const mixRGB = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const lum = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const barHeight = (v, max, s = 1) => (v > 0 && max > 0 ? 0.4 + Math.pow(v / max, 0.85) * 7.2 * s : 0.2);
const levelOf = (v, busy) => (v <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((v / busy) * 4)));
const rgbS = (r, g, b) => "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";

let probe = null;
const toRGB = (color, fb) => {
  if (!probe) { const c = document.createElement("canvas"); c.width = c.height = 1; probe = c.getContext("2d", { willReadFrequently: true }); }
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = "rgba(0,0,0,0)"; probe.fillStyle = color; probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return d[3] < 8 ? fb : [d[0], d[1], d[2]];
};
const inQuad = (p, o, x, y) => {
  let sign = 0;
  for (let k = 0; k < 4; k++) {
    const ax = p[o + k * 2], ay = p[o + k * 2 + 1], bx = p[o + ((k + 1) % 4) * 2], by = p[o + ((k + 1) % 4) * 2 + 1];
    const cr = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (Math.abs(cr) < 1e-9) continue;
    const s = cr > 0 ? 1 : -1;
    if (sign === 0) sign = s; else if (s !== sign) return false;
  }
  return sign !== 0;
};
const quadPath = (ctx, p, o, r) => {
  if (r < 0.3) { ctx.moveTo(p[o], p[o + 1]); ctx.lineTo(p[o + 2], p[o + 3]); ctx.lineTo(p[o + 4], p[o + 5]); ctx.lineTo(p[o + 6], p[o + 7]); ctx.closePath(); return; }
  ctx.moveTo((p[o + 6] + p[o]) / 2, (p[o + 7] + p[o + 1]) / 2);
  for (let k = 0; k < 4; k++) { const b = (k + 1) % 4; ctx.arcTo(p[o + k * 2], p[o + k * 2 + 1], p[o + b * 2], p[o + b * 2 + 1], r); }
  ctx.closePath();
};

function buildGrid(data, endMs, weekStart, test) {
  const vals = new Map();
  for (const d of data) vals.set(toKey(dayMs(d.date)), (vals.get(toKey(dayMs(d.date))) || 0) + (+d.value || 0));
  let start = endMs - 364 * DAY;
  start -= ((new Date(start).getUTCDay() - weekStart + 7) % 7) * DAY;
  const cells = [];
  for (let ms = start, i = 0; ms <= endMs; ms += DAY, i++) { const date = toKey(ms); cells.push({ date, v: vals.get(date) || 0, level: 0, week: Math.floor(i / 7), day: i % 7 }); }
  const nz = cells.map((c) => c.v).filter((v) => v > 0).sort((a, b) => a - b);
  const busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0;
  for (const c of cells) c.level = levelOf(c.v, busy);
  // Statistik
  let total = 0, best = 0, bestDate = null, run = 0, runStart = null, longest = { days: 0, start: null, end: null };
  for (const c of cells) {
    total += c.v;
    if (c.v > best) { best = c.v; bestDate = c.date; }
    if (test(c.v)) { if (run === 0) runStart = c.date; run++; if (run > longest.days) longest = { days: run, start: runStart, end: c.date }; } else run = 0;
  }
  let j = cells.length - 1;
  if (j >= 0 && !test(cells[j].v)) j--;
  const endAt = j;
  while (j >= 0 && test(cells[j].v)) j--;
  const cd = endAt - j;
  const current = cd > 0 ? { days: cd, start: cells[j + 1].date, end: cells[endAt].date } : { days: 0, start: null, end: null };
  return { cells, weeks: cells.length ? cells[cells.length - 1].week + 1 : 0, max: nz.length ? nz[nz.length - 1] : 0,
    stats: { total, first: cells[0] && cells[0].date, last: cells.length ? cells[cells.length - 1].date : null, best, bestDate, longest, current } };
}

function monthLabels(cells, weeks, locale) {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
  const out = []; let prev = -1, multi = weeks > 60;
  for (let w = 0; w < weeks; w++) {
    const c = cells[w * 7]; if (!c) break;
    const m = +c.date.slice(5, 7);
    /* über mehrere Jahre: nur Quartale, Januar als Jahreszahl */
    if (m !== prev && (!multi || m % 3 === 1)) out.push({ week: w, label: multi && m === 1 ? c.date.slice(0, 4) : fmt.format(dayMs(c.date)).replace(".", "") });
    prev = m;
  }
  if (out.length > 1 && out[1].week - out[0].week < 3) out.shift();
  return out;
}

const ICON_GRID = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="currentColor"/><rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="currentColor"/></svg>';
const ICON_CUBE = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.2 14.2 4.6v6.8L8 14.8 1.8 11.4V4.6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M1.8 4.6 8 8l6.2-3.4M8 8v6.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

/* opts: endMs, years (Anzahl Jahre als parallele Streifen, Standard 1), locale, weekStart, datasets: [{key,label,title,unit,decimals,palette:{light,dark},data:[{date,value}],
 *        streakLabel, streakTest(v), totalLabel, totalIsMean}] */
window.GlasSkyline = function mount(root, opts) {
  const locale = opts.locale || "de-DE", weekStart = opts.weekStart ?? 1, duration = opts.duration || 1400;
  const nfFor = (d) => new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const df = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const dfy = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const dfl = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  root.classList.add("sk");
  root.innerHTML =
    '<header class="sk-head"><h2 class="sk-title"></h2><div class="sk-ctl">' +
    '<div class="sk-tabs" role="group" aria-label="Datensatz">' + opts.datasets.map((d, i) => '<button type="button" data-i="' + i + '">' + d.label + "</button>").join("") + "</div>" +
    '<div class="sk-toggle" role="group" aria-label="Ansicht"><span class="sk-knob" aria-hidden="true"></span>' +
    '<button type="button" data-v="2d" aria-label="Flache Heatmap" title="Flache Heatmap">' + ICON_GRID + "</button>" +
    '<button type="button" data-v="3d" aria-label="3D-Skyline" title="3D-Skyline">' + ICON_CUBE + "</button></div></div></header>" +
    '<div class="sk-cmp" aria-live="polite"></div><div class="sk-frame"><div class="sk-pad"><div class="sk-stage"><canvas tabindex="0" role="img"></canvas>' +
    '<div class="sk-corner sk-tr"></div><div class="sk-corner sk-bl"></div></div>' +
    '<div class="sk-tip" role="tooltip" aria-hidden="true"><span></span><i></i></div></div>' +
    '<div class="sk-rowwrap"><div class="sk-row"></div></div>' +
    '<div class="sk-foot"><span class="sk-hint"></span><div class="sk-legend"><span>Weniger</span>' +
    [0, 1, 2, 3, 4].map((i) => '<button type="button" data-l="' + i + '"></button>').join("") + "<span>Mehr</span></div></div></div>" +
    '<p class="sk-sr" aria-live="polite"></p>';
  const $ = (s) => root.querySelector(s);
  const stage = $(".sk-stage"), canvas = $("canvas"), tip = $(".sk-tip"), ctx = canvas.getContext("2d");
  const cmpEl = $(".sk-cmp"), titleEl = $(".sk-title"), trEl = $(".sk-tr"), blEl = $(".sk-bl"), rowEl = $(".sk-row"), rowWrap = $(".sk-rowwrap");
  const hintEl = $(".sk-hint"), sr = $(".sk-sr"), swatches = [...root.querySelectorAll(".sk-legend button")];

  let dsi = 0, ds = opts.datasets[0], model = null, view = opts.defaultView || "3d", legendLevel = -1, accent = "#000";
  const reduceMq = matchMedia("(prefers-reduced-motion: reduce)"), darkMq = matchMedia("(prefers-color-scheme: dark)");
  let reduced = reduceMq.matches;
  let t = 0, target = 0, entered = false, yaw = 0, elev = 0, yawGoal = 0, elevGoal = 0;
  let W = 0, H2 = 0, H3 = 0, Hmax = 0, lastH = -1, dpr = 1, gutter = 30, labelW = 30, font = "10px sans-serif";
  const col = new Float32Array(15), colGoal = new Float32Array(15);
  let colReady = false, fg = [23, 23, 23], bg = [255, 255, 255], isDark = false;
  let n = 0, weeks = 0, wk, dy, lv, hgt, hFrom, hTo, zs, hover, dim, polys, faces, order = [];
  let blend = 1, months = [], weekdayRows = [];
  let hovered = -1, pinned = -1, activeIdx = -1, raf = 0, last = 0;

  const fmtV = (v) => nfFor(ds.decimals ?? 0).format(v) + " " + ds.unit;
  const range = (a, b, y) => (!a || !b ? "–" : (y ? dfy : df).format(dayMs(a)) + " – " + (y ? dfy : df).format(dayMs(b)));
  const describe = (i) => { const c = model.cells[i]; return c ? (c.v ? fmtV(c.v) : "Kein Wert") + " am " + dfl.format(dayMs(c.date)) : ""; };

  function computeModel() {
    /* mehrere Jahre: je 12 Monate (52 Wochen versetzt, damit Wochen und Monate übereinanderliegen) als eigener Streifen,
       das jüngste vorn; Statistik oben bleibt beim jüngsten Jahr, Stufen und Höhen gelten für alle gemeinsam */
    const N = Math.max(1, opts.years || 1), gs = [];
    for (let k = 0; k < N; k++) gs.push(buildGrid(ds.data, opts.endMs - k * 364 * DAY, weekStart, ds.streakTest));
    const g = gs[0];
    g.months = monthLabels(g.cells, g.weeks, locale);
    g.N = N; g.rows = N * 8 - 1;
    g.strips = gs.map((x, k) => ({ y: (N - 1 - k) * 8, total: x.stats.total, days: x.cells.length, first: x.stats.first, last: x.stats.last,
      label: x.stats.first && x.stats.last ? x.stats.first.slice(2, 4) + "/" + x.stats.last.slice(2, 4) : "" }));
    if (N > 1) {
      const all = gs.flatMap((x, k) => x.cells.map((c) => Object.assign({}, c, { day: c.day + (N - 1 - k) * 8 })));
      const nz = all.map((c) => c.v).filter((v) => v > 0).sort((a, b) => a - b), busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0;
      for (const c of all) c.level = levelOf(c.v, busy);
      g.cells = all; g.max = nz.length ? nz[nz.length - 1] : 0;
    }
    return g;
  }

  function statBlocks() {
    const s = model.stats, nf = nfFor(ds.decimals ?? 0), nf0 = nfFor(0);
    const days = model.cells.length;
    const tot = ds.totalIsMean ? s.total / Math.max(1, days) : s.total;
    return [
      { label: ds.totalLabel, value: nf0.format(tot), unit: ds.totalUnit || ds.unit, sub: range(s.first, s.last, true) },
      { label: "Bester Tag", value: nf.format(s.best), unit: ds.unit, sub: s.bestDate ? df.format(dayMs(s.bestDate)) : "–" },
      { label: "Längste Serie", value: nf0.format(s.longest.days), unit: s.longest.days === 1 ? "Tag" : "Tage", sub: ds.streakLabel + " · " + range(s.longest.start, s.longest.end) },
      { label: "Aktuelle Serie", value: nf0.format(s.current.days), unit: s.current.days === 1 ? "Tag" : "Tage", sub: range(s.current.start, s.current.end) },
    ];
  }
  const statHTML = (b, cls) => '<div class="sk-stat ' + cls + '"><div class="sk-l">' + b.label + '</div><div class="sk-vv"><b>' + b.value +
    '</b><span><em>' + b.unit + "</em><small>" + b.sub + "</small></span></div></div>";

  function renderText() {
    const b = statBlocks();
    if (model.N > 1) {
      const nf0 = nfFor(0), val = (x) => (ds.totalIsMean ? x.total / Math.max(1, x.days) : x.total);
      cmpEl.innerHTML = model.strips.map((x, k) => { const v = val(x), p = model.strips[k + 1], pv = p ? val(p) : 0, d = p && pv ? Math.round((v / pv - 1) * 100) : null;
        return '<span><b>' + x.label + "</b> " + nf0.format(v) + " " + (ds.totalUnit || ds.unit) + (d !== null ? ' <em class="' + (d >= 0 ? "up" : "dn") + '">' + (d > 0 ? "+" : d < 0 ? "−" : "±") + Math.abs(d) + " %</em>" : "") + "</span>"; }).join("");
      cmpEl.hidden = false;
    } else { cmpEl.innerHTML = ""; cmpEl.hidden = true; }
    titleEl.innerHTML = ds.title(model.stats, nfFor(0));
    trEl.innerHTML = statHTML(b[0], "end") + statHTML(b[1], "end");
    blEl.innerHTML = statHTML(b[2], "start") + statHTML(b[3], "start");
    rowEl.innerHTML = '<div class="sk-row-in">' + b.map((x) => statHTML(x, "stack")).join("") + "</div>";
    canvas.setAttribute("aria-label", ds.label + ": " + b[0].value + " " + b[0].unit + ", " + range(model.stats.first, model.stats.last, true) +
      ", als " + (view === "3d" ? "3D-Skyline" : "Heatmap") + ". Pfeiltasten lesen einzelne Tage.");
    root.querySelectorAll(".sk-tabs button").forEach((x, i) => x.setAttribute("aria-pressed", i === dsi));
    root.querySelectorAll(".sk-toggle button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === view));
    root.dataset.view = view;
    const names = ["Keine Werte", "Wenig", "Mittel", "Viel", "Am meisten"];
    swatches.forEach((s, i) => { s.title = names[i]; s.setAttribute("aria-label", names[i] + " hervorheben"); s.setAttribute("aria-pressed", legendLevel === i); });
    hintEl.textContent = view === "3d" ? "Ziehen zum Drehen · Doppelklick setzt zurück" : "Tag antippen für Details · Pfeiltasten zum Erkunden";
    layoutStats();
  }
  function layoutStats() {
    const corners = W >= 560;
    root.dataset.corners = corners && view === "3d" ? "1" : "0";
    rowWrap.dataset.show = !(view === "3d" && corners) ? "1" : "0";
  }

  function load(animate) {
    model = computeModel();
    const prevN = n;
    n = model.cells.length; weeks = model.weeks;
    if (!wk || wk.length !== n) {
      wk = new Float32Array(n); dy = new Float32Array(n); lv = new Uint8Array(n); hgt = new Float32Array(n);
      hFrom = new Float32Array(n); hTo = new Float32Array(n); zs = new Float32Array(n); hover = new Float32Array(n);
      dim = new Float32Array(n); polys = new Float32Array(n * 24); faces = new Uint8Array(n); order = Array.from({ length: n }, (_, i) => i);
    }
    for (let i = 0; i < n; i++) {
      const c = model.cells[i];
      wk[i] = c.week; dy[i] = c.day; lv[i] = c.level;
      const hs = model.N > 1 ? 0.7 : 1;
      hFrom[i] = animate && prevN === n ? hgt[i] : barHeight(c.v, model.max, hs);
      hTo[i] = barHeight(c.v, model.max, hs);
      if (!animate || prevN !== n) hgt[i] = hTo[i];
    }
    blend = animate && prevN === n && !reduced ? 0 : 1;
    months = model.months;
    const wf = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    weekdayRows = [];
    if (model.N === 1) for (let d = 0; d < 7 && d < n; d++) {
      const dow = new Date(dayMs(model.cells[d].date)).getUTCDay();
      if (dow === 1 || dow === 3 || dow === 5) weekdayRows.push({ day: d, label: wf.format(dayMs(model.cells[d].date)).replace(".", "") });
    }
    renderText();
  }

  function retheme() {
    const cs = getComputedStyle(document.documentElement);
    fg = toRGB(cs.getPropertyValue("--fg").trim() || cs.color, [23, 23, 23]);
    bg = toRGB(cs.getPropertyValue("--bg").trim(), null) || (lum(fg) > 0.5 ? [10, 10, 10] : [255, 255, 255]);
    isDark = lum(bg) < 0.45;
    font = "500 10.5px " + (getComputedStyle(root).fontFamily || "sans-serif");
    const pal = ds.palette[isDark ? "dark" : "light"];
    const empty = mixRGB(bg, fg, isDark ? 0.11 : 0.08);
    const all = [empty, ...pal.map((c) => toRGB(c, [23, 23, 23]))];
    for (let k = 0; k < 5; k++) for (let ch = 0; ch < 3; ch++) colGoal[k * 3 + ch] = all[k][ch];
    if (!colReady || reduced) { col.set(colGoal); colReady = true; }
    ctx.font = font;
    labelW = Math.ceil(Math.max(20, ...weekdayRows.map((r) => ctx.measureText(r.label).width), ...(model && model.N > 1 ? model.strips.map((x) => ctx.measureText(x.label).width) : []))) + 8;
    const sw = all.map((c) => rgbS(c[0], c[1], c[2]));
    swatches.forEach((s, i) => (s.style.background = sw[i]));
    accent = sw[4];
    root.style.setProperty("--sk-accent", accent);
    kick();
  }

  function extent(cam, e, full) {
    const w = lerp(0.78, 0.9, e), off = (1 - w) / 2;
    let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    const add = (x, y, z) => { const p = project(cam, x, y, z); if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0]; if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1]; };
    for (let i = 0; i < n; i++) {
      const x0 = wk[i] + off, y0 = dy[i] + off, z = full ? Math.max(hgt[i], hTo[i]) * e : zs[i];
      add(x0, y0, z); add(x0 + w, y0, z); add(x0, y0 + w, z); add(x0 + w, y0 + w, 0); add(x0, y0 + w, 0); add(x0 + w, y0, 0);
    }
    const R = (model && model.rows) || 7;
    add(0, R + 1.5 * e, 0); add(weeks, R + 1.5 * e, 0);
    if (model && model.N > 1) for (const st of model.strips) add(-3 * e, st.y + 3.5, 0);  // Platz für die Jahreszahl links
    return { minx, maxx, miny, maxy };
  }

  function relayout() {
    const w = Math.round(stage.clientWidth);
    if (!w || !n) return;
    W = w; gutter = W < 520 ? 0 : labelW; dpr = Math.min(2, devicePixelRatio || 1);
    const b2 = extent(camera(0), 0, true);
    H2 = 24 + ((b2.maxy - b2.miny) / (b2.maxx - b2.minx)) * (W - gutter - 4);
    const b3 = extent(camera(1), 1, true);
    const natural = ((b3.maxy - b3.miny) / (b3.maxx - b3.minx)) * (W - 40) + 40;
    H3 = Math.max(Math.min(natural, W * 0.72, 620), Math.min(natural, 240));
    Hmax = Math.ceil(Math.max(H2, H3));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(Hmax * dpr);
    canvas.style.width = W + "px"; canvas.style.height = Hmax + "px";
    lastH = -1; layoutStats(); draw();
  }

  function draw() {
    if (!W || !n) return;
    const e = easeIO(t), cam = camera(e, yaw, elev), Hc = lerp(H2, H3, e);
    if (Math.abs(Hc - lastH) > 0.2) { stage.style.height = Hc.toFixed(1) + "px"; lastH = Hc; }
    for (let i = 0; i < n; i++) zs[i] = riseAt(t, wk[i], weeks, dy[i]) * hgt[i];
    const b = extent(cam, e, false);
    const pad = lerp(2, 20, e), left = pad + gutter * (1 - e), top = pad + 20 * (1 - e);
    const aw = W - left - pad, ah = Hc - top - pad;
    const bw = Math.max(1e-6, b.maxx - b.minx), bh = Math.max(1e-6, b.maxy - b.miny);
    const s = Math.min(aw / bw, ah / bh);
    const ox = left + (aw - bw * s) / 2 - b.minx * s, oy = top + (ah - bh * s) / 2 - b.miny * s;
    const { cs, sn, se, ce } = cam;
    const px = (x, y) => ox + (x * cs - y * sn) * s;
    const py = (x, y, z) => oy + ((x * sn + y * cs) * se - z * ce) * s;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hmax);
    order.sort((a, c) => (wk[a] + 0.5) * sn + (dy[a] + 0.5) * cs - ((wk[c] + 0.5) * sn + (dy[c] + 0.5) * cs));
    const w = lerp(0.78, 0.9, e), off = (1 - w) / 2, radius = lerp(0.17, 0.03, e) * s, outline = (1 - e) * 0.07, lift = 0.7 * e;
    const ex = col[0], ey = col[1], ez = col[2];
    for (let k = 0; k < n; k++) {
      const i = order[k], x0 = wk[i] + off, y0 = dy[i] + off, x1 = x0 + w, y1 = y0 + w, z = zs[i] + hover[i] * lift, o = i * 24;
      polys[o] = px(x0, y0); polys[o + 1] = py(x0, y0, z); polys[o + 2] = px(x1, y0); polys[o + 3] = py(x1, y0, z);
      polys[o + 4] = px(x1, y1); polys[o + 5] = py(x1, y1, z); polys[o + 6] = px(x0, y1); polys[o + 7] = py(x0, y1, z);
      polys[o + 8] = px(x0, y1); polys[o + 9] = py(x0, y1, 0); polys[o + 10] = px(x1, y1); polys[o + 11] = py(x1, y1, 0);
      polys[o + 12] = polys[o + 4]; polys[o + 13] = polys[o + 5]; polys[o + 14] = polys[o + 6]; polys[o + 15] = polys[o + 7];
      polys[o + 16] = px(x1, y0); polys[o + 17] = py(x1, y0, 0); polys[o + 18] = polys[o + 10]; polys[o + 19] = polys[o + 11];
      polys[o + 20] = polys[o + 4]; polys[o + 21] = polys[o + 5]; polys[o + 22] = polys[o + 2]; polys[o + 23] = polys[o + 3];
      const tall = z * ce * s;
      let f = 0;
      if (tall > 0.35 && w * cs * s > 0.35) f |= 1;
      if (tall > 0.35 && w * sn * s > 0.35) f |= 2;
      faces[i] = f;
      const L = lv[i] * 3;
      let r = col[L], g = col[L + 1], bl = col[L + 2];
      const d = dim[i];
      if (d > 0.002) { r += (ex - r) * 0.72 * d; g += (ey - g) * 0.72 * d; bl += (ez - bl) * 0.72 * d; }
      const hv = hover[i];
      if (hv > 0.002) { const m = 0.16 * hv; r += (fg[0] - r) * m; g += (fg[1] - g) * m; bl += (fg[2] - bl) * m; }
      if (f & 1) { ctx.beginPath(); quadPath(ctx, polys, o + 8, 0); ctx.fillStyle = rgbS(r * 0.84, g * 0.84, bl * 0.84); ctx.fill(); }
      if (f & 2) { ctx.beginPath(); quadPath(ctx, polys, o + 16, 0); ctx.fillStyle = rgbS(r * 0.68, g * 0.68, bl * 0.68); ctx.fill(); }
      ctx.beginPath(); quadPath(ctx, polys, o, radius); ctx.fillStyle = rgbS(r, g, bl); ctx.fill();
      if (outline > 0.004) { ctx.strokeStyle = "rgba(" + fg[0] + "," + fg[1] + "," + fg[2] + "," + outline.toFixed(3) + ")"; ctx.lineWidth = 1; ctx.stroke(); }
      if (hv > 0.02) { ctx.strokeStyle = "rgba(" + fg[0] + "," + fg[1] + "," + fg[2] + "," + (0.85 * hv).toFixed(3) + ")"; ctx.lineWidth = 1.5; ctx.stroke(); }
    }
    const muted = mixRGB(bg, fg, 0.55), mc = (a) => "rgba(" + Math.round(muted[0]) + "," + Math.round(muted[1]) + "," + Math.round(muted[2]) + "," + a.toFixed(3) + ")";
    ctx.font = font;
    const a2 = 1 - smooth(0, 0.4, e), a3 = smooth(0.62, 1, e);
    if (a2 > 0.004) {
      ctx.fillStyle = mc(a2); ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      let edge = -Infinity;
      for (const m of months) { const x = px(m.week + off, -0.3), tw = ctx.measureText(m.label).width; if (x < edge || x + tw > W) continue; ctx.fillText(m.label, x, py(m.week + off, -0.3, 0) - 3); edge = x + tw + 6; }
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      if (gutter > 0) for (const r of weekdayRows) ctx.fillText(r.label, px(0, r.day + 0.5) - 6, py(0, r.day + 0.5, 0));
      if (model.N > 1 && gutter > 0) for (const st of model.strips) ctx.fillText(st.label, px(0, st.y + 3.5) - 6, py(0, st.y + 3.5, 0));
    }
    if (a3 > 0.004) {
      ctx.fillStyle = mc(a3); ctx.textAlign = "left"; ctx.textBaseline = "top";
      let edge = -Infinity;
      const R = model.rows || 7;
      for (const m of months) { const x = px(m.week + 0.5, R + 0.3), tw = ctx.measureText(m.label).width; if (x < edge || x + tw > W) continue; ctx.fillText(m.label, x, py(m.week + 0.5, R + 0.3, 0) + 2); edge = x + tw + 10; }
      if (model.N > 1) { ctx.textAlign = "right"; ctx.textBaseline = "middle"; for (const st of model.strips) ctx.fillText(st.label, px(-0.4, st.y + 3.5), py(-0.4, st.y + 3.5, 0)); }
    }
    if (activeIdx >= 0 && activeIdx < n) {
      const i = activeIdx, z = zs[i] + hover[i] * lift, tx = px(wk[i] + 0.5, dy[i] + 0.5);
      const ty = Math.min(py(wk[i] + off, dy[i] + off, z), py(wk[i] + off + w, dy[i] + off, z), py(wk[i] + off, dy[i] + off + w, z));
      const tw = tip.offsetWidth, half = tw / 2, cx = Math.min(W - half - 2, Math.max(half + 2, tx));
      tip.style.transform = "translate(" + (cx - half).toFixed(1) + "px," + (ty - 8).toFixed(1) + "px) translateY(-100%)";
      tip.style.setProperty("--arrow", (tx - cx + half).toFixed(1) + "px");
    }
  }

  function tick(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    let moving = false;
    if (t !== target) { const step = reduced ? 1 : (dt * 1000) / duration; t = target > t ? Math.min(target, t + step) : Math.max(target, t - step); moving = true; }
    if (blend < 1) {
      blend = Math.min(1, blend + dt / 0.75);
      const k = easeIO(blend);
      for (let i = 0; i < n; i++) hgt[i] = lerp(hFrom[i], hTo[i], k);
      moving = true;
      if (blend >= 1) relayout();
    }
    const ko = reduced ? 1 : 1 - Math.exp(-dt * 12);
    yaw += (yawGoal - yaw) * ko; elev += (elevGoal - elev) * ko;
    if (Math.abs(yawGoal - yaw) > 1e-4 || Math.abs(elevGoal - elev) > 1e-4) moving = true; else { yaw = yawGoal; elev = elevGoal; }
    const kc = reduced ? 1 : 1 - Math.exp(-dt * 7);
    for (let k = 0; k < 15; k++) { const d = colGoal[k] - col[k]; if (Math.abs(d) > 0.4) { col[k] += d * kc; moving = true; } else col[k] = colGoal[k]; }
    const kh = reduced ? 1 : 1 - Math.exp(-dt * 16), kd = reduced ? 1 : 1 - Math.exp(-dt * 10);
    for (let i = 0; i < n; i++) {
      const hg = i === activeIdx ? 1 : 0, dg = legendLevel >= 0 && lv[i] !== legendLevel ? 1 : 0, h = hover[i], d = dim[i];
      if (h !== hg) { hover[i] = Math.abs(hg - h) < 0.003 ? hg : h + (hg - h) * kh; moving = true; }
      if (d !== dg) { dim[i] = Math.abs(dg - d) < 0.003 ? dg : d + (dg - d) * kd; moving = true; }
    }
    draw();
    if (moving) raf = requestAnimationFrame(tick);
  }
  function kick() { if (raf) return; last = performance.now(); raf = requestAnimationFrame(tick); }

  function refreshActive() {
    const next = hovered >= 0 ? hovered : pinned;
    if (next === activeIdx) return;
    activeIdx = next;
    tip.style.opacity = next >= 0 ? "1" : "0";
    tip.setAttribute("aria-hidden", next < 0);
    if (next >= 0) {
      const c = model.cells[next];
      tip.querySelector("span").innerHTML = "<strong>" + (c.v ? fmtV(c.v) : "Kein Wert") + "</strong> am " + dfy.format(dayMs(c.date));
    }
    kick();
  }
  function hit(x, y) {
    for (let k = n - 1; k >= 0; k--) {
      const i = order[k], o = i * 24;
      if (inQuad(polys, o, x, y) || (faces[i] & 1 && inQuad(polys, o + 8, x, y)) || (faces[i] & 2 && inQuad(polys, o + 16, x, y))) return i;
    }
    return -1;
  }
  const local = (ev) => { const r = canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
  let drag = null;
  canvas.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    const can = target === 1;
    drag = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, yaw: yawGoal, elev: elevGoal, moved: false, orbit: can, mouse: ev.pointerType === "mouse" };
    if (can) try { canvas.setPointerCapture(ev.pointerId); } catch (e) {}
  });
  canvas.addEventListener("pointermove", (ev) => {
    if (drag && drag.orbit && ev.pointerId === drag.id) {
      const dx = ev.clientX - drag.x, dyy = ev.clientY - drag.y;
      if (drag.moved || Math.hypot(dx, dyy) > 4) {
        drag.moved = true;
        yawGoal = Math.min(YAWR[1] - YAW3, Math.max(YAWR[0] - YAW3, drag.yaw + dx * 0.006));
        if (drag.mouse) elevGoal = Math.min(ELEVR[1] - ELEV3, Math.max(ELEVR[0] - ELEV3, drag.elev + dyy * 0.004));
        canvas.style.cursor = "grabbing"; hovered = -1; refreshActive(); kick(); return;
      }
    }
    if (ev.pointerType !== "mouse") return;
    const [x, y] = local(ev), i = hit(x, y);
    if (i !== hovered) { hovered = i; refreshActive(); }
    canvas.style.cursor = target === 1 ? "grab" : i >= 0 ? "pointer" : "default";
  });
  canvas.addEventListener("pointerup", (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const moved = drag.moved; drag = null;
    if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId);
    canvas.style.cursor = target === 1 ? "grab" : "default";
    if (moved) return;
    const [x, y] = local(ev), i = hit(x, y);
    pinned = i === pinned ? -1 : i;
    if (ev.pointerType !== "mouse") hovered = -1;
    refreshActive();
  });
  canvas.addEventListener("pointercancel", () => (drag = null));
  canvas.addEventListener("pointerleave", () => { if (drag) return; hovered = -1; refreshActive(); });
  canvas.addEventListener("dblclick", () => { yawGoal = 0; elevGoal = 0; kick(); });
  canvas.addEventListener("keydown", (ev) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape"];
    if (!keys.includes(ev.key) || !n) return;
    ev.preventDefault();
    if (ev.key === "Escape") { pinned = -1; hovered = -1; refreshActive(); return; }
    let i = pinned >= 0 ? pinned : activeIdx >= 0 ? activeIdx : n - 1;
    if (pinned >= 0 || activeIdx >= 0) {
      if (ev.key === "ArrowLeft") i -= 7; if (ev.key === "ArrowRight") i += 7;
      if (ev.key === "ArrowUp") i -= 1; if (ev.key === "ArrowDown") i += 1;
      if (ev.key === "Home") i = 0; if (ev.key === "End") i = n - 1;
    }
    pinned = Math.max(0, Math.min(n - 1, i)); hovered = -1; refreshActive(); sr.textContent = describe(pinned);
  });
  canvas.addEventListener("blur", () => { pinned = -1; refreshActive(); });

  function setTarget() {
    if (!entered) return;
    const goal = view === "3d" ? 1 : 0;
    if (goal !== target) { target = goal; if (goal === 0) { yawGoal = 0; elevGoal = 0; } canvas.style.cursor = target === 1 ? "grab" : "default"; kick(); }
  }
  root.querySelector(".sk-toggle").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    view = b.dataset.v; renderText(); setTarget();
  });
  root.querySelector(".sk-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b || +b.dataset.i === dsi) return;
    dsi = +b.dataset.i; ds = opts.datasets[dsi]; legendLevel = -1;
    load(true); retheme(); refreshActive(); kick();
  });
  const legend = root.querySelector(".sk-legend");
  swatches.forEach((s, i) => {
    s.addEventListener("mouseenter", () => { legendLevel = i; renderText(); kick(); });
    s.addEventListener("focus", () => { legendLevel = i; renderText(); kick(); });
    s.addEventListener("blur", () => { legendLevel = -1; renderText(); kick(); });
    s.addEventListener("click", () => { legendLevel = legendLevel === i ? -1 : i; renderText(); kick(); });
  });
  legend.addEventListener("mouseleave", () => { legendLevel = -1; renderText(); kick(); });

  load(false); retheme(); relayout();
  const enter = () => { if (entered) return; entered = true; if (reduced) t = view === "3d" ? 1 : 0; setTarget(); };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((en) => { if (en.some((x) => x.isIntersecting)) { enter(); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(stage);
  } else enter();
  new ResizeObserver(() => { if (Math.round(stage.clientWidth) !== W) relayout(); }).observe(stage);
  new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  reduceMq.addEventListener && reduceMq.addEventListener("change", () => { reduced = reduceMq.matches; kick(); });
  darkMq.addEventListener && darkMq.addEventListener("change", retheme);
  return { replay() { t = 0; target = 0; setTarget(); kick(); },
    /* Zeitraum ändern: years × 12 Monate bis endMs, gleiches Diagramm */
    setYears(y) { opts.years = y; load(true); relayout(); refreshActive(); kick(); } };
};
})();
