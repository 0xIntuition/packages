#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { PACKAGES } from './package-registry.mjs';

const packageRoot = process.cwd();
const packageJsonPath = resolve(packageRoot, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const packageKind =
	PACKAGES.find((entry) => entry.dirName === basename(packageRoot))?.kind ?? 'compiled';
const isDocsOnly = packageKind === 'docs-only';
const failures = [];

function addFailure(message) {
	failures.push(`${packageJson.name ?? packageRoot}: ${message}`);
}

function isPlainObject(value) {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasWorkspaceOnlyProtocol(value) {
	return typeof value === 'string'
		? value.startsWith('workspace:') || value.startsWith('catalog:')
		: isPlainObject(value) || Array.isArray(value)
			? Object.values(value).some(hasWorkspaceOnlyProtocol)
			: false;
}

function collectExportTargets(value, targets = []) {
	if (typeof value === 'string') {
		targets.push(value);
		return targets;
	}

	if (Array.isArray(value)) {
		for (const nested of value) {
			collectExportTargets(nested, targets);
		}
		return targets;
	}

	if (isPlainObject(value)) {
		for (const nested of Object.values(value)) {
			collectExportTargets(nested, targets);
		}
	}

	return targets;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function walkPackageFiles(directory = packageRoot, baseDirectory = packageRoot) {
	const files = [];

	for (const entry of readdirSync(directory)) {
		const entryPath = resolve(directory, entry);
		const relativePath = entryPath.slice(baseDirectory.length + 1).replace(/\\/g, '/');

		if (statSync(entryPath).isDirectory()) {
			if (!['.cache', '.git', '.turbo', 'node_modules'].includes(entry)) {
				files.push(...walkPackageFiles(entryPath, baseDirectory));
			}
			continue;
		}

		files.push(relativePath);
	}

	return files;
}

function entrypointExists(path) {
	const relativePath = path.startsWith('./') ? path.slice(2) : path;

	if (!relativePath.includes('*')) {
		return existsSync(resolve(packageRoot, relativePath));
	}

	const pattern = new RegExp(
		`^${relativePath
			.split('*')
			.map(escapeRegExp)
			.join('.*')}$`
	);

	return walkPackageFiles().some((candidatePath) => pattern.test(candidatePath));
}

function assertEntrypoint(path, label) {
	if (typeof path !== 'string') {
		addFailure(`${label} must be a string`);
		return;
	}

	if (isDocsOnly) {
		if (path.startsWith('./dist/') || path.startsWith('./src/')) {
			addFailure(`${label} must not point at dist or src in a docs-only package, got ${path}`);
			return;
		}
	} else if (!path.startsWith('./dist/') && path !== './package.json') {
		addFailure(`${label} must point at dist or package.json, got ${path}`);
		return;
	}

	if (path !== './package.json' && !entrypointExists(path)) {
		addFailure(`${label} target is missing: ${path}`);
	}
}

if (packageJson.private !== false) {
	addFailure('private must be false');
}

if (packageJson.type !== 'module') {
	addFailure('type must be module');
}

if (packageJson.license !== 'MIT') {
	addFailure('license must be MIT');
}

if (isDocsOnly) {
	if (packageJson.main !== undefined || packageJson.types !== undefined) {
		addFailure('docs-only packages must not declare main or types entrypoints');
	}
} else {
	assertEntrypoint(packageJson.main, 'main');
	assertEntrypoint(packageJson.types, 'types');
}

if (!Array.isArray(packageJson.files)) {
	addFailure('files must be an array');
} else {
	const requiredFiles = isDocsOnly ? ['README.md', 'LICENSE'] : ['dist', 'README.md', 'LICENSE'];
	for (const requiredFile of requiredFiles) {
		if (!packageJson.files.includes(requiredFile)) {
			addFailure(`files must include ${requiredFile}`);
		}
	}
	if (packageJson.files.includes('src')) {
		addFailure('files must not include src');
	}
	if (isDocsOnly && packageJson.files.includes('dist')) {
		addFailure('docs-only packages must not ship dist');
	}
}

if (!isPlainObject(packageJson.exports)) {
	addFailure('exports must be an object with public subpaths');
} else {
	for (const [exportPath, exportTarget] of Object.entries(packageJson.exports)) {
		for (const target of collectExportTargets(exportTarget)) {
			assertEntrypoint(target, `exports[${exportPath}]`);
		}
	}
}

if (hasWorkspaceOnlyProtocol(packageJson)) {
	addFailure('published manifest must not contain workspace: or catalog: dependency specs');
}

for (const requiredFile of ['README.md', 'LICENSE']) {
	if (!existsSync(resolve(packageRoot, requiredFile))) {
		addFailure(`missing ${requiredFile}`);
	}
}

if (!isDocsOnly) {
	if (!existsSync(resolve(packageRoot, 'dist/index.js'))) {
		addFailure('missing dist/index.js; run the package build first');
	}

	if (!existsSync(resolve(packageRoot, 'dist/index.d.ts'))) {
		addFailure('missing dist/index.d.ts; run the package build first');
	}
}

if (failures.length > 0) {
	console.error(failures.join('\n'));
	process.exit(1);
}

console.log(`${packageJson.name} direct publish guard passed.`);
