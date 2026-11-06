# Launcher fonts

The two faces `app/launcher/launcher.css` loads from disk, so the launcher renders before it knows whether there is a network. Each file is the Google Fonts Latin subset, byte for byte as served (verified 2026-11-07). `test/tooling/da8_launcher.test.js` checks each file against its sha256 below.

| File | Family | Source | Licence | sha256 |
|---|---|---|---|---|
| `Jacquard12-latin.woff2` | Jacquard 12 | [Google Fonts](https://fonts.googleapis.com/css2?family=Jacquard+12), `https://fonts.gstatic.com/s/jacquard12/v8/vm8ydRLuXETEweL79J4rGf3OWHs.woff2` | OFL 1.1, `OFL-Jacquard12.txt` | `41e240a6612fc41979467e614efb14ae2647a7cfb988cee032fdfcc3cd63cac5` |
| `PixelifySans-latin.woff2` | Pixelify Sans (variable, weight 400-700) | [Google Fonts](https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700), `https://fonts.gstatic.com/s/pixelifysans/v3/CHylV-3HFUT7aC4iv1TxGDR9Jn0Eiw.woff2` | OFL 1.1, `OFL-PixelifySans.txt` | `4a5633a0c9c1b73abd133a56d3716c2d8df2ed03cb987346f72194aeb224f382` |

Upstream projects: [Soft Type Jacquard](https://github.com/scfried/soft-type-jacquard), [Pixelify Sans](https://github.com/eifetx/Pixelify-Sans).

To update a face, download the new Latin subset from the CSS URL above, replace the file, and update its row.
