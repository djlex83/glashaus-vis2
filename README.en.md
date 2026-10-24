# Glashaus · Design dashboard for ioBroker VIS 2

[Deutsch](README.md) · **English**

[![Live demo](https://img.shields.io/badge/Live_demo-open-3a8452)](https://djlex83.github.io/glashaus-vis2/en/)
[![ioBroker VIS 2](https://img.shields.io/badge/ioBroker-VIS%202-2d6bb0)](https://github.com/ioBroker/ioBroker.vis-2)
[![No dependencies](https://img.shields.io/badge/dependencies-none-6760c4)](#quick-start)
[![License: MIT](https://img.shields.io/badge/license-MIT-bf7a14)](LICENSE)

**Live demo (English):** [Home](https://djlex83.github.io/glashaus-vis2/en/) · [Energy](https://djlex83.github.io/glashaus-vis2/en/energie.html) · [Heating](https://djlex83.github.io/glashaus-vis2/en/heizung.html) · [Appliances](https://djlex83.github.io/glashaus-vis2/en/geraete.html) · [Driveway](https://djlex83.github.io/glashaus-vis2/en/einfahrt.html) · [House](https://djlex83.github.io/glashaus-vis2/en/haus.html) · [Rooms](https://djlex83.github.io/glashaus-vis2/en/zimmer.html)  
German version: [https://djlex83.github.io/glashaus-vis2/](https://djlex83.github.io/glashaus-vis2/) · switch with **DE | EN** in the navigation of every page.

A dashboard design for a smart home running ioBroker: frosted-glass tiles, calm typography and a line drawing behind every page that dissolves into particles when you touch it. Every page is a single self-contained HTML file, without frameworks or build tooling. It runs in any browser, on a wall-mounted tablet, or serves as a template for VIS 2.

> All values are demo values and the house is fictional. The table “Use in VIS 2” on every page lists which ioBroker data point belongs where (with sample IDs).

> **New: Glashaus as a real widget set for VIS 2.** 14 widgets in the same design for the VIS 2 palette, choose your own data points in the editor, demo project to import: **[ioBroker.vis-2-widgets-glashaus](https://github.com/djlex83/ioBroker.vis-2-widgets-glashaus)** (on npm as `iobroker.vis-2-widgets-glashaus`). To use Glashaus in VIS 2, the widget set is the way to go; this repository stays the design draft with the seven finished pages.

![Particles: move the pointer across the drawing](screenshots/partikel.gif)

| Rotate and explode the house model | Rooms with light scenes |
|---|---|
| ![House model](screenshots/hausmodell.gif) | ![Room](screenshots/zimmer.gif) |
| **Camera: car arrives, live pop-up** | **Energy: rotate the 3D yearly skyline** |
| ![Camera](screenshots/kamera.gif) | ![Skyline](screenshots/skyline.gif) |
| **Switch light and dark** | **Room edit mode: drag and rotate furniture** |
| ![Light and dark](screenshots/theme.gif) | ![Edit mode](screenshots/einrichten.gif) |
| **Weather in the house drawing: sun, rain, thunderstorm, snow, fog, wind** | |
| ![Weather](screenshots/wetter.gif) | |

## Pages

The interface comes in English and German (the German version is the default; **DE | EN** in the navigation switches to the same page in the other language). German page names in brackets.

| Page | Content |
|---|---|
| **Home** (Zuhause, `index.html`) | Overview: energy now, hot water, scenes, switches, appliances, notifications, full-width weather with 24 hours and 7 days (drawn into the house picture), waste collection |
| **Energy** (Energie) | PV, battery, grid, 3D yearly skyline with previous years for comparison (+/−), wallboxes with solar charging |
| **Heating** (Heizung) | Hot-water tank, circulation pump, heating circuit, rooms, heating year with previous years |
| **Appliances** (Geräte) | Washing machine, dryer, dishwasher, Echo speakers |
| **Driveway** (Einfahrt) | Camera with motion pop-up, cars, logbook, garage, visitors, waste calendar to browse by month with collections (✓ time, not put out struck through), fee calculator |
| **House** (Haus) | Isometric 3D model of all floors with every device, device list (Shelly, Zigbee, WLED) |
| **Rooms** (Zimmer) | Each room in 3D with lights, heating, motion sensors; edit mode to move furniture, windows, doors and lights |

| | |
|---|---|
| ![Home](screenshots/zuhause.png) | ![Driveway](screenshots/einfahrt.png) |
| ![House](screenshots/haus.png) | ![Room](screenshots/zimmer.png) |
| ![Energy](screenshots/energie.png) | ![Light theme](screenshots/start-hell.png) |

Light and dark follow the system setting and can be toggled top right. On a wall tablet there is a screensaver, a night mode and pop-ups for calls and motion.

**Standby:** clock bottom left, the key values as tiles on the right (roof, battery, house, hot water, outdoor with today's low/high, garage, bins, running appliances). Tapping a tile opens its page; the day before collection the bin tile lights up in the bin's colour, even at night.

![Standby](screenshots/standby.png)

## Quick start

```bash
python3 build.py                                   # builds all pages into docs/ (German) and docs/en/ (English)
python3 -m http.server 8765 --directory docs       # then open http://localhost:8765
bash .claude/skills/glashaus/check.sh              # checks syntax and leftover placeholders
```

`docs/` is already built and served by GitHub Pages as the live demo ([English](https://djlex83.github.io/glashaus-vis2/en/), [German](https://djlex83.github.io/glashaus-vis2/)).

## Structure

```
build.py            assembles src/ into standalone pages in docs/, translates them into docs/en/
src/i18n/en.json    English dictionary used by build.py
src/base.css        design tokens (light/dark), glass, 12-column grid, tablet mode, pop-ups
src/sprite.html     SVG icons (#i-…)
src/common.js       helpers, line drawings per page (ART), tablet mode, camera scene,
                    motion and call pop-ups, demo data, floor plan (PLAN), waste calendar
src/sculpture.js    particle background (Canvas 2D)
src/skyline.js      3D yearly skyline
src/rooms.js        room configuration (lights, devices, heating, sensors, windows, doors, furniture)
src/<page>.html     zuhause, energie, heizung, geraete, einfahrt, haus, zimmer
```

The page files contain markers (`/*COMMON_JS*/`, `/*BASE_CSS*/`, `<!--SPRITE-->` …) that `build.py` replaces with the shared files. Links between pages are written as `__URL_<PAGE>__` in the sources.

**Translation:** the sources are German. `python3 build.py --lang en` replaces German text in the markup and in JavaScript string literals using `src/i18n/en.json` (whole text pieces, a few code-level replacements for word order and date formats); code, CSS, ids and data points stay untouched. `python3 build.py --lang en --missing` lists text that still looks German and dictionary entries that are no longer used.

## Use your own house

1. **Floor plan:** `PLAN` in `src/common.js`. Per floor an outline (`foot`) and rooms as polygons in metres (`p`), plus a unit `u` (`H` main household, `O` second flat, `S` shared, `X` outdoors).
2. **Rooms:** `ZC` in `src/rooms.js`. Lights, radiators, sensors, windows, doors and furniture, positioned as fractions `u/v` of the room or as wall + position (`wall: 'n'|'e'|'s'|'w'`, `t`). In the edit mode of the Rooms page everything can be dragged and copied as JSON.
3. **Devices in the house model:** `DEV` in `src/haus.html` (room `r`, position `uv`, icon, data point), device list `INV`.
4. **Street view:** `ART.zuhause` in `src/common.js` draws the front elevation in metres via `M(x, y)`.
5. **Data points:** enter your own ioBroker IDs in the “Use in VIS 2” tables.

## Developing with Claude Code

[`.claude/skills/glashaus/SKILL.md`](.claude/skills/glashaus/SKILL.md) is a skill (in German) that explains to Claude Code how the project is structured, how to build, check and test it, and which design and privacy rules apply. Claude Code loads it automatically when working in this folder.

## Privacy

This repository deliberately contains **no real house**: floor plan, street view, names, places, waste collection dates, fees and all device IDs are invented or replaced. If you adapt it for your own home, do the same before publishing (see the privacy section in the skill).

## Contributing

Anyone is welcome to fork the project, change it and propose improvements as a pull request, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Versions

| Version | Changes |
|---|---|
| 1.1.1 | Standby: tiles respond reliably to a quick tap on touch tablets |
| 1.1.0 | Standby with info tiles, yearly skyline with previous years as strips, weather with 24 hours and 7 days, waste calendar by month with collections, open doors on washer and dryer, version in the footer |
| 1.0.0 | First release: seven pages, sample house, English interface, weather in the house picture |

## License

MIT, see [LICENSE](LICENSE). Fonts: Geist and Instrument Serif via Google Fonts (SIL Open Font License).
