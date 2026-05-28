#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const packageOrder = [
	'deployments',
	'curves',
	'ids',
	'classifications',
	'predicates',
	'primitives',
	'protocol',
	'periphery',
	'react',
];

for (const packageName of packageOrder) {
	const packageRoot = resolve(repoRoot, 'packages', packageName);
	if (!statSync(packageRoot).isDirectory()) {
		throw new Error(`Missing package directory: ${packageName}`);
	}
	console.log(`\n# @0xintuition/${packageName}`);
	execFileSync('bun', ['run', 'pack:dry-run'], {
		cwd: packageRoot,
		stdio: 'inherit',
		env: {
			...process.env,
			NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE ?? '/tmp/npm-cache-intuition-packages',
		},
	});
}
