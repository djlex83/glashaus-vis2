#!/bin/bash
# Prüft jede gebaute Glashaus-Seite: alle <script>-Blöcke müssen sich parsen lassen,
# und es dürfen keine unersetzten Platzhalter (__URL_…__, /*COMMON_JS*/ …) übrig sein.
# Geprüft werden docs/ (Deutsch) und docs/en/ (Englisch, muss lang="en" haben und genauso viele Seiten).
DIST="$(cd "$(dirname "$0")/../../../docs" && pwd)"
fail=0
for f in "$DIST"/*.html "$DIST"/en/*.html; do
  node -e '
    const fs = require("fs"), f = process.argv[1], h = fs.readFileSync(f, "utf8");
    const name = f.split("/").slice(-2).join("/").replace(/^docs\//, "");
    let i = 0, bad = 0;
    for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      try { new Function(m[1]); } catch (e) { console.log(name, "Skript", i, e.message); bad = 1; }
      i++;
    }
    const left = h.match(/__URL_[A-Z]+__|\/\*(COMMON|SCULPTURE|SKYLINE|BASE|ROOMS)_(JS|CSS)\*\/|<!--(SPRITE|LANG)-->/g);
    if (left) { console.log(name, "Platzhalter übrig:", [...new Set(left)].join(", ")); bad = 1; }
    const lang = (h.match(/<html lang="(\w+)"/) || [])[1], want = f.includes("/en/") ? "en" : "de";
    if (lang !== want) { console.log(name, "lang=" + lang + ", erwartet " + want); bad = 1; }
    process.exit(bad);
  ' "$f" || fail=1
done
de=$(ls "$DIST"/*.html | wc -l | tr -d ' '); en=$(ls "$DIST"/en/*.html 2>/dev/null | wc -l | tr -d ' ')
[ "$de" = "$en" ] || { echo "docs/en/ hat $en Seiten, docs/ hat $de"; fail=1; }
[ $fail = 0 ] && echo "Alle Seiten ok: $de deutsch, $en englisch"
exit $fail
