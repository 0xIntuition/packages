import { execFileSync } from 'node:child_process';
import { chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, '..');
const outputFile = resolve(packageRoot, 'dist/bin/intuition.js');
const shebang = '#!/usr/bin/env node\n';

execFileSync(
	'bun',
	[
		'build',
		'./src/bin/intuition.ts',
		'--outfile',
		'./dist/bin/intuition.js',
		'--format',
		'esm',
		'--target',
		'node',
	],
	{
		cwd: packageRoot,
		stdio: 'inherit',
	}
);

const bundled = readFileSync(outputFile, 'utf8').replace(/^#!.*\n/, '');
writeFileSync(outputFile, `${shebang}${bundled}`);
chmodSync(outputFile, 0o755);
