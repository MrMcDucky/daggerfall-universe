// The test processes read files git stores with LF as LF, whatever the checkout's line endings
// (tools/lib/lfReads.mjs, tools/lib/lfReadsPreload.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { crlfCheckouts, lfReads, PRELOAD } from '../../tools/lib/lfReads.mjs';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('LF-READS: only files stored with LF and checked out with CRLF are named', () => {
  const out = [
    'i/lf    w/crlf  attr/                 \tsrc/a.js',
    'i/lf    w/lf    attr/                 \tsrc/b.js',
    'i/crlf  w/crlf  attr/                 \tsrc/c.js',
    'i/-text w/-text attr/                 \tpublic/d.png',
    'i/lf    w/crlf  attr/text eol=crlf    \tsrc/e f.js',
  ].join('\0');
  assert.deepEqual(crlfCheckouts(`${out}\0`), ['src/a.js', 'src/e f.js']);
  assert.deepEqual(crlfCheckouts(''), []);
});

test('LF-READS: the preload is handed on only when there are such files, once, beside what NODE_OPTIONS held', () => {
  const none = {};
  assert.equal(lfReads('/r', none, () => 'i/lf    w/lf    attr/ \tsrc/a.js\0'), false);
  assert.deepEqual(none, {}, 'an LF checkout: nothing changes');
  const broken = {};
  assert.equal(lfReads('/r', broken, () => { throw new Error('no git'); }), false);
  assert.deepEqual(broken, {}, 'no git: nothing changes');
  const env = { NODE_OPTIONS: '--max-old-space-size=4096' };
  const git = () => 'i/lf    w/crlf  attr/ \tsrc/a.js\0';
  assert.equal(lfReads('/r', env, git), true);
  assert.equal(lfReads('/r', env, git), true);
  assert.equal(env.NODE_OPTIONS, `--max-old-space-size=4096 --import=${PRELOAD}`, 'kept, and added once');
  assert.deepEqual(JSON.parse(readFileSync(env.LF_READS, 'utf8')), { root: '/r', files: ['src/a.js'] });
});

test('LF-READS: every fs read of a named file answers LF; an unnamed file keeps its CRLF', () => {
  const dir = mkdtempSync(join(tmpdir(), 'lf-reads-'));
  try {
    writeFileSync(join(dir, 'a.txt'), 'one\r\ntwo\r\n');
    writeFileSync(join(dir, 'b.txt'), 'one\r\ntwo\r\n');
    writeFileSync(join(dir, 'list.json'), JSON.stringify({ root: dir, files: ['a.txt'] }));
    writeFileSync(join(dir, 'probe.mjs'), `
      import fs, { readFileSync } from 'node:fs';
      import { readFile } from 'node:fs/promises';
      import { pathToFileURL } from 'node:url';
      const a = ${JSON.stringify(join(dir, 'a.txt'))}, b = ${JSON.stringify(join(dir, 'b.txt'))};
      const cb = await new Promise((ok) => fs.readFile(a, 'utf8', (e, s) => ok(s)));
      console.log(JSON.stringify({
        utf8: readFileSync(a, 'utf8'), opts: readFileSync(a, { encoding: 'utf8' }), url: readFileSync(pathToFileURL(a), 'utf8'),
        buffer: readFileSync(a).toString('latin1'), base64: readFileSync(a, 'base64'),
        promise: await readFile(a, 'utf8'), cb, other: readFileSync(b, 'utf8'),
      }));`);
    const r = spawnSync(process.execPath, [join(dir, 'probe.mjs')], {
      encoding: 'utf8',
      env: { ...process.env, NODE_OPTIONS: `--import=${PRELOAD}`, LF_READS: join(dir, 'list.json') },
    });
    assert.equal(r.status, 0, r.stderr);
    const got = JSON.parse(r.stdout);
    for (const k of ['utf8', 'opts', 'url', 'buffer', 'promise', 'cb']) assert.equal(got[k], 'one\ntwo\n', k);
    assert.equal(got.base64, Buffer.from('one\ntwo\n').toString('base64'));
    assert.equal(got.other, 'one\r\ntwo\r\n', 'not named: as it is');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('LF-READS: both ways the suite is run hand it on', () => {
  for (const f of ['tools/testShards.mjs', 'tools/testChanged.mjs']) assert.match(read(f), /\n {2}lfReads\(ROOT\);\n {2}return runTests\(/, f);
});
