# Mitmachen · Contributing

**Deutsch** – Verbesserungen sind willkommen: neue Kacheln, Seiten, Motive, Übersetzungen, Fehlerbehebungen.

1. Repository forken und einen eigenen Branch anlegen.
2. Nur in `src/` arbeiten, dann `python3 build.py` und `bash .claude/skills/glashaus/check.sh`.
3. Im Browser testen (`python3 -m http.server 8765 --directory docs`), hell und dunkel, Desktop und Handy; die Konsole muss fehlerfrei sein.
4. Pull Request mit kurzer Beschreibung und, wenn sich etwas Sichtbares ändert, einem Screenshot.

Bitte beachten:
- **Keine persönlichen Daten** im Pull Request: keine echten Namen, Adressen, Grundrisse, Telefonnummern, Kennzeichen, IP-Adressen oder Geräte-IDs. Beispieldaten erfinden.
- Kein fremder Code ohne passende Lizenz.
- Stil beibehalten: Design-Tokens aus `base.css`, keine Frameworks, jede Seite bleibt eine eigenständige Datei.

Fragen und Ideen gern als Issue oder in den Discussions.

---

**English** – Improvements are welcome: new tiles, pages, line art, translations, bug fixes.

1. Fork the repository and create a branch.
2. Edit only `src/`, then run `python3 build.py` and `bash .claude/skills/glashaus/check.sh`.
3. Test in the browser (`python3 -m http.server 8765 --directory docs`), light and dark, desktop and mobile; the console must be free of errors.
4. Open a pull request with a short description and a screenshot for visible changes.

Please note:
- **No personal data** in pull requests: no real names, addresses, floor plans, phone numbers, licence plates, IP addresses or device IDs. Use invented sample data.
- No third-party code without a compatible licence.
- Keep the style: design tokens from `base.css`, no frameworks, every page stays a single self-contained file.

Questions and ideas are welcome as issues or in Discussions.
