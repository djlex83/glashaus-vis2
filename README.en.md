# Glashaus · Design dashboard for ioBroker VIS 2

[Deutsch](README.md) · **English**

[![Live demo](https://img.shields.io/badge/Live_demo-open-3a8452)](https://djlex83.github.io/glashaus-vis2/)
[![ioBroker VIS 2](https://img.shields.io/badge/ioBroker-VIS%202-2d6bb0)](https://github.com/ioBroker/ioBroker.vis-2)
[![No dependencies](https://img.shields.io/badge/dependencies-none-6760c4)](#quick-start)
[![License: MIT](https://img.shields.io/badge/license-MIT-bf7a14)](LICENSE)

**Live demo:** [Home](https://djlex83.github.io/glashaus-vis2/) · [Energy](https://djlex83.github.io/glashaus-vis2/energie.html) · [Heating](https://djlex83.github.io/glashaus-vis2/heizung.html) · [Appliances](https://djlex83.github.io/glashaus-vis2/geraete.html) · [Driveway](https://djlex83.github.io/glashaus-vis2/einfahrt.html) · [House](https://djlex83.github.io/glashaus-vis2/haus.html) · [Rooms](https://djlex83.github.io/glashaus-vis2/zimmer.html)

A dashboard design for a smart home running ioBroker: frosted-glass tiles, calm typography and a line drawing behind every page that dissolves into particles when you touch it. Every page is a single self-contained HTML file, without frameworks or build tooling. It runs in any browser, on a wall-mounted tablet, or serves as a template for VIS 2.

> All values are demo values and the house is fictional. The table “In VIS 2 übernehmen” (use in VIS 2) on every page lists which ioBroker data point belongs where (with sample IDs).

![Particles: move the pointer across the drawing](screenshots/partikel.gif)

| Rotate and explode the house model | Rooms with light scenes |
|---|---|
| ![House model](screenshots/hausmodell.gif) | ![Room](screenshots/zimmer.gif) |
| **Camera: car arrives, live pop-up** | **Energy: rotate the 3D yearly skyline** |
| ![Camera](screenshots/kamera.gif) | ![Skyline](screenshots/skyline.gif) |
| **Switch light and dark** | **Room edit mode: drag and rotate furniture** |
| ![Light and dark](screenshots/theme.gif) | ![Edit mode](screenshots/einrichten.gif) |

## Pages

The user interface is in German. Page names in brackets.

| Page | Content |
|---|---|
| **Home** (Zuhause, `index.html`) | Overview: energy now, hot water, scenes, switches, appliances, notifications, waste collection |
| **Energy** (Energie) | PV, battery, grid, 3D yearly skyline, wallboxes with solar charging |
| **Heating** (Heizung) | Hot-water tank, circulation pump, heating circuit, rooms |
| **Appliances** (Geräte) | Washing machine, dryer, dishwasher, Echo speakers |
| **Driveway** (Einfahrt) | Camera with motion pop-up, cars, logbook, garage, visitors, waste calendar with fee calculator |
| **House** (Haus) | Isometric 3D model of all floors with every device, device list (Shelly, Zigbee, WLED) |
| **Rooms** (Zimmer) | Each room in 3D with lights, heating, motion sensors; edit mode to move furniture, windows, doors and lights |

| | |
|---|---|
| ![Home](screenshots/zuhause.png) | ![Driveway](screenshots/einfahrt.png) |
| ![House](screenshots/haus.png) | ![Room](screenshots/zimmer.png) |
| ![Energy](screenshots/energie.png) | ![Light theme](screenshots/start-hell.png) |

Light and dark follow the system setting and can be toggled top right. On a wall tablet there is a screensaver, a night mode and pop-ups for calls and motion.

## Quick start

```bash
python3 build.py                                   # builds all pages into docs/
python3 -m http.server 8765 --directory docs       # then open http://localhost:8765
bash .claude/skills/glashaus/check.sh              # checks syntax and leftover placeholders
```

`docs/` is already built and served by GitHub Pages as the [live demo](https://djlex83.github.io/glashaus-vis2/).

## Structure

```
build.py            assembles src/ into standalone pages in docs/
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

## Use your own house

1. **Floor plan:** `PLAN` in `src/common.js`. Per floor an outline (`foot`) and rooms as polygons in metres (`p`), plus a unit `u` (`H` main household, `O` second flat, `S` shared, `X` outdoors).
2. **Rooms:** `ZC` in `src/rooms.js`. Lights, radiators, sensors, windows, doors and furniture, positioned as fractions `u/v` of the room or as wall + position (`wall: 'n'|'e'|'s'|'w'`, `t`). In the edit mode of the Rooms page everything can be dragged and copied as JSON.
3. **Devices in the house model:** `DEV` in `src/haus.html` (room `r`, position `uv`, icon, data point), device list `INV`.
4. **Street view:** `ART.zuhause` in `src/common.js` draws the front elevation in metres via `M(x, y)`.
5. **Data points:** enter your own ioBroker IDs in the “In VIS 2 übernehmen” tables.

## Developing with Claude Code

[`.claude/skills/glashaus/SKILL.md`](.claude/skills/glashaus/SKILL.md) is a skill (in German) that explains to Claude Code how the project is structured, how to build, check and test it, and which design and privacy rules apply. Claude Code loads it automatically when working in this folder.

## Privacy

This repository deliberately contains **no real house**: floor plan, street view, names, places, waste collection dates, fees and all device IDs are invented or replaced. If you adapt it for your own home, do the same before publishing (see the privacy section in the skill).

## Contributing

Anyone is welcome to fork the project, change it and propose improvements as a pull request, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT, see [LICENSE](LICENSE). Fonts: Geist and Instrument Serif via Google Fonts (SIL Open Font License).
