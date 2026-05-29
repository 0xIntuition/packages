#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const generatedPaths = ['packages/predicates/src/generated/index.ts', 'packages/predicates/src/standalone'];

function run(command, args) {
	return execFileSync(command, args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe'],
	});
}

run('node', ['scripts/generate-predicate-standalone-modules.mjs']);

const status = run('git', ['status', '--porcelain', '--', ...generatedPaths]).trim();

if (status.length > 0) {
	console.error('Predicate generated files are out of date. Run:');
	console.error('  node scripts/generate-predicate-standalone-modules.mjs');
	console.error('');
	console.error(status);
	process.exit(1);
}

console.log('Predicate generated files are up to date.');
