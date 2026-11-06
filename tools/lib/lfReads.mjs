// Git with core.autocrlf (the Windows default) checks out LF files as CRLF. Many tests match source text with
// `\n`, so they fail there. Where git reports such files, the test processes read them back as LF, as git stores
// them (lfReadsPreload.mjs). A checkout without them, CI's among them, is left alone.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const PRELOAD = new URL('./lfReadsPreload.mjs', import.meta.url).href;

/** The files `git ls-files --eol -z` reports stored with LF and checked out with CRLF. Pure. */
export function crlfCheckouts(eolOutput) {
  const files = [];
  for (const entry of eolOutput.split('\0')) {
    const tab = entry.indexOf('\t');
    if (tab < 0) continue;
    const [index, work] = entry.slice(0, tab).trim().split(/\s+/);
    if (index === 'i/lf' && work === 'w/crlf') files.push(entry.slice(tab + 1));
  }
  return files;
}

/**
 * Hands every test process started with `env` the preload and the list of files it reads as LF. Answers whether
 * there were any; without git, or with none, `env` is left as it was.
 */
export function lfReads(
  root,
  env = process.env,
  git = (args) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }),
) {
  let out;
  try {
    out = git(['ls-files', '--eol', '-z']);
  } catch {
    return false;
  }
  const files = crlfCheckouts(out);
  if (!files.length) return false;
  const body = JSON.stringify({ root, files });
  const list = join(tmpdir(), `lf-reads-${createHash('sha1').update(body).digest('hex').slice(0, 16)}.json`);
  if (!existsSync(list)) {
    const part = `${list}.${process.pid}`;
    writeFileSync(part, body);
    renameSync(part, list);
  }
  env.LF_READS = list;
  const flag = `--import=${PRELOAD}`;
  if (!(env.NODE_OPTIONS ?? '').split(' ').includes(flag))
    env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} ${flag}`.trim();
  return true;
}
