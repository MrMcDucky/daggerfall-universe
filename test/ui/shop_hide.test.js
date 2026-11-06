// NO-SHOP (2026-11-06): this fork has no in-app purchases. The pause face draws no shop gem, so the shop's window has no
// door, and the Hide the shop setting that hid the gem is gone with it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import '../chargenDom.mjs';
import { PREF_DEFAULTS } from '../../src/systems/uiPrefs.js';
import { mountEnhancedMenu } from '../../src/ui/enhanced/enhancedMenu.js';

console.warn = () => {};
const rd = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

test('NO-SHOP: the pause face shows no shop gem and wires no shop window; the hide setting is gone (mutants: the gem placed again; the setting kept)', async () => {
  const host = globalThis.document.createElement('div');
  const menu = mountEnhancedMenu(host, { mode: 'pause', hooks: {}, onAction: () => {} });
  assert.equal(host.querySelectorAll?.('.px-shopmark')?.length ?? 0, 0, 'no gem');
  menu?.unmount?.();
  const m = rd('src/ui/enhanced/enhancedMenu.js');
  for (const s of ["from './enhancedShop.js'", 'shopGem', 'shopWindow', 'shopOpen', '.px-shopmark', 'shopHidden']) assert.ok(!m.includes(s), `the menu has no ${s}`);
  assert.ok(!('shopHidden' in PREF_DEFAULTS), 'no pref');
  const { whereIs } = await import('../../src/ui/settings/settingsMap.js');
  assert.equal(whereIs('port:shopHidden'), null, 'no settings row');
});

test('SHOP-REREAD (2026-10-31): a signed-in account is read again at every press of the gem and at the window\'s focus - a card an older service answered (a deploy\'s gap: no Aurum, no Folios) mends at the next open; nobody signed in, nothing asked (mutants: the gem reads nothing, the stage unread)', async () => {
  const { shopReread } = await import('../../src/ui/enhanced/enhancedShop.js');
  let asked = 0;
  const flow = (stage) => ({ stage, refresh: async () => { asked++; } });
  assert.equal(shopReread(flow('in')), true);
  assert.equal(asked, 1, 'read again');
  for (const f of [flow('out'), flow('loading'), null, { stage: 'in' }]) assert.equal(shopReread(f), false);
  assert.equal(asked, 1, 'nothing asked for nobody');
  assert.equal(shopReread({ stage: 'in', refresh: async () => { throw new Error('offline'); } }), true, 'a failed read never throws');
  const s = rd('src/ui/enhanced/enhancedShop.js');
  assert.ok(s.includes('const onFocus = () => {\n    if (win.isConnected) shopReread(f());\n  };'), 'the window\'s focus, one home');
});
