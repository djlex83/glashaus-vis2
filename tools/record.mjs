// Nimmt animierte Vorschaubilder auf: steuert Chrome headless über das DevTools-Protokoll (Maus, Klicks)
// und zeichnet per Screencast mit ~60 Bildern/s auf. Braucht Node 22+ (fetch, WebSocket) und Google Chrome.
// Vorher: python3 -m http.server 8766 --bind 127.0.0.1 --directory docs
// Aufruf: node tools/record.mjs <szene> <ausgabeordner> [x y zielX zielY]
//   Szenen: partikel, haus, zimmer, kamera, skyline, theme, probe (Screenshot im Einrichten-Modus), einrichten
// Danach GIF: ffmpeg -f concat -safe 0 -i <ordner>/list.txt -vf "fps=18,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle" -loop 0 out.gif
import { spawn } from "child_process"; import fs from "fs";
const [scene, out] = process.argv.slice(2); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const CH = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", PORT = 9333, W = 1280, H = 720;
const chrome = spawn(CH, ["--headless=new", `--remote-debugging-port=${PORT}`, `--window-size=${W},${H}`, "--hide-scrollbars", "--user-data-dir=/tmp/glashaus-rec-profile", "about:blank"], { env: { ...process.env, TZ: "America/Los_Angeles" }, stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (tabs.find(t => t.type === "page")) break; } catch {} await sleep(200); }
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(), shots = []; let rec = false;
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result || m.error); pend.delete(m.id); }
  if (m.method === "Page.screencastFrame") { if (rec) shots.push({ t: m.params.metadata.timestamp, d: m.params.data }); ws.send(JSON.stringify({ id: ++id, method: "Page.screencastFrameAck", params: { sessionId: m.params.sessionId } })); } };
const cmd = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const js = (expr) => cmd("Runtime.evaluate", { expression: expr, awaitPromise: true });
await cmd("Page.enable"); await cmd("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const go = async (url, dark) => { await cmd("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: dark ? "dark" : "light" }] });
  await cmd("Page.navigate", { url }); await sleep(800);
  await js(`localStorage.setItem('glashaus.tablet','{"saver":0,"night":"off"}')`); await cmd("Page.reload"); await sleep(2500); };
const frame = () => sleep(40);   // Takt der Szene; aufgenommen wird per Screencast
const start = async () => { rec = true; await cmd("Page.startScreencast", { format: "jpeg", quality: 82, maxWidth: W, maxHeight: H, everyNthFrame: 1 }); };
const mouse = (type, x, y, buttons = 0) => cmd("Input.dispatchMouseEvent", { type, x, y, button: buttons ? "left" : "none", buttons, clickCount: type === "mousePressed" || type === "mouseReleased" ? 1 : 0 });
const ease = (u) => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

if (scene === "partikel") {
  await go("http://127.0.0.1:8766/index.html", true);
  await start(); await frame(); await frame();
  const path = (u) => [200 + u * 880, 300 + Math.sin(u * Math.PI * 3) * 110];
  for (let i = 0; i <= 70; i++) { const [x, y] = path(ease(i / 70)); await mouse("mouseMoved", x, y); await frame(); }
  for (let i = 0; i < 45; i++) { const [x, y] = path(1 - ease(i / 44) * 0.0); if (i === 0) await mouse("mouseMoved", 1250, 700); await frame(); }
} else if (scene === "haus") {
  await go("http://127.0.0.1:8766/haus.html", true);
  await js(`document.querySelector('#hwrap').scrollIntoView({block:'center'})`); await sleep(800);
  await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Haus')?.click()`); await sleep(1500);
  const r = JSON.parse((await js(`JSON.stringify(document.querySelector('#hwrap').getBoundingClientRect())`)).result.value);
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  await start(); for (let i = 0; i < 12; i++) await frame();
  await mouse("mousePressed", cx, cy, 1);
  for (let i = 0; i <= 80; i++) { await mouse("mouseMoved", cx + Math.sin(i / 80 * Math.PI * 2) * 260, cy, 1); await frame(); }
  await mouse("mouseReleased", cx, cy);
  for (let i = 0; i < 10; i++) await frame();
  await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Aufgefächert')?.click()`);
  for (let i = 0; i < 40; i++) await frame();
} else if (scene === "zimmer") {
  await go("http://127.0.0.1:8766/zimmer.html#leo", true);
  await js(`document.getElementById('room').scrollIntoView({block:'start'}); window.scrollBy(0,-12)`); await sleep(1800);
  await start(); for (let i = 0; i < 10; i++) await frame();
  await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Disco')?.click()`);
  for (let i = 0; i < 70; i++) await frame();
  await js(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Nacht')?.click()`);
  for (let i = 0; i < 40; i++) await frame();
} else if (scene === "kamera") {
  await go("http://127.0.0.1:8766/einfahrt.html", true);
  await js(`document.getElementById('camcv').closest('article').scrollIntoView({block:'center'})`); await sleep(1500);
  await start(); for (let i = 0; i < 8; i++) await frame();
  await js(`document.querySelector('[data-cplay="auto"]').click()`);
  for (let i = 0; i < 150; i++) await frame();
  await js(`document.querySelector('[data-cpop]').click()`);
  for (let i = 0; i < 90; i++) await frame();
} else if (scene === "skyline") {
  await go("http://127.0.0.1:8766/energie.html", true);
  await js(`document.getElementById('sky').scrollIntoView({block:'center'})`); await sleep(2500);
  const r = JSON.parse((await js(`JSON.stringify(document.getElementById('sky').getBoundingClientRect())`)).result.value);
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  await start(); for (let i = 0; i < 10; i++) await frame();
  await mouse("mousePressed", cx, cy, 1);
  for (let i = 0; i <= 90; i++) { await mouse("mouseMoved", cx - Math.sin(i / 90 * Math.PI) * 320, cy + Math.sin(i / 90 * Math.PI * 2) * 40, 1); await frame(); }
  await mouse("mouseReleased", cx, cy);
  for (let i = 0; i <= 50; i++) { await mouse("mouseMoved", cx - 300 + i * 12, cy - 30); await frame(); }
} else if (scene === "theme") {
  await go("http://127.0.0.1:8766/index.html", false);
  await start(); for (let i = 0; i < 30; i++) await frame();
  await js(`document.querySelector('[data-theme-toggle]').click()`); for (let i = 0; i < 45; i++) await frame();
  await js(`document.querySelector('[data-theme-toggle]').click()`); for (let i = 0; i < 40; i++) await frame();
} else if (scene === "probe") {
  await go("http://127.0.0.1:8766/zimmer.html#leo", true);
  await js(`document.getElementById('room').scrollIntoView({block:'start'}); window.scrollBy(0,-12)`); await sleep(1500);
  await js(`document.querySelector('[data-edit]').click()`); await sleep(800);
  const r = await cmd("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(`${out}/probe.png`, Buffer.from(r.data, "base64"));
} else if (scene === "einrichten") {
  const [fx, fy, tx, ty] = process.argv.slice(4).map(Number);
  await go("http://127.0.0.1:8766/zimmer.html#leo", true);
  await js(`localStorage.removeItem('glashaus.zimmer.layout')`);
  await js(`document.getElementById('room').scrollIntoView({block:'start'}); window.scrollBy(0,-12)`); await sleep(1500);
  await start(); for (let i = 0; i < 10; i++) await frame();
  await js(`document.querySelector('[data-edit]').click()`); for (let i = 0; i < 20; i++) await frame();
  await mouse("mouseMoved", fx, fy); await frame();
  await mouse("mousePressed", fx, fy, 1);
  for (let i = 0; i <= 60; i++) { const u = ease(i / 60); await mouse("mouseMoved", fx + (tx - fx) * u, fy + (ty - fy) * u, 1); await frame(); }
  await mouse("mouseReleased", tx, ty); for (let i = 0; i < 15; i++) await frame();
  await mouse("mousePressed", tx, ty, 1); await mouse("mouseReleased", tx, ty);
  await cmd("Input.dispatchMouseEvent", { type: "mousePressed", x: tx, y: ty, button: "left", buttons: 1, clickCount: 2 });
  await cmd("Input.dispatchMouseEvent", { type: "mouseReleased", x: tx, y: ty, button: "left", buttons: 0, clickCount: 2 });
  for (let i = 0; i < 30; i++) await frame();
  await js(`localStorage.removeItem('glashaus.zimmer.layout')`);
}
if (scene === "probe") { ws.close(); chrome.kill(); process.exit(0); }
await cmd("Page.stopScreencast"); rec = false;
/* Bilder + Dauer je Bild für ffmpeg (concat), auf 20 fps vereinheitlicht */
let list = "", k = 0; shots.forEach((f, i) => { const name = `f${String(k++).padStart(4, "0")}.jpg`; fs.writeFileSync(`${out}/${name}`, Buffer.from(f.d, "base64"));
  const dur = i < shots.length - 1 ? Math.max(0.01, shots[i + 1].t - f.t) : 0.05; list += `file '${name}'\nduration ${dur.toFixed(3)}\n`; });
fs.writeFileSync(`${out}/list.txt`, list + `file 'f${String(k - 1).padStart(4, "0")}.jpg'\n`);
const secs = shots.length ? shots[shots.length - 1].t - shots[0].t : 0;
console.log(scene, shots.length, "Bilder,", (shots.length / secs).toFixed(1), "fps,", secs.toFixed(1), "s"); ws.close(); chrome.kill();
