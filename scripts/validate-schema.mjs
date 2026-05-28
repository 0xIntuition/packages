#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);
const schemaRoot = resolve(repoRoot, 'schema');
const failures = [];

function walkJson(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const entryPath = resolve(directory, entry.name);
		if (entry.isDirectory()) {
			return walkJson(entryPath);
		}
		return entry.name.endsWith('.jsonld') ? [entryPath] : [];
	});
}

const cnamePath = resolve(schemaRoot, 'CNAME');
if (
	!existsSync(cnamePath) ||
	readFileSync(cnamePath, 'utf8').trim() !== 'schema.intuition.systems'
) {
	failures.push('schema/CNAME must contain schema.intuition.systems');
}

for (const filePath of walkJson(resolve(schemaRoot, 'v1'))) {
	try {
		const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
		if (!parsed['@context']) {
			failures.push(`${filePath}: missing @context`);
		}
	} catch (error) {
		failures.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
	}
}

if (failures.length > 0) {
	console.error('Schema validation failed:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log('Schema validation passed.');
