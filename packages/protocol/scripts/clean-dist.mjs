import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

rmSync(resolve(packageRoot, 'dist'), { force: true, recursive: true });
