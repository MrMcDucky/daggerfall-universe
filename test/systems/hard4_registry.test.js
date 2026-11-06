// HARD4 - VENDORED WORK CARRIES ITS PROVENANCE (2026-09-15).
//
// Every directory under `vendor/` carries other people's work, and its README is the record of where the work came
// from and on what permission. These pins hold that record to the tree: every vendored directory has its README, every
// mod the player can switch on is vendored, and the READMEs whose permission line is still an unfilled prompt are
// exactly the ones listed below. An unfilled line does NOT mean the work is used without permission - the permission
// was given; what is missing is the written evidence of it. Fill one in and take its directory off the list.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

/** Every directory under vendor/. */
const vendorDirs = () => readdirSync(join(ROOT, 'vendor'), { withFileTypes: true })
  .filter((e) => e.isDirectory()).map((e) => e.name).sort();

/** The unfilled-permission prompt, as every README writes it. */
const PLACEHOLDER = /\[Mac: (?:paste|record)/;

/** The vendored directories whose README still prompts for the permission text. */
const RECORD_OPEN = Object.freeze([
  'ambient-text',
  'beautiful-cities',
  'beautiful-villages',
  'better-ambience',
  'class-skins',
  'come-sail-away',
  'daggerfall-enemy-expansion',
  'diverse-weapons',
  'dynamic-skies',
  'eye-of-the-beholder',
  'foraging',
  'grimoire-ui',
  'handheld-torches',
  'heat-haze',
  'horse-cart-and-cargo',
  'iliac-puddle-no-more',
  'immersive-footsteps',
  'immersive-travel',
  'kings-gambit',
  'low-poly-trees',
  'mudex',
  'oblivion-remaster-leveling',
  'ocean-holes',
  'pcaao',
  'physical-items',
  'roads-hazelnut',
  'roleplay-realism',
  'roleplay-realism-items',
  'sands-of-the-alikr',
  'seasons-iliac-bay',
  'shield-widget',
  'snowfall',
  'travel-options',
  'vanilla-enhanced',
  'warm-ashes-ships',
  'weapon-widget',
  'windfall',
]);

test('HARD4: every vendored directory carries its README', () => {
  const dirs = vendorDirs();
  assert.ok(dirs.length >= 14, `vendor/ has ${dirs.length} directories`);
  for (const d of dirs) assert.ok(existsSync(join(ROOT, 'vendor', d, 'README.md')), `vendor/${d}/README.md is missing`);
});

test('HARD4: the READMEs with an unfilled permission line are exactly the RECORD_OPEN list', () => {
  const open = vendorDirs().filter((d) => PLACEHOLDER.test(read(`vendor/${d}/README.md`)));
  assert.deepEqual(open.filter((d) => !RECORD_OPEN.includes(d)), [],
    'these READMEs prompt for the permission and are not listed - record the permission, or add them to RECORD_OPEN');
  assert.deepEqual(RECORD_OPEN.filter((d) => !open.includes(d)), [],
    'these READMEs have their permission recorded - take them off RECORD_OPEN');
});

test('HARD4: every player-visible mod is vendored', () => {
  // A vendor key the player can switch on in the Mods pane is someone else's work the port ships, so it must be
  // vendored with its README. `systems/modSettings.js` is where that becomes true, so that is what is read.
  const ms = read('src/systems/modSettings.js');
  const keys = [...ms.matchAll(/^ {2}'([a-zA-Z][\w-]*)':\s*Object\.freeze\(\{/gm)].map((m) => m[1]);
  assert.ok(keys.length >= 8, `only ${keys.length} vendor keys were read out of modSettings.js`);
  const dirs = vendorDirs();
  assert.deepEqual(keys.filter((k) => !dirs.includes(k)), [],
    'these mods are switchable by the player and have no vendor/ directory - a mod cannot become player-visible without its provenance written down');
});
