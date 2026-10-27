#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const packageRoot = process.cwd();
const distRoot = resolve(packageRoot, 'dist');

function walkFiles(directory) {
	const files = [];

	for (const entry of readdirSync(directory)) {
		const entryPath = resolve(directory, entry);
		if (statSync(entryPath).isDirectory()) {
			files.push(...walkFiles(entryPath));
			continue;
		}

		files.push(entryPath);
	}

	return files;
}

function hasExtension(specifier) {
	const lastSegment = specifier.split('/').at(-1) ?? '';
	return ['.js', '.mjs', '.cjs', '.json', '.node', '.wasm'].includes(extname(lastSegment));
}

function normalizeSpecifier(sourceFilePath, specifier) {
	if (
		specifier !== '.' &&
		specifier !== '..' &&
		!specifier.startsWith('./') &&
		!specifier.startsWith('../')
	) {
		return specifier;
	}

	if (hasExtension(specifier)) {
		return specifier;
	}

	const jsTarget = resolve(dirname(sourceFilePath), `${specifier}.js`);
	if (
		existsSync(jsTarget) ||
		(sourceFilePath.endsWith('.d.ts') && existsSync(jsTarget.replace(/\.js$/, '.d.ts')))
	) {
		return `${specifier}.js`;
	}

	const indexTarget = resolve(dirname(sourceFilePath), specifier, 'index.js');
	if (
		existsSync(indexTarget) ||
		(sourceFilePath.endsWith('.d.ts') && existsSync(indexTarget.replace(/\.js$/, '.d.ts')))
	) {
		return `${specifier}/index.js`;
	}

	return specifier;
}

function normalizeFile(filePath) {
	const source = readFileSync(filePath, 'utf8');
	const normalized = source
		.replace(
			/(\bimport\(\s*['"])(\.{1,2}(?:\/[^'"]*)?)(['"])/g,
			(_match, prefix, specifier, suffix) =>
				`${prefix}${normalizeSpecifier(filePath, specifier)}${suffix}`
		)
		.replace(
			/(from\s*['"])(\.{1,2}\/[^'"]+)(['"])/g,
			(_match, prefix, specifier, suffix) =>
				`${prefix}${normalizeSpecifier(filePath, specifier)}${suffix}`
		)
		.replace(
			/(import\s*['"])(\.{1,2}\/[^'"]+)(['"])/g,
			(_match, prefix, specifier, suffix) =>
				`${prefix}${normalizeSpecifier(filePath, specifier)}${suffix}`
		);

	if (normalized !== source) {
		writeFileSync(filePath, normalized);
	}
}

if (existsSync(distRoot)) {
	for (const filePath of walkFiles(distRoot)) {
		if (filePath.endsWith('.js') || filePath.endsWith('.d.ts')) {
			normalizeFile(filePath);
		}
	}
}
