import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const distRoot = resolve(packageRoot, 'dist');

/** @type {ReadonlyArray<readonly [string, string]>} */
const layoutMoves = [
	['cli/src', '.'],
	['protocol/src', 'protocol'],
	['periphery/src', 'periphery'],
	['sdk/src', 'sdk'],
];

/**
 * @param {string} fromRelative
 * @param {string} toRelative
 */
function moveDirectoryContents(fromRelative, toRelative) {
	const fromPath = resolve(distRoot, fromRelative);
	if (!existsSync(fromPath)) {
		return;
	}

	const toPath = resolve(distRoot, toRelative);
	mkdirSync(toPath, { recursive: true });
	cpSync(fromPath, toPath, { force: true, recursive: true });
	rmSync(fromPath, { force: true, recursive: true });
}

for (const [fromRelative, toRelative] of layoutMoves) {
	moveDirectoryContents(fromRelative, toRelative);
}

for (const cleanupRelative of [
	'cli',
	'protocol/src',
	'protocol',
	'periphery/src',
	'periphery',
	'sdk/src',
	'sdk',
]) {
	const cleanupPath = resolve(distRoot, cleanupRelative);
	if (existsSync(cleanupPath) && readdirSync(cleanupPath).length === 0) {
		rmSync(cleanupPath, { force: true, recursive: true });
	}
}
