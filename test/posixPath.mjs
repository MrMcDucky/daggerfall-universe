// Paths as the repository writes them: `/` between the parts, whatever the platform's separator.
import { sep } from 'node:path';

export const toPosix = (p) => (sep === '/' ? p : p.split(sep).join('/'));
