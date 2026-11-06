// D1-NEAR (2026-10-12, from play: "I notice a lot of UI elements that utilize the server (like searching players, the
// guild menu, etc) take an insane amount of time to load") - THE ACCOUNT WORKER RUNS BESIDE ITS DATABASE'S PRIMARY, BY
// NAME. SCALE1 left it to Smart Placement, which on 2026-10-12 ran it in Sydney while the primary stands in western
// North America: every statement on the primary paid the Pacific, ~150-180 ms each, thirteen or fourteen of them for a
// look at the Guild tab. And every deploy says where the Worker answers from, what a statement costs it there and where
// D1 says its primary is, so the place is read, never taken on its word again. Audited; its own pins:
// test/server/audit_d1near.test.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, STEP, workflow, stepRun, runStep, d1Answer, PLAN_UP, PLAN_DOWN } from '../d1nearStep.mjs';

const src = (p) => readFileSync(join(ROOT, p), 'utf8');

/** A TOML table's keys and their string values, its comments and blank lines dropped, up to the next table. */
function tomlTable(toml, name) {
  const lines = toml.split('\n');
  const at = lines.findIndex((l) => l.trim() === `[${name}]`);
  assert.ok(at >= 0, `no [${name}] table`);
  const out = {};
  for (const l of lines.slice(at + 1)) {
    const t = l.trim();
    if (t.startsWith('[')) break;
    if (!t || t.startsWith('#')) continue;
    const kv = /^([A-Za-z_][\w-]*)\s*=\s*"([^"]*)"\s*(?:#.*)?$/.exec(t);
    assert.ok(kv, `[${name}] holds a line this pin cannot read: ${t}`);
    out[kv[1]] = kv[2];
  }
  return out;
}

test('D1-NEAR the placement: the account Worker\'s one [placement] table names its region alone - the region the record names - never `mode = "smart"`; the comment above it is D1-NEAR\'s own (mutants: SCALE1\'s smart placement back; the Worker placed in Sydney; the table dropped; SCALE1\'s comment back)', () => {
  const toml = src('server-account/wrangler.toml');
  assert.equal(toml.match(/^\[placement\]$/gm)?.length ?? 0, 1, 'one [placement] table');
  const placement = tomlTable(toml, 'placement');
  // `region` alone: `mode`, `host` and `hostname` are Cloudflare's other kinds of placement, each exclusive of it -
  // Smart Placement is the one that ran the Worker in Sydney
  assert.deepEqual(placement, { region: 'aws:us-west-1' });
  for (const l of toml.split('\n')) if (!l.trim().startsWith('#')) assert.doesNotMatch(l, /^\s*mode\s*=\s*"smart"/, 'no live line asks for Smart Placement');
});

test('D1-NEAR the deploy says where the Worker answers from, what a statement costs it there and where the primary is: after the health check, five answers\' `cf-placement` - an HTTP/2 header in lower case and an HTTP/1.1 one capitalised alike, an answer without it `none` - the median one-statement read on the primary less the median health, the deploy\'s own base asked, and D1\'s own word on the data centre its primary answered from; a REPORT, never a gate: nothing reached, it ends green, its cost unmeasured and D1 unsaid (mutants: the summary unwritten; the header read case-sensitively; an answer without the header unsaid; the cost not less the health; the slowest answer taken for the middle)', () => {
  const wf = workflow();
  assert.ok(stepRun(wf, STEP).includes('worker="${{ steps.deploy.outputs.base }}"'), 'the host the deploy step said, never typed');
  // the job's own shell (`defaults: run: shell: bash`) - GitHub runs it `bash --noprofile --norc -eo pipefail`
  assert.match(wf, /\n {4}defaults:\n {6}run:\n {8}shell: bash\n/);

  const up = runStep({ plan: PLAN_UP, d1: d1Answer('LAX', 'WNAM', true) });
  assert.equal(up.status, 0, up.stderr);
  assert.deepEqual(up.asked.map((a) => `${a.kind} ${a.url}`), Array.from({ length: 5 }, () => ['health https://accounts.example/v1/health', 'read https://accounts.example/v1/seats/sieges/live']).flat(),
    'five of each from the deployed Worker, in turn');
  // the middle of 0.079 0.080 0.081 0.082 0.300 is 81 ms, of 0.084 0.085 0.086 0.087 0.900 is 86: the statement 5 ms
  const cost = 'one statement on the primary costs it ~5 ms (medians: /v1/seats/sieges/live 86 ms of 5 answers, /v1/health 81 ms of 5)';
  assert.ok(up.stdout.includes(`cf-placement over five answers: remote-SJC remote-SJC remote-SJC local-SJC none; ${cost}; D1's primary answered from LAX (WNAM)\n`), up.stdout);
  assert.match(up.summary, /^### Where the account Worker runs\n/m);
  assert.ok(up.summary.includes('`cf-placement` over five answers to /v1/health: remote-SJC remote-SJC remote-SJC local-SJC none (wrangler.toml'), up.summary);
  assert.ok(up.summary.includes(`From there, ${cost} - beside the primary it is D1's own time and a short hop, across an ocean 150 ms and more.`), up.summary);
  assert.ok(up.summary.includes('D1\'s primary answered from LAX (WNAM) - wrangler.toml [placement] should name the cloud region nearest it.'), up.summary);

  const down = runStep({ plan: PLAN_DOWN });
  assert.equal(down.status, 0, `nothing reached still ends the step green: ${down.stderr}`);
  assert.equal(down.asked.length, 10);
  assert.ok(down.summary.includes('over five answers to /v1/health: none none none none none ('), down.summary);
  assert.ok(down.summary.includes('From there, one statement\'s cost unmeasured (of five, /v1/health answered 0 and /v1/seats/sieges/live 0)'), down.summary);
  assert.ok(down.summary.includes('D1 did not say where its primary is'), down.summary);
});
