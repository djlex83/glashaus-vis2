#!/bin/bash
# Prüft jede gebaute Glashaus-Seite: alle <script>-Blöcke müssen sich parsen lassen,
# und es dürfen keine unersetzten Platzhalter (__URL_…__, /*COMMON_JS*/ …) übrig sein.
DIST="$(cd "$(dirname "$0")/../../../docs" && pwd)"
fail=0
for f in "$DIST"/*.html; do
  node -e '
    const fs = require("fs"), f = process.argv[1], h = fs.readFileSync(f, "utf8");
    let i = 0, bad = 0;
    for (const m of h.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      try { new Function(m[1]); } catch (e) { console.log(f.split("/").pop(), "Skript", i, e.message); bad = 1; }
      i++;
    }
    const left = h.match(/__URL_[A-Z]+__|\/\*(COMMON|SCULPTURE|SKYLINE|BASE)_(JS|CSS)\*\/|<!--SPRITE-->/g);
    if (left) { console.log(f.split("/").pop(), "Platzhalter übrig:", [...new Set(left)].join(", ")); bad = 1; }
    process.exit(bad);
  ' "$f" || fail=1
done
[ $fail = 0 ] && echo "Alle Seiten ok: $(ls "$DIST"/*.html | wc -l | tr -d ' ')"
exit $fail
