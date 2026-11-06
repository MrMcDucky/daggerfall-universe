// ARENA2-HTML: a host with an SPA fallback (`vite preview`) answers a missing ARENA2 file with its page and a 200. The
// data seam takes that as no file, so the game asks for the folder instead of parsing HTML as game data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getBytes } from '../../src/scenes/dataSource.js';

const answer = (type, body = 'BYTES') => async () => ({
  ok: true,
  status: 200,
  headers: { get: (h) => (h.toLowerCase() === 'content-type' ? type : null) },
  arrayBuffer: async () => new TextEncoder().encode(body).buffer,
});

test('ARENA2-HTML: a web page in answer is no file; any other type is (mutants: html taken as data; every 200 refused)', async () => {
  const real = globalThis.fetch;
  try {
    globalThis.fetch = answer('text/html; charset=utf-8', '<!doctype html>');
    await assert.rejects(getBytes('HTMLPAGE.BSA'), /a web page, not the file/);
    globalThis.fetch = answer('application/octet-stream');
    assert.equal(new TextDecoder().decode(await getBytes('OCTET.BSA')), 'BYTES');
    globalThis.fetch = answer(null);
    assert.equal(new TextDecoder().decode(await getBytes('UNTYPED.BSA')), 'BYTES', 'a server that names no type still serves');
  } finally {
    globalThis.fetch = real;
  }
});
