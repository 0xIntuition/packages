#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const generatedPaths = ['packages/schema-org/src/generated'];

function run(command, args) {
	return execFileSync(command, args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

run('node', ['scripts/generate-schema-org-package.mjs']);

const status = run('git', ['status', '--porcelain', '--', ...generatedPaths]).trim();

if (status.length > 0) {
	console.error('schema.org generated files are out of date. Run:');
	console.error('  node scripts/generate-schema-org-package.mjs');
	console.error('');
	console.error(status);
	process.exit(1);
}

console.log('schema.org generated files are up to date.');
