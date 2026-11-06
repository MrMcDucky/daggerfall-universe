// NO-AURUM-LOOT (2026-11-06): this fork has no Aurum loot. With AURUM_LOOT off a find pays no Aurum but still counts
// toward its challenges, which pay as before, and a coffer's claim is refused and writes nothing. The fork ships it off.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { standService } from '../accountDb.mjs';
import { findPass } from '../../server-account/src/battlePass.js';
import { claimCache } from '../../server-account/src/aurumCache.js';
import { PASS_CHALLENGES, passSeasonById } from '../../src/net/battlePassLaw.js';
import { aurumLootOn } from '../../src/net/aurumLaw.js';

const S1 = passSeasonById('s1');
const IN_TREMOR = S1.fromMs + 3 * 86_400_000 + 3_600_000;   // the first stage's fourth day
const OFF = { PASS_OPEN: 'on', AURUM_OPEN: 'on', AURUM_LOOT: 'off' };

test('NO-AURUM-LOOT the switch: only "off" turns the loot off; unset is on (mutants: unset read as off; off read as on)', () => {
  assert.equal(aurumLootOn('off'), false);
  for (const v of [undefined, '', 'on', 'yes']) assert.equal(aurumLootOn(v), true, String(v));
});

test('NO-AURUM-LOOT the fork ships the loot off', () => {
  const toml = readFileSync(new URL('../../server-account/wrangler.toml', import.meta.url), 'utf8');
  assert.match(toml, /^AURUM_LOOT = "off"\r?$/m);
});

test('NO-AURUM-LOOT a find pays nothing and writes no find line; its challenge still counts and pays (mutants: the find paid; the challenge lost)', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: IN_TREMOR });
  const s = await standService(OFF);
  const me = await s.registered('Finder');
  const ctx = () => ({ db: s.env.DB, nowS: Math.floor(Date.now() / 1000) });
  const player = () => s.env.DB._raw.prepare('SELECT * FROM players WHERE id = ?').get(me.id);
  const tavern = PASS_CHALLENGES.find((c) => c.key === 'tremor-tavern');
  const t1 = await findPass(ctx(), player(), { source: 'tavern' }, OFF);
  assert.deepEqual([t1.gained, t1.found, t1.done, t1.today], [0, 0, [], 0], 'a find pays none');
  await findPass(ctx(), player(), { source: 'tavern' }, OFF);
  const t3 = await findPass(ctx(), player(), { source: 'tavern' }, OFF);
  assert.deepEqual([t3.gained, t3.found, t3.done, t3.today], [tavern.aurum, 0, ['tremor-tavern'], 0], 'the third completes the challenge: its Aurum alone');
  const kinds = s.env.DB._raw.prepare('SELECT kind, amount FROM aurum_ledger WHERE account = ? ORDER BY kind').all(me.id).map((r) => ({ ...r }));
  assert.deepEqual(kinds, [{ kind: 'challenge', amount: tavern.aurum }], 'no find line, the challenge\'s alone');
});

test('NO-AURUM-LOOT a coffer\'s claim is refused before its id is read and writes nothing (mutant: the claim paid)', async () => {
  const s = await standService(OFF);
  const me = await s.registered('Opener');
  const player = s.env.DB._raw.prepare('SELECT * FROM players WHERE id = ?').get(me.id);
  const r = await claimCache({ db: s.env.DB, nowS: Math.floor(Date.now() / 1000) }, player, { id: 'not-even-an-id' }, OFF);
  assert.deepEqual(r, { error: 'cache-closed' });
  assert.equal(s.env.DB._raw.prepare('SELECT COUNT(*) AS n FROM aurum_ledger WHERE account = ?').get(me.id).n, 0);
});
