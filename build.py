"""Setzt die Glashaus-Seiten aus src/ zu je einer eigenständigen HTML-Datei zusammen.
Aufruf: python3 build.py            (alle Seiten)
        python3 build.py haus zimmer (nur diese)
Ergebnis landet in docs/ (so kann GitHub Pages es direkt ausliefern); alles ist inline, ohne Build-Werkzeuge."""
import pathlib, sys

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src"
DIST = HERE / "docs"
PAGES = ["zuhause", "energie", "heizung", "geraete", "einfahrt", "haus", "zimmer"]

def out_name(page):
    return "index.html" if page == "zuhause" else f"{page}.html"

SITE = "https://djlex83.github.io/glashaus-vis2/"
DESC = ("Design-Dashboard für ioBroker VIS 2: Milchglas-Kacheln, Partikel-Motive, 3D-Hausmodell, Zimmer, "
        "Energie-Skyline und Tablet-Modus. Demo mit erfundenem Beispielhaus.")

# Links zwischen den Seiten (Platzhalter __URL_<SEITE>__ in den Quellen)
URLS = {p.upper(): out_name(p) for p in PAGES}

def build(page):
    html = (SRC / f"{page}.html").read_text(encoding="utf-8")
    for key, url in URLS.items():
        html = html.replace(f"__URL_{key}__", url)
    parts = {
        "/*BASE_CSS*/": "base.css",
        "<!--SPRITE-->": "sprite.html",
        "/*COMMON_JS*/": "common.js",
        "/*SCULPTURE_JS*/": "sculpture.js",
        "/*SKYLINE_JS*/": "skyline.js",
        "/*ROOMS_JS*/": "rooms.js",
    }
    for marker, name in parts.items():
        html = html.replace(marker, (SRC / name).read_text(encoding="utf-8"))
    if not html.lstrip().lower().startswith("<!doctype"):
        html = '<!doctype html>\n<html lang="de">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + html
    meta = (f'<meta name="description" content="{DESC}">\n'
            f'<meta property="og:title" content="Glashaus · ioBroker VIS 2 Dashboard">\n'
            f'<meta property="og:description" content="{DESC}">\n'
            f'<meta property="og:image" content="{SITE}og.png">\n<meta name="twitter:card" content="summary_large_image">\n')
    html = html.replace("<title>", meta + "<title>", 1)
    DIST.mkdir(exist_ok=True)
    out = DIST / out_name(page)
    out.write_text(html, encoding="utf-8")
    print(out.name, f"{out.stat().st_size / 1024:.0f} KB")

for p in sys.argv[1:] or PAGES:
    build(p)
