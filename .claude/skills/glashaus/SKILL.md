---
name: glashaus
description: Am Glashaus-Dashboard (Design-Entwurf für ioBroker VIS 2) weiterarbeiten – Seiten ändern, bauen, prüfen, im Browser testen, eigenes Haus und eigene Geräte eintragen. Verwenden, wenn es um das Glashaus, VIS 2, die Seiten Zuhause, Energie, Heizung, Geräte, Einfahrt, Haus oder Zimmer, um Grundriss, Zimmer-Einrichtung oder ioBroker-Datenpunkte im Dashboard geht.
---

# Glashaus

Design-Dashboard für ioBroker VIS 2. Jede Seite ist eine eigenständige HTML-Datei ohne Framework und ohne Build-Werkzeuge außer `build.py`. Oberflächentexte sind Deutsch.

## Regeln

- Werte im Dashboard sind **Demo-Werte**. Echte Datenpunkte gehören in die Tabelle „In VIS 2 übernehmen“ jeder Seite.
- **Datenschutz vor jedem Veröffentlichen** (siehe unten): keine echten Namen, Adressen, Orte, Grundrisse, Telefonnummern, Kennzeichen, IP-Adressen oder Geräte-IDs.
- Ungenutztes nicht löschen, sondern in einen Archivordner verschieben, wenn es der Nutzer nicht ausdrücklich anders will.
- An einem echten ioBroker nur lesen. Skripte schreibt man lokal, einspielen macht der Nutzer.

## Aufbau

```
build.py          setzt src/ zu Seiten in docs/ zusammen (zuhause → index.html)
src/base.css      Design-Tokens (hell/dunkel), Glas, Raster s-1…s-12, Tablet, Anruf- und Kamera-Popup
src/sprite.html   SVG-Icons (#i-…)
src/common.js     Helfer ($, $$, de, tween, ring, toast), ART-Motive je Seite, initSculpture, initTablet,
                  camScene, GH_MOTION (Bewegungs-Popup), GH_CALL (Anruf), Demo-Tag D, YEAR, PLAN/ROOMS,
                  MUELL/TONNEN (Abfuhrkalender, tonneSvg, muellNext/muellAm)
src/sculpture.js  Partikel-Hintergrund (Canvas 2D): GlasSculpture({stage,img,srcs,band,…}) → {retheme, place, setAmbient}
src/skyline.js    3D-Jahres-Skyline
src/rooms.js      Zimmer-Konfiguration ZC + Speichern/Laden der Einrichtung, für Zimmer UND Haus
src/<seite>.html  zuhause, energie, heizung, geraete, einfahrt, haus, zimmer
```

Markierungen in den Seiten, die `build.py` ersetzt: `/*BASE_CSS*/`, `<!--SPRITE-->`, `/*COMMON_JS*/`, `/*SCULPTURE_JS*/`, `/*SKYLINE_JS*/`, `/*ROOMS_JS*/`, Links `__URL_<SEITE>__`. Achtung: Ein Kommentar in einer eingesetzten Datei darf weder `*/` noch eine dieser Markierungen enthalten.

Seiten nach System: **Zuhause** = nur Übersicht · **Energie** = PV, Batterie, Wallboxen · **Heizung** = Speicher, Zirkulation, Heizkreis, Räume · **Geräte** = Waschmaschine, Trockner, Spülmaschine, Echos · **Einfahrt** = Kamera, Autos, Fahrtenbuch, Garage, Besucher, Tonnen · **Haus** = 3D-Modell + Geräteliste · **Zimmer** = Räume in 3D mit Einrichten-Modus. Neue Funktionen gehören auf die Seite ihres Systems; Zuhause zeigt höchstens eine Zusammenfassung.

## Ändern, bauen, prüfen

1. Immer `src/` bearbeiten, nie `docs/`.
2. Bauen: `python3 build.py` (alle) oder `python3 build.py haus zimmer`. Änderungen an `common.js`, `base.css`, `sprite.html`, `sculpture.js` betreffen alle Seiten.
3. Syntax und Platzhalter: `bash .claude/skills/glashaus/check.sh`. Findet keine Laufzeitfehler.
4. Vorschau: `python3 -m http.server 8765 --bind 127.0.0.1 --directory docs` im Hintergrund, Browser auf 1280×900.
   - Nach jedem Build Cache umgehen: `?v=<zahl>` anhängen.
   - Kacheln erscheinen oft erst nach einmal Scrollen und kurzem Warten. Zuverlässig: `el.scrollIntoView()` per JavaScript, dann Screenshot.
   - Bildschirmschoner abschalten: `localStorage.setItem('glashaus.tablet','{"saver":0,"night":"off"}')`; Testdaten löschen: `glashaus.zimmer.layout`, `glashaus.muell`.
   - Zustände zu anderer Uhrzeit testen: `Date` im Seitenkontext durch eine Unterklasse mit festem `now` ersetzen und die Render-Funktion neu aufrufen.
   - **Konsole auf Fehler prüfen**, bei Zimmer für mehrere Räume über `#leo`, `#buero`, `#wohnen_h` …
5. Server beenden, Fenstergröße zurücksetzen.

Screenshots ohne Nachtmodus und mit fertig eingeblendeten Kacheln: Chrome headless, z. B.
`TZ=America/Los_Angeles chrome --headless=new --hide-scrollbars --window-size=1440,2400 --virtual-time-budget=7000 --force-prefers-reduced-motion --screenshot=out.png http://127.0.0.1:8765/index.html`
(der Nachtmodus richtet sich nach der Uhrzeit, Reduced Motion zeigt die Kacheln sofort und das Motiv statisch).

**Animierte Vorschaubilder (GIFs)** für die README: `tools/record.mjs` steuert Chrome über das DevTools-Protokoll und nimmt per Screencast auf.
1. Server für `docs/` auf Port 8766 starten.
2. `node tools/record.mjs <szene> <ordner>` ausführen. Szenen: `partikel` (Maus durchs Motiv), `haus` (Modell drehen, aufklappen), `zimmer` (Lichtszenen), `kamera` (Auto kommt, Popup), `skyline` (3D drehen), `theme` (hell/dunkel), `einrichten` (Möbel ziehen und drehen). Für `einrichten` zuerst `probe` ausführen, im Screenshot die Koordinaten eines Möbelgriffs ablesen und als `x y zielX zielY` mitgeben.
3. Mit dem ffmpeg-Befehl aus dem Dateikopf ein GIF machen (18 fps, 800 px breit, Ziel unter etwa 5 MB).
4. Stichproben-Bilder aus dem Ordner ansehen, bevor das GIF verwendet wird: richtiger Ausschnitt, keine privaten Daten.
Anderer Chrome-Pfad: Umgebungsvariable `CHROME`.

## Design

Forma-Look: Hintergrund #EBE9E5 / dunkel #111110, Schrift Geist, Akzent Instrument Serif kursiv (`.it`), Glas-Kacheln (`.glass.tile`), Pills (`.pill ok|warn|crit|info|idle`). Farben nur über Tokens; neue Tokens in `:root` und in **beiden** Dunkel-Blöcken von base.css ergänzen. Animationen respektieren `prefers-reduced-motion` (`RM`).

**Motive (`ART` in common.js):** Linienzeichnungen auf einer 2000×800-Leinwand, hell und dunkel, für das Handy wird links und rechts ≈ 250 px abgeschnitten. Hausansichten im ruhigen **Plan-Stil** in Metern über `M(x, y)`; freie, verwinkelte Zeichnungen wirken schnell unruhig. `ART.zuhause(g, o, cx, s, gy)` gibt `{ M, L, s }` zurück, andere Motive (Einfahrt) bauen darauf auf. Unterster Strich ≈ y 740, sonst läuft die Zeichnung in den Text. Prüfen ohne Partikel: `makeArt(ART.<name>)` im Browser ausführen und `light`/`dark` als Bild anzeigen.

## Grundriss, Zimmer, Geräte

- **Grundriss** `PLAN` (common.js): Geschosse mit `box`, Umriss `foot`, Räumen `{id, n, a (m²), u, p}`; `u` = `H` Familie, `O` zweite Wohnung, `S` gemeinsam, `X` draußen; Treppen `stair:1`. Die Raum-ids werden in `ZC`, `DEV` und Links (`#id`) verwendet.
- **Zimmer** `ZC` (rooms.js): Positionen als Anteile `u/v` des Raumrechtecks oder als Wand `n/e/s/w` mit Position `t`.
  - Möbel `{type,u,v,W,D,q}` (Breite, Tiefe in m, Vierteldrehung); Typen bed, desk, table, sofa, sessel, coffee, tv, counter, schrank, regal, kommode.
  - Fenster `wins[]` `{wall,t,door}`, Türen `doors[]` `{wall,t,flip}`, Melder `P[].at`, Heizkörper `T.wall/t`, Lampen `pos/u/v/rot`, LED-Streifen an der Wand (`wall,from,to,z`) oder frei an der Decke (`free,u,v,axis`).
  - Geräte `devs[]`: `dish|echo|fan` brauchen `wall,t` und werden in 3D gezeichnet; `shutter`, `none`, `cube`, `contact` erscheinen nur in der Liste. Ein neuer Typ braucht einen Eintrag in `DIC` (zimmer.html) und darf ohne `wall` nicht ins 3D-Zeichnen laufen, sonst bricht das ganze Zimmer ab.
  - Die Einrichtung speichert der Browser je Seite getrennt (`glashaus.zimmer.layout`). „Für Hausmodell kopieren“ (Zimmer) → „Einrichtung übernehmen“ (Haus); dauerhaft: JSON in `ZC` eintragen.
- **Hausmodell** (haus.html): `roomKit` zeichnet aus `ZC` Fenster, Türen, Lampen, Melder, Heizkörper, Fußbodenheizung (ohne Möbel). Symbole in `DEV` mit Raum `r` und Position `uv:[u,v]` (oder `at` in Plankoordinaten). Prüfen: `DEV.filter(d=>!d.roof&&!(d.p&&isFinite(d.p[0])))` muss leer sein.
- **Neues Gerät** immer an drei Stellen: `ZC` (Zimmer), `DEV` (Hausmodell), `INV` (Geräteliste auf der Haus-Seite).
- **Müllabfuhr:** `MUELL_RAW` (MMTT je Tonne) und `MUELL_Y` in common.js; Gebühren `GEB` in einfahrt.html (Jahresgebühr inkl. 12 Leerungen, je weitere Leerung).

## ioBroker anbinden

Die Tabellen „In VIS 2 übernehmen“ nennen je Widget den Datenpunkt. Typische Quellen: `shelly.*`, `zigbee.0.*`, `wled.0.*`, `hue.0.*`, `fritzdect.0.*`, `alexa2.*`, `homeconnect.0.*`, `modbus.*` (Wechselrichter), `bydhvs.0.*`, `0_userdata.0.*` für eigene Skript-Zustände. Geräteübersicht lesend: `iobroker list objects "zigbee.0.*"` und nach `device - ` filtern; Online-Status in `*.online` bzw. `*.available`.

## Datenschutz vor dem Veröffentlichen

Vor einem öffentlichen Commit alles Persönliche ersetzen und danach suchen:
- Namen von Personen, Wohnort, Straße, Hausnummer, Abfallbezirk, echte Abfuhrtermine und Gebühren des eigenen Kreises.
- Echter Grundriss und echte Hausansicht → erfundenes Beispielhaus.
- Telefonnummern (auch Teile), Kennzeichen, IP-Adressen, Benutzernamen.
- Geräte-IDs: Shelly-MAC (`#…#`), Zigbee-IEEE (`00158d…`), Echo-Seriennummern, FRITZ!DECT-AIN, Home-Connect-, Wallbox-, WLED-, Yeelight-IDs.
- Git-Autor: die GitHub-noreply-Adresse verwenden, nicht die private E-Mail.
- Fremden Code nur mit klarer Lizenz übernehmen.
- Ersetzungen von Hex-IDs nie über ein allgemeines `#[0-9a-f]{6}` machen, das erwischt auch alle Farbcodes.
