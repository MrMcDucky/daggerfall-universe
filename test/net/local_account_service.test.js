// LOCAL-SERVICE: the account-service override takes https anywhere and plain http on this machine only, so a local
// `wrangler dev` service can be used from the browser; any other base falls back to the default.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serviceBase, DEFAULT_ACCOUNT_SERVICE, SERVICE_KEY } from '../../src/net/accountClient.js';

const storage = (v) => ({ getItem: (k) => (k === SERVICE_KEY ? v : null) });

test('LOCAL-SERVICE: https anywhere and http on localhost are taken; any other http host, or a lookalike, is not (mutants: http taken anywhere; localhost refused)', () => {
  for (const ok of [
    'https://accounts.example.com',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
    'http://localhost',
    'http://127.0.0.1:8787/base',
  ]) assert.equal(serviceBase(storage(ok)), ok, ok);
  for (const bad of [
    'http://example.com',
    'http://localhost.example.com',
    'http://localhost@example.com',
    'http://127.0.0.1.example.com:8787',
    'http://192.168.1.10:8787',
    'ftp://localhost',
    'localhost:8787',
    '',
    null,
  ]) assert.equal(serviceBase(storage(bad)), DEFAULT_ACCOUNT_SERVICE, String(bad));
});
