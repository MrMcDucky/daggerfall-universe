# public/

Vite's static root. Everything here is copied into `dist/` and published with the site and the desktop app.

## What may ship here

Only files that are ours to publish:

- **No ARENA2 data.** A render of game data is game data: a screenshot, an upscale, a trace, or a repaint that keeps the
  original's shape is not allowed.
- **Our own work.** Work which the committer holds authorship of.
- **Third-party files** only under a licence that lets us publish them, with the licence and source kept beside them.

## How it is enforced

`test/tooling/doctrine.test.js` fails on any tracked file under `public/` or `src/assets/` that is not one of:

- a row in `PUBLIC_ALLOWLIST`, which states why the file is ours;
- a vendored bundle's own art, named by its manifest (`BUNDLE_ART`);

It also fails on a row whose file is gone.
