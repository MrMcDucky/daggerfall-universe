// @ts-check
// The door of a picture the port paints itself (the wagons, the ships, the yards, the port, the monument): a player's
// own texture pack may replace it. The studio (systems/studioArt/, switched off) kept its own copy of this door, which
// also waits for the studio's listing.
import { hasTextureReplacement, decodedTexture, decodedTextureTopDown, preloadTextureRecord } from './textureReplacement.js';

/**
 * What replaces a painted record, ready for renderer.uploadTexture, or null to wear the painted one (null too while it
 * is not decoded: `wearPainted` waits for it). `topDown` for a host whose pictures go up with row 0 their top (the
 * yards', the port's, the monument's); otherwise the port's color32 order (row 0 the bottom), which the wagons' use.
 * @param {number} archive @param {number} record
 * @param {{ topDown?: boolean }} [how]
 * @returns {{ width: number, height: number, colors: Uint8ClampedArray } | null}
 */
export function paintedReplacement(archive, record, { topDown = false } = {}) {
  if (!hasTextureReplacement(archive, record)) return null;
  if (!topDown) return decodedTexture(archive, record);
  const decoded = decodedTextureTopDown(archive, record);
  return decoded ? { width: decoded.width, height: decoded.height, colors: decoded.rgba } : null;
}

/** A put's slot -> the newest wear asked of it: a late picture lands only on the wear still current. */
const wears = new Map();

/**
 * A painted record worn: `put(picture, { replaced, late })` gets its replacement or `paint()`; one not decoded yet is
 * handed again, `late`, to the newest wear of its `slot` (the record's key by default). `decode`: for tests.
 * @template P
 * @param {number} archive @param {number} record @param {() => P} paint
 * @param {(picture: P | NonNullable<ReturnType<typeof paintedReplacement>>, how: { replaced: boolean, late: boolean }) => void} put
 * @param {{ topDown?: boolean, slot?: string, decode?: (bytes: Uint8Array) => Promise<any> }} [how]
 */
export function wearPainted(archive, record, paint, put, how = {}) {
  const slot = how.slot ?? `${archive}_${record}`;
  const wear = {};
  wears.set(slot, wear);
  const own = paintedReplacement(archive, record, how);
  if (own) {
    wears.delete(slot);
    put(own, { replaced: true, late: false });
    return;
  }
  put(paint(), { replaced: false, late: false });
  if (!hasTextureReplacement(archive, record)) {
    wears.delete(slot);
    return;
  }
  preloadTextureRecord(archive, record, 0, 'Albedo', null, how.decode ? { decode: how.decode } : {})
    .then((got) => {
      if (!got || wears.get(slot) !== wear) return;
      const late = paintedReplacement(archive, record, how);
      if (late) put(late, { replaced: true, late: true });
    })
    .catch((error) => console.warn(`[painted] ${archive}_${record}: the replacement that landed would not go up`, error?.message ?? error))
    .finally(() => {
      if (wears.get(slot) === wear) wears.delete(slot);
    });
}
