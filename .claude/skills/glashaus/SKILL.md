---
name: glashaus
description: Am Glashaus-Dashboard (Design-Entwurf für ioBroker VIS 2) weiterarbeiten – Seiten ändern, bauen, prüfen, im Browser testen, eigenes Haus und eigene Geräte eintragen. Verwenden, wenn es um das Glashaus, VIS 2, die Seiten Zuhause, Energie, Heizung, Geräte, Einfahrt, Haus oder Zimmer, um Grundriss, Zimmer-Einrichtung oder ioBroker-Datenpunkte im Dashboard geht.
---

# Glashaus

Design-Dashboard für ioBroker VIS 2. Jede Seite ist eine eigenständige HTML-Datei ohne Framework und ohne Build-Werkzeuge außer `build.py`. Oberflächentexte werden auf Deutsch geschrieben; die englische Fassung entsteht beim Bauen (siehe „Übersetzen“).

## Regeln

- Werte im Dashboard sind **Demo-Werte**. Echte Datenpunkte gehören in die Tabelle „In VIS 2 übernehmen“ jeder Seite.
- **Datenschutz vor jedem Veröffentlichen** (siehe unten): keine echten Namen, Adressen, Orte, Grundrisse, Telefonnummern, Kennzeichen, IP-Adressen oder Geräte-IDs.
- Ungenutztes nicht löschen, sondern in einen Archivordner verschieben, wenn es der Nutzer nicht ausdrücklich anders will.
- An einem echten ioBroker nur lesen. Skripte schreibt man lokal, einspielen macht der Nutzer.

## Aufbau

```
build.py          setzt src/ zu Seiten in docs/ zusammen (zuhause → index.html), Englisch nach docs/en/
src/i18n/en.json  englisches Wörterbuch (raw, text, phrases, pages)
src/base.css      Design-Tokens (hell/dunkel), Glas, Raster s-1…s-12, Tablet, Anruf- und Kamera-Popup
src/sprite.html   SVG-Icons (#i-…)
src/common.js     Helfer ($, $$, de, tween, ring, toast), ART-Motive je Seite, initSculpture, initTablet,
                  camScene, GH_MOTION (Bewegungs-Popup), GH_CALL (Anruf), Demo-Tag D, YEAR, PLAN/ROOMS,
                  MUELL/TONNEN (Abfuhrkalender, tonneSvg, muellNext/muellAm)
src/sculpture.js  Partikel-Hintergrund (Canvas 2D): GlasSculpture({stage,img,srcs,band,…}) → {retheme, place, setAmbient}
src/skyline.js    3D-Jahres-Skyline; Option years = Anzahl Jahre als parallele Streifen, sky.setYears(n)
src/rooms.js      Zimmer-Konfiguration ZC + Speichern/Laden der Einrichtung, für Zimmer UND Haus
src/<seite>.html  zuhause, energie, heizung, geraete, einfahrt, haus, zimmer
```

Markierungen in den Seiten, die `build.py` ersetzt: `<!--LANG-->` (Sprachumschalter DE | EN in der Navigation), `/*BASE_CSS*/`, `<!--SPRITE-->`, `/*COMMON_JS*/`, `/*SCULPTURE_JS*/`, `/*SKYLINE_JS*/`, `/*ROOMS_JS*/`, Links `__URL_<SEITE>__`. Achtung: Ein Kommentar in einer eingesetzten Datei darf weder `*/` noch eine dieser Markierungen enthalten.

Seiten nach System: **Zuhause** = nur Übersicht · **Energie** = PV, Batterie, Wallboxen · **Heizung** = Speicher, Zirkulation, Heizkreis, Räume · **Geräte** = Waschmaschine, Trockner, Spülmaschine, Echos · **Einfahrt** = Kamera, Autos, Fahrtenbuch, Garage, Besucher, Tonnen · **Haus** = 3D-Modell + Geräteliste · **Zimmer** = Räume in 3D mit Einrichten-Modus. Neue Funktionen gehören auf die Seite ihres Systems; Zuhause zeigt höchstens eine Zusammenfassung.

## Neu in 1.1.0 (Version: `GLASHAUS_VERSION` in common.js, steht in jeder Fußzeile; bei größeren Änderungen erhöhen und in beiden READMEs unter „Versionen“ eintragen)

- **Mehrere Jahre in der Skyline:** `skyStack({key, first, build(el, st)})` (common.js) setzt „− n Jahre +“ in `[data-skyctl]` im Abschnittskopf.
  - Jedes weitere Jahr wird ein eigener Streifen im selben Diagramm, um 52 Wochen versetzt, damit die Monate übereinanderliegen. Das jüngste Jahr steht vorn.
  - Die Vergleichszeile `.sk-cmp` zeigt die Summe je Jahr und ± zum Vorjahr. Die Statistik oben bleibt beim jüngsten Jahr. `YEAR` reicht ab 1. Januar vor drei Jahren.
- **Standby-Kacheln:** `STILES` + `status()` in initTablet.
  - Layout: Uhr links unten, Kacheln rechts (`.stiles`).
  - Antippen öffnet die Seite (`goTo`, sucht den Link per `href`, damit es auch auf Englisch klappt). Der Standby wechselt immer zur Startseite (`#standby`).
  - Nachts bleiben nur Kacheln mit `data-night`. Am Vortag der Abfuhr wird die Müll-Kachel breit (`.soon`) in der Tonnenfarbe, mit `tonneSvg`-Symbolen.
- **Wetter-Kachel** (Zuhause, s-12): oben jetzt und Werte (`.wx-top`, `.wx-kv`), darunter 24 Stunden mit Regenbalken (`.wx-hours`) und 7 Tage (`.wx-days`). Demo-Daten `wxDemoH`, `wxDemoT`.
- **Abfuhrkalender** (Einfahrt): Monate blättern (`calOff`, ‹ › Heute). Leerungen ordnet `leerMatch` dem Termin zu (bis 2 Tage danach): „✓ 09:30“ = geleert, durchgestrichen = nicht rausgestellt. In der Demo kommen die Leerungen aus „rausgestellt“.
- **Geräte:** Trommel, Wäsche und Wasser sitzen fest im Gehäuse, `.door` ist nur Ring und Glas. Offen = `scaleX(-.17)` am linken Scharnier. Bei der Spülmaschine bleiben die Körbe sichtbar.
- **Testen der Skyline headless:** Chrome headless startet die 3D-Animation nicht zuverlässig (bleibt flach). 3D im echten Browser prüfen.

## Ändern, bauen, prüfen

1. Immer `src/` bearbeiten, nie `docs/`.
2. Bauen: `python3 build.py` (alle Seiten, Deutsch und Englisch) oder `python3 build.py haus zimmer`; nur eine Sprache mit `--lang de|en`. Änderungen an `common.js`, `base.css`, `sprite.html`, `sculpture.js` betreffen alle Seiten.
3. Syntax und Platzhalter: `bash .claude/skills/glashaus/check.sh` (prüft `docs/` und `docs/en/`). Findet keine Laufzeitfehler.
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
2. `node tools/record.mjs <szene> <ordner>` ausführen. Szenen: `partikel` (Maus durchs Motiv), `wetter` (alle Wetterbilder), `haus` (Modell drehen, aufklappen), `zimmer` (Lichtszenen), `kamera` (Auto kommt, Popup), `skyline` (3D drehen), `theme` (hell/dunkel), `einrichten` (Möbel ziehen und drehen). Für `einrichten` zuerst `probe` ausführen, im Screenshot die Koordinaten eines Möbelgriffs ablesen und als `x y zielX zielY` mitgeben.
3. Mit dem ffmpeg-Befehl aus dem Dateikopf ein GIF machen (18 fps, 800 px breit, Ziel unter etwa 5 MB).
4. Stichproben-Bilder aus dem Ordner ansehen, bevor das GIF verwendet wird: richtiger Ausschnitt, keine privaten Daten.
Anderer Chrome-Pfad: Umgebungsvariable `CHROME`.

## Übersetzen (Englisch)

Quelle ist immer der deutsche Text in `src/`. `build.py --lang en` übersetzt beim Bauen nach `docs/en/` mit `src/i18n/en.json`; `<html lang>`, Beschreibung und `og:description` setzt `build.py` je Sprache. Der Übersetzer zerlegt jede Seite: Text zwischen Tags, Text-Attribute (`title`, `aria-label`, `placeholder`, `data-…`), Inhalt jedes JS-String- und Template-Literals (darin wieder Text zwischen Tags). CSS, Kommentare, Regex, ids, Klassen und Code bleiben unberührt.

Abschnitte in `en.json`, in dieser Reihenfolge angewendet:
- `raw`: exakte Ersetzung im zusammengesetzten Quelltext, vor allem anderen. Für Wortstellung (`'vor '+m+' min'` → `m+' min ago'`), Datumsformate (`'.'`-Datum → `/`, Wochentag-Arrays), Euro-Formate und Status, die zugleich **Schlüssel** sind (nur die Anzeige übersetzen, z. B. `p.textContent=({'lädt':'charging',…})[st]`).
- `text`: ganzes Textstück → Übersetzung (Leerraum am Rand bleibt, innen wird er zusammengefasst). Der Normalfall. `pages.<seite>` überschreibt einzelne Stücke nur für eine Seite.
- `phrases`: Teilstück in sonst unübersetzten Stücken, nur ganze Wörter, längste zuerst. Sparsam verwenden.
- Reine Zahlen im Markup (`12,5`, `· 22,6 °C`, `2,38 €`) wandelt `build.py` selbst um; `de()` und `toLocale…('de-DE')` werden über `"de-DE": "en-GB"` englisch.

**Neuen Text einbauen:**
1. Deutsch in `src/` schreiben, `python3 build.py --lang en --missing` ausführen. Es listet Stücke, die noch deutsch aussehen (`[seite:text|attr|js] Stück`), und Einträge in `en.json`, die nicht mehr vorkommen.
2. Für jedes Stück einen Eintrag in `text` anlegen, Schlüssel **genau** wie ausgegeben (inklusive `· `, `: `, Entities wie `&amp;`, Backslash-Escapes). In JS-Strings mit `'` kein gerades Apostroph in der Übersetzung, sondern `’`.
3. Wird ein Satz im Code zusammengesetzt (`'Fertig um '+zeit`), die Stücke einzeln übersetzen; passt die Wortstellung nicht, einen `raw`-Eintrag für den ganzen Ausdruck.
4. Kleine deutsche Wörter, die im Code als Schlüssel dienen (`'zu'`, `'offen'`, `'lädt'`, `'sonne'`, Raum-ids, Motive wie `'zuhause'`), **nie** in `text` aufnehmen, sonst bricht die Logik oder CSS wie `.wb[data-s="lädt"]`. Vorher mit `grep -n "'wort'" src/*` prüfen; Anzeige dann über `raw`.
5. Datenpunkte (`0_userdata.0.…`, `zigbee.0.…`), Marken- und Gerätenamen bleiben unverändert.
6. Neu bauen, `check.sh`, die englische Seite im Browser öffnen (Konsole prüfen, nach deutschen Wörtern wie der, die, und, mit, Uhr, heute suchen) und ungenutzte Einträge löschen.

Englische Begriffe einheitlich halten: Zuhause → Home, Geräte → Appliances, Einfahrt → Driveway, Zimmer → Rooms, Einrichten → Furnish, „In VIS 2 übernehmen“ → “Use in VIS 2”, Datenpunkt → Datapoint, Fahrtenbuch → Logbook, Müllabfuhr → Bin collection, Kombi/Kleinwagen/Elektroauto → Estate/Small car/Electric car.

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
- **Wetter im Hausbild:** `wxLayer` (common.js) zeichnet in `ART.zuhause(g, o, cx, s, gy, wx)` Sonne, Mond und Sterne, Wolken, Regen, Blitz, Schnee, Nebel und Wind im gleichen Strichstil; nachts leuchten die Fenster warm. Vorgaben in `WX`, Auswahl über `wxOf(motiv, nacht)`. Freie Himmelsflächen und Schneekanten des Hauses stehen in `ZU_WX` – bei einem eigenen Haus dort anpassen. Die Zuhause-Kachel `#wetter` tauscht das Bild mit `SCULPT.setArt(draw)`; live aus `0_userdata.0.Wetter.motiv` (sonne, heiter, wolken, regen, gewitter, schnee, nebel, wind) und `.nacht`.
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
