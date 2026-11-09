// The painted pictures' door (src/systems/paintedReplacement.js): a player's texture pack over the port's own paint.
// The pictures are the test's own, written as PNG by tools/pngIO.mjs: no game data.
import '../modsOff.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writePng, readPng } from '../../tools/pngIO.mjs';
import { setValue } from '../../src/systems/settings/settings.js';
import { setTextureReplacements, clearTextureReplacements, clearVendorTextures, preloadTextureRecord } from '../../src/systems/textureReplacement.js';
import { paintedReplacement, wearPainted } from '../../src/systems/paintedReplacement.js';
import { WAGON_ARCHIVE } from '../../src/world/wagonArt.js';

const decode = async (bytes) => readPng(bytes);
/** A picture of the test's own: `width` x `height`, every texel `rgb`, its top row white (so the rows' order shows). */
function picture(width, height, rgb) {
  const data = new Uint8Array(width * height * 4);
  for (let texel = 0; texel < width * height; texel++) data.set(texel < width ? [255, 255, 255, 255] : [...rgb, 255], texel * 4);
  return writePng({ width, height, data });
}
/** A player's loose pack replacing the wagon records `records`, each a 2 x 3 picture of `rgb`. */
function pack(records, rgb) {
  setTextureReplacements(records.map((record) => `${WAGON_ARCHIVE}_${record}-0.png`), async () => picture(2, 3, rgb));
}
function reset() {
  clearVendorTextures();
  clearTextureReplacements();
  setValue('Enhancements', 'AssetInjection', 'True');
}
const rgbOf = (image, row) => [...image.colors.subarray(row * image.width * 4, row * image.width * 4 + 3)];

test('PAINTED: with no pack the painted picture goes up once; a decoded pack picture goes up in its place, in either row order', async () => {
  reset();
  try {
    const puts = [];
    wearPainted(WAGON_ARCHIVE, 4, () => 'painted', (picture, how) => puts.push([picture, how]));
    assert.deepEqual(puts, [['painted', { replaced: false, late: false }]]);
    assert.equal(paintedReplacement(WAGON_ARCHIVE, 4), null);

    pack([4], [70, 7, 7]);
    await preloadTextureRecord(WAGON_ARCHIVE, 4, 0, 'Albedo', null, { decode });
    puts.length = 0;
    let painted = 0;
    wearPainted(WAGON_ARCHIVE, 4, () => painted++, (picture, how) => puts.push([picture, how]));
    assert.equal(painted, 0, 'the paint is never made');
    assert.deepEqual(puts[0][1], { replaced: true, late: false });
    assert.deepEqual(rgbOf(puts[0][0], 0), [70, 7, 7], 'color32 order: row 0 the bottom');
    assert.deepEqual(rgbOf(puts[0][0], 2), [255, 255, 255]);
    assert.deepEqual(rgbOf(paintedReplacement(WAGON_ARCHIVE, 4, { topDown: true }), 0), [255, 255, 255], 'top-down: the white row first');
  } finally {
    reset();
  }
});

test('PAINTED: a pack picture not decoded yet - the painted one first, the pack\'s handed again late; a newer wear of the slot takes no late picture', async () => {
  reset();
  try {
    pack([4, 5], [9, 90, 9]);
    const puts = [];
    const put = (record) => (picture, how) => puts.push([record, picture, how]);
    wearPainted(WAGON_ARCHIVE, 4, () => 'painted 4', put(4), { decode });
    wearPainted(WAGON_ARCHIVE, 5, () => 'painted 5', put(5), { decode });
    wearPainted(WAGON_ARCHIVE, 5, () => 'repainted 5', put('5 again'), { decode });
    assert.deepEqual(puts.map(([record, picture]) => [record, picture]), [[4, 'painted 4'], [5, 'painted 5'], ['5 again', 'repainted 5']]);
    for (let turn = 0; turn < 5; turn++) await new Promise((resolve) => setImmediate(resolve));
    const late = puts.slice(3);
    assert.deepEqual(late.map(([record, , how]) => [record, how]), [[4, { replaced: true, late: true }], ['5 again', { replaced: true, late: true }]],
      'record 4 late, and record 5 only on its newest wear');
    assert.deepEqual(rgbOf(late[0][1], 0), [9, 90, 9]);
  } finally {
    reset();
  }
});
