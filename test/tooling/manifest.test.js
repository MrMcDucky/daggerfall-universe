// The manifest gate: test file names stay unique (comments and mutant records name a test by its file name alone, so
// two files with one name would make every such mention ambiguous).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('manifest: no two test files share a name - a mention names a test by its file name alone', () => {
  const names = readdirSync(join(root, 'test'), { recursive: true })
    .filter((path) => path.endsWith('.test.js'))
    .map((path) => path.split(/[\\/]/).pop());
  const twice = names.filter((name, i) => names.indexOf(name) !== i);
  assert.ok(names.length > 1000, `only ${names.length} test files found - the walk is reading the wrong tree`);
  assert.deepEqual(twice, [], 'two test files share a name - a mention of it could mean either');
});
