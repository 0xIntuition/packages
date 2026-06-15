#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const outputJson = args.has('--json');
const packageRoot = process.cwd();

execFileSync('node', ['../../scripts/guard-direct-publish.mjs'], {
	cwd: packageRoot,
	stdio: 'inherit',
});

const rawManifest = execFileSync(
	'npm',
	['pack', '--ignore-scripts', '--json', ...(dryRun ? ['--dry-run'] : [])],
	{
		cwd: packageRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			NPM_CONFIG_CACHE: process.env.NPM_CONFIG_CACHE ?? '/tmp/npm-cache-intuition-packages',
		},
	}
);

if (dryRun) {
	writeFileSync(1, rawManifest);
	process.exit(0);
}

const manifest = JSON.parse(rawManifest);
const tarballName = manifest[0]?.filename;

if (!tarballName) {
	throw new Error('npm pack did not return a tarball filename.');
}

const tarballPath = resolve(packageRoot, tarballName);

if (outputJson) {
	writeFileSync(1, `${JSON.stringify([{ ...manifest[0], tarballPath }], null, 2)}\n`);
	process.exit(0);
}

process.stdout.write(`${tarballPath}\n`);
