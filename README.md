# DF World

This is a fork of [DFO Online](https://github.com/Lattymoy/daggerfall-js-source). Currently no official server is hosted, and no pre-built release is distributed.

DF World is an independent, unofficial project. It is not affiliated with or endorsed by Bethesda Softworks or
ZeniMax Media. The Elder Scrolls and Daggerfall are trademarks of ZeniMax Media Inc.

## Reporting a bug

Open an issue here. Report an exploit or a security problem privately, as `SECURITY.md` says.

## Building this edition

Node 20.19+ or 22.12+.

- `npm ci`
- `npm run dev`: the development server
- `npm run build`: a production build

The game reads your own copy of The Elder Scrolls II: Daggerfall (its `ARENA2` folder), which is never committed.
`sh tools/fetch-data.sh <folder>` downloads the free release of it into that folder.
