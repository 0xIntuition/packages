#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertRegistryIntegrity } from './package-registry.mjs';

/** Read-only preflight. HTTP failures other than 404 never mean an unused version. */
export async function checkReleaseRegistry({ manifests, plan, fetch = globalThis.fetch }) {
	const selected = new Set();
	const failures = [];
	const metadata = new Map();
	const registry = async (name) => {
		if (!metadata.has(name)) {
			const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
				signal: AbortSignal.timeout(30_000),
			});
			if (!response.ok && response.status !== 404) {
				throw new Error(`${name}: registry returned HTTP ${response.status}`);
			}
			const body = response.status === 404 ? { versions: {} } : await response.json();
			if (!body.versions || typeof body.versions !== 'object') {
				throw new Error(`${name}: registry response has no version inventory`);
			}
			metadata.set(name, body);
		}
		return metadata.get(name);
	};
	let previousPosition = -1;
	const order = [...manifests.keys()];
	for (const entry of plan.packages) {
		const manifest = manifests.get(entry.directory);
		if (!manifest) throw new Error(`Unknown release package: ${entry.directory}`);
		const position = order.indexOf(entry.directory);
		if (position <= previousPosition)
			failures.push(`${entry.directory}: duplicate or out of publish order`);
		previousPosition = position;
		selected.add(manifest.name);
		if (manifest.version !== entry.version)
			failures.push(`${manifest.name}: release plan version differs from manifest`);
		if (manifest.publishConfig?.tag !== entry.tag)
			failures.push(`${manifest.name}: release plan tag differs from manifest`);
		const published = await registry(manifest.name);
		if (Object.hasOwn(published.versions, entry.version))
			failures.push(`${manifest.name}@${entry.version} is already published`);
	}
	for (const { directory } of plan.packages) {
		const manifest = manifests.get(directory);
		for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
			for (const [name, version] of Object.entries(manifest[field] ?? {})) {
				if (!name.startsWith('@0xintuition/') || selected.has(name)) continue;
				if (!Object.hasOwn((await registry(name)).versions, version))
					failures.push(
						`${manifest.name}: ${name}@${version} is neither published nor in this release`
					);
			}
		}
	}
	if (!plan.packages.length) failures.push('Release plan is empty');
	if (failures.length) throw new Error(failures.join('\n'));
	return plan.packages.map(
		({ directory, version, tag }) => `${manifests.get(directory).name}@${version} (${tag})`
	);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const root = fileURLToPath(new URL('..', import.meta.url));
	const plan = JSON.parse(readFileSync(resolve(root, 'release-plan.json'), 'utf8'));
	const entries = await checkReleaseRegistry({ manifests: assertRegistryIntegrity(root), plan });
	console.log(
		`Registry version preflight passed:\n${entries.join('\n')}\nThis checks version availability, not publish permissions or release approval.`
	);
}
