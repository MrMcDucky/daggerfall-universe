// Loaded into each test process by lfReads.mjs: the files named in $LF_READS are read with LF line endings, through
// every fs read a test uses. Other files, and reads by file descriptor, are untouched.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const key = process.platform === 'win32' ? (p) => resolve(p).toLowerCase() : (p) => resolve(p);
let named = new Set();
try {
  const { root, files } = JSON.parse(fs.readFileSync(process.env.LF_READS ?? '', 'utf8'));
  named = new Set(files.map((f) => key(resolve(root, f))));
} catch {
  // no list: nothing is converted
}

const pathOf = (p) => {
  if (typeof p === 'string') return p;
  if (p instanceof URL) return p.protocol === 'file:' ? fileURLToPath(p) : null;
  if (Buffer.isBuffer(p)) return p.toString();
  return null;
};
const listed = (p) => {
  const s = pathOf(p);
  return s !== null && named.has(key(s));
};
const encodingOf = (o) => (typeof o === 'string' ? o : (o?.encoding ?? null));
const asBuffer = (o) => (o && typeof o === 'object' ? { ...o, encoding: null } : null);
const toLf = (buf, o) => {
  const lf = Buffer.from(buf.toString('latin1').replaceAll('\r\n', '\n'), 'latin1');
  const enc = encodingOf(o);
  return enc ? lf.toString(enc) : lf;
};

if (named.size) {
  const { readFileSync, readFile } = fs;
  const readFileP = fs.promises.readFile;
  fs.readFileSync = function (p, o) {
    return listed(p) ? toLf(readFileSync(p, asBuffer(o)), o) : readFileSync.apply(this, arguments);
  };
  fs.readFile = function (p, o, cb) {
    if (typeof o === 'function') [o, cb] = [undefined, o];
    if (!listed(p)) return o === undefined ? readFile(p, cb) : readFile(p, o, cb);
    readFile(p, asBuffer(o) ?? {}, (e, buf) => (e ? cb(e) : cb(null, toLf(buf, o))));
  };
  fs.promises.readFile = async function (p, o) {
    return listed(p) ? toLf(await readFileP(p, asBuffer(o)), o) : readFileP.apply(this, arguments);
  };
  syncBuiltinESMExports();
}
