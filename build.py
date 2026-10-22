"""Setzt die Glashaus-Seiten aus src/ zu je einer eigenständigen HTML-Datei zusammen.
Aufruf: python3 build.py                      (alle Seiten, Deutsch und Englisch)
        python3 build.py haus zimmer          (nur diese)
        python3 build.py --lang en            (nur Englisch)
        python3 build.py --lang en --missing  (Englisch bauen und deutsche Reste + ungenutzte Einträge auflisten)
Ergebnis landet in docs/ bzw. docs/en/ (so kann GitHub Pages es direkt ausliefern); alles ist inline, ohne Build-Werkzeuge.

Übersetzung beim Bauen: src/i18n/<lang>.json
  "text"    ganze Textstücke: Text zwischen zwei Tags, Wert eines Text-Attributs (title, aria-label, data-… ),
            Inhalt eines JS-String-Literals bzw. das Stück zwischen Tags darin. Leerraum wird zusammengefasst.
  "pages"   wie "text", nur für eine Seite (überschreibt "text")
  "phrases" Teilstücke, die in sonst unübersetzten Stücken ersetzt werden (ganze Wörter, längste zuerst)
  "raw"     exakte Ersetzungen im Quelltext vor allem anderen (Locale, Wortstellung, Arrays)
Code, Kommentare, Regex, CSS, ids, Klassen und Datenpunkte bleiben unberührt."""
import json, pathlib, re, sys

HERE = pathlib.Path(__file__).parent
SRC = HERE / "src"
DIST = HERE / "docs"
PAGES = ["zuhause", "energie", "heizung", "geraete", "einfahrt", "haus", "zimmer"]
LANGS = ["de", "en"]

def out_name(page):
    return "index.html" if page == "zuhause" else f"{page}.html"

SITE = "https://djlex83.github.io/glashaus-vis2/"
DESC = {
    "de": ("Design-Dashboard für ioBroker VIS 2: Milchglas-Kacheln, Partikel-Motive, 3D-Hausmodell, Zimmer, "
           "Energie-Skyline und Tablet-Modus. Demo mit erfundenem Beispielhaus."),
    "en": ("Design dashboard for ioBroker VIS 2: frosted-glass tiles, particle artwork, 3D house model, rooms, "
           "energy skyline and tablet mode. Demo with a fictional sample house."),
}

# Links zwischen den Seiten (Platzhalter __URL_<SEITE>__ in den Quellen)
URLS = {p.upper(): out_name(p) for p in PAGES}

def lang_dir(lang):
    return "" if lang == "de" else f"{lang}/"

def lang_switch(page, lang):
    """Umschalter DE | EN für den Platzhalter <!--LANG--> in der Navigation."""
    up = "../" if lang != "de" else ""
    links = []
    for l in LANGS:
        cur = ' aria-current="true"' if l == lang else ""
        links.append(f'<a href="{up}{lang_dir(l)}{out_name(page)}" hreflang="{l}" lang="{l}" data-lang{cur}>{l.upper()}</a>')
    return '<li class="lang">' + '<span aria-hidden="true">|</span>'.join(links) + "</li>"

# ---------- Übersetzung: Markup und JS-Literale getrennt behandeln ----------
# Attribute, deren Werte nie Oberflächentext sind
SKIP_ATTR = {"class", "id", "href", "src", "style", "d", "points", "viewbox", "transform", "type", "role", "xmlns",
             "fill", "stroke", "width", "height", "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "x2", "y1", "y2",
             "name", "rel", "lang", "charset", "for", "tabindex", "draggable", "hreflang", "property", "media",
             "opacity", "offset", "stop-color", "preserveaspectratio", "autocomplete", "inputmode",
             "min", "max", "step", "value", "pattern", "target", "loading", "decoding", "sizes", "srcset", "accept"}
TEXT_ARIA = {"aria-label", "aria-description", "aria-roledescription", "aria-valuetext"}
TAG = re.compile(r"<[A-Za-z/!][^<>]*>")
ATTR = re.compile(r'([\w:-]+)(\s*=\s*)("([^"]*)"|\'([^\']*)\')')
SCRIPT = re.compile(r"(<script[^>]*>)([\s\S]*?)(</script>)|<style[^>]*>[\s\S]*?</style>", re.I)
KW_REGEX = {"return", "typeof", "case", "in", "of", "delete", "void", "throw", "new", "else", "do", "yield", "await"}

def tag_sub(tag, fn):
    def rep(m):
        name = m.group(1).lower()
        if name in SKIP_ATTR or name.startswith("on") or (name.startswith("aria-") and name not in TEXT_ARIA):
            return m.group(0)
        q = m.group(3)[0]
        return m.group(1) + m.group(2) + q + fn(m.group(4) if q == '"' else m.group(5), "attr") + q
    return ATTR.sub(rep, tag)

def markup_sub(s, fn, kind="text"):
    out, i = [], 0
    for m in TAG.finditer(s):
        out += [fn(s[i:m.start()], kind), tag_sub(m.group(0), fn)]
        i = m.end()
    out.append(fn(s[i:], kind))
    return "".join(out)

def js_sub(src, fn, i=0, in_tpl=False):
    """Geht durch JavaScript und ruft fn für den Inhalt jedes String- und Template-Literals auf.
    Kommentare, Regex-Literale und Code bleiben, wie sie sind. Gibt (text, ende) zurück."""
    out, n, depth, prev = [], len(src), 0, ""
    while i < n:
        c, nx = src[i], src[i + 1:i + 2]
        if c == "/" and nx in "/*" and nx:
            j = src.find("\n" if nx == "/" else "*/", i + 2)
            j = n if j < 0 else (j if nx == "/" else j + 2)
            out.append(src[i:j]); i = j; continue
        if c in "\"'":
            j = i + 1
            while j < n and src[j] != c and src[j] != "\n":
                j += 2 if src[j] == "\\" else 1
            out.append(c + markup_sub(src[i + 1:j], fn, "js") + c); i = j + 1; prev = "lit"; continue
        if c == "`":
            j, seg, buf = i + 1, i + 1, ["`"]
            while j < n and src[j] != "`":
                if src[j] == "\\": j += 2; continue
                if src[j:j + 2] == "${":
                    buf.append(markup_sub(src[seg:j], fn, "js"))
                    sub, j = js_sub(src, fn, j + 2, True)
                    buf += ["${", sub, "}"]
                    j += 1; seg = j; continue
                j += 1
            buf += [markup_sub(src[seg:j], fn, "js"), "`"]
            out.append("".join(buf)); i = j + 1; prev = "lit"; continue
        if c == "/" and (prev == "" or prev in KW_REGEX or (len(prev) == 1 and prev in "(,=:[!&|?{};+-*%<>~^")):
            j, cls = i + 1, False
            while j < n and src[j] != "\n":
                if src[j] == "\\": j += 2; continue
                if src[j] == "[": cls = True
                elif src[j] == "]": cls = False
                elif src[j] == "/" and not cls: break
                j += 1
            j += 1
            while j < n and src[j].isalpha(): j += 1
            out.append(src[i:j]); i = j; prev = "lit"; continue
        if in_tpl and c in "{}":
            if c == "}" and depth == 0: return "".join(out), i
            depth += 1 if c == "{" else -1
        if c.isalnum() or c in "_$":
            j = i
            while j < n and (src[j].isalnum() or src[j] in "_$"): j += 1
            word = src[i:j]; out.append(word); i = j
            prev = word if word in KW_REGEX else "id"
            continue
        if not c.isspace(): prev = c
        out.append(c); i += 1
    return "".join(out), i

def page_sub(html, fn):
    """fn(stück, art) mit art = text | attr | js; Stile bleiben unberührt."""
    out, i = [], 0
    for m in SCRIPT.finditer(html):
        out.append(markup_sub(html[i:m.start()], fn))
        out.append(m.group(1) + js_sub(m.group(2), fn)[0] + m.group(3) if m.group(1) else m.group(0))
        i = m.end()
    out.append(markup_sub(html[i:], fn))
    return "".join(out)

UNITS = r"(°C|K|kWh|kW|W|mV|V|A|%|€|ct|m²|m|km|h|min|s|l|L|dBm|bar|Hz)"

def de_num(s):
    """Zahlen im Markup ohne weiteren Text: 12,5 → 12.5, 1.234 → 1,234, „· 22,6 °C“ → „· 22.6 °C“, 2,38 € → €2.38"""
    core = s.strip()
    m = re.fullmatch(r"(·\s*)?([−-]?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?)(\s*" + UNITS + r")?", core)
    if not m: return s
    num = m.group(2).replace(".", "\x00").replace(",", ".").replace("\x00", ",")
    unit = m.group(3) or ""
    new = (m.group(1) or "") + ("€" + num if unit.strip() == "€" else num + unit)
    return s.replace(core, new)

class Translator:
    def __init__(self, lang):
        d = json.loads((SRC / "i18n" / f"{lang}.json").read_text(encoding="utf-8"))
        self.d, self.used = d, set()
        self.raw = d.get("raw", {})
        self.phr = d.get("phrases", {})
        keys = sorted(self.phr, key=len, reverse=True)
        self.rx = re.compile("|".join(r"(?<![\w.])" + re.escape(k) + r"(?!\w)(?!\.\w)" for k in keys)) if keys else None

    def page(self, html, page):
        for k, v in self.raw.items():
            if k in html: html = html.replace(k, v); self.used.add(("raw", k))
        text = {**self.d.get("text", {}), **self.d.get("pages", {}).get(page, {})}
        def fn(s, kind):
            core = " ".join(s.split())
            if not core: return s
            if core in text:
                self.used.add(("pages", page, core) if core in self.d.get("pages", {}).get(page, {}) else ("text", core))
                return s[:len(s) - len(s.lstrip())] + text[core] + s[len(s.rstrip()):]
            if self.rx:
                def rep(m):
                    self.used.add(("phrases", m.group(0))); return self.phr[m.group(0)]
                s = self.rx.sub(rep, s)
            return de_num(s) if kind == "text" else s
        return page_sub(html, fn)

    def unused(self):
        d = self.d
        out = [("raw", k) for k in d.get("raw", {})] + [("text", k) for k in d.get("text", {})] + \
              [("phrases", k) for k in d.get("phrases", {})] + \
              [("pages", p, k) for p, t in d.get("pages", {}).items() for k in t]
        return [u for u in out if u not in self.used]

# Typische deutsche Wörter für die Restesuche (--missing)
DE_WORDS = set("""der die das den dem des und oder mit ohne für von vom zum zur im am an auf aus bei bis seit nach vor über
unter ist sind war wird werden wurde nicht kein keine noch schon nur auch heute gestern morgen uhr tage tagen tag woche
monat jahr jetzt wieder läuft fertig offen zu ein eine einen einem einer alle alles wenn dann sobald hier dort wie was
welche diese dieser dieses neu neue neuer bitte leer voll warm kalt aktiv aus an ab""".split())

def german_left(html):
    found = {}
    def fn(s, kind):
        core = " ".join(s.split())
        words = re.findall(r"[A-Za-zÄÖÜäöüß]+", core)
        if core and (re.search(r"[äöüÄÖÜß]", core) or any(w.lower() in DE_WORDS for w in words if len(words) > 1 or kind != "js")):
            found.setdefault(core, kind)
        return s
    page_sub(html, fn)
    return found

def build(page, lang, tr=None):
    html = (SRC / f"{page}.html").read_text(encoding="utf-8")
    for key, url in URLS.items():
        html = html.replace(f"__URL_{key}__", url)
    html = html.replace("<!--LANG-->", lang_switch(page, lang))
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
    if tr: html = tr.page(html, page)
    if not html.lstrip().lower().startswith("<!doctype"):
        html = f'<!doctype html>\n<html lang="{lang}">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' + html
    alt = "".join(f'<link rel="alternate" hreflang="{l}" href="{SITE}{lang_dir(l)}{out_name(page)}">\n' for l in LANGS)
    meta = (f'<meta name="description" content="{DESC[lang]}">\n'
            f'<meta property="og:title" content="Glashaus · ioBroker VIS 2 Dashboard">\n'
            f'<meta property="og:description" content="{DESC[lang]}">\n'
            f'<meta property="og:image" content="{SITE}og.png">\n<meta name="twitter:card" content="summary_large_image">\n' + alt)
    html = html.replace("<title>", meta + "<title>", 1)
    dist = DIST / lang_dir(lang)
    dist.mkdir(exist_ok=True)
    out = dist / out_name(page)
    out.write_text(html, encoding="utf-8")
    print(lang_dir(lang) + out.name, f"{out.stat().st_size / 1024:.0f} KB")
    return html

if __name__ == "__main__":
    args = sys.argv[1:]
    langs = LANGS
    if "--lang" in args:
        i = args.index("--lang"); langs = [args[i + 1]]; del args[i:i + 2]
    missing = "--missing" in args
    args = [a for a in args if a != "--missing"]
    for lang in langs:
        tr = Translator(lang) if lang != "de" else None
        left = {}
        for p in args or PAGES:
            html = build(p, lang, tr)
            if missing and tr:
                for k, v in german_left(html).items(): left.setdefault(k, (v, p))
        if missing and tr:
            print(f"\n{len(left)} Stücke sehen noch deutsch aus:")
            for k, (kind, p) in left.items(): print(f"  [{p}:{kind}] {k}")
            if not args:
                un = tr.unused()
                print(f"\n{len(un)} Einträge in {lang}.json wurden nicht verwendet:")
                for u in un: print("  ", *u)
