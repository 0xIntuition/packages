#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const generatedPaths = ['packages/classifications/src/generated/creation'];

function run(command, args) {
	return execFileSync(command, args, {
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'inherit'],
	});
}

run('bun', ['scripts/generate-classification-creation-profiles.mjs']);

const status = run('git', ['status', '--porcelain', '--', ...generatedPaths]).trim();

if (status) {
	console.error('Classification creation profiles are out of date. Run:');
	console.error('  bun scripts/generate-classification-creation-profiles.mjs');
	console.error(status);
	process.exit(1);
}

console.log('Classification creation profiles are up to date.');
