#!/usr/bin/env node

/**
 * Central registry of publishable workspace packages.
 *
 * This module is the single source of truth for package order and packaging
 * metadata. Pack, smoke, and release scripts must consume it instead of
 * carrying their own hard-coded arrays.
 *
 * Order is the topological publish/pack order: every runtime internal
 * dependency of a package must appear earlier in the list. devDependencies do
 * not constrain order (they are not installed by consumers) but must still be
 * exact workspace versions.
 *
 * kind:
 * - 'compiled'  — ships dist/ output; tarball must contain compiled entrypoints
 * - 'docs-only' — normative documents/fixtures only; no build step, no dist/
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const PACKAGES = [
	{ dirName: 'iid-spec', kind: 'docs-only' },
	{ dirName: 'iid', kind: 'compiled' },
	{ dirName: 'deployments', kind: 'compiled' },
	{ dirName: 'curves', kind: 'compiled' },
	{ dirName: 'ids', kind: 'compiled' },
	{ dirName: 'schema-org', kind: 'compiled' },
	{ dirName: 'classifications', kind: 'compiled' },
	{ dirName: 'predicates', kind: 'compiled' },
	{ dirName: 'primitives', kind: 'compiled' },
	{ dirName: 'protocol', kind: 'compiled' },
	{ dirName: 'periphery', kind: 'compiled' },
	{ dirName: 'react', kind: 'compiled' },
];

export const PACKAGE_ORDER = PACKAGES.map((entry) => entry.dirName);

const RUNTIME_DEPENDENCY_FIELDS = [
	'dependencies',
	'peerDependencies',
	'optionalDependencies',
];

const ALL_DEPENDENCY_FIELDS = [...RUNTIME_DEPENDENCY_FIELDS, 'devDependencies'];

export function packageRootFor(repoRoot, dirName) {
	return resolve(repoRoot, 'packages', dirName);
}

export function readWorkspaceManifest(repoRoot, dirName) {
	const manifestPath = resolve(packageRootFor(repoRoot, dirName), 'package.json');
	return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

export function requiredTarballFiles(kind) {
	if (kind === 'docs-only') {
		return ['README.md', 'LICENSE'];
	}
	return ['dist/index.js', 'dist/index.d.ts', 'README.md', 'LICENSE'];
}

function internalDependencyEntries(manifest, fieldNames) {
	const entries = [];
	for (const fieldName of fieldNames) {
		const dependencies = manifest[fieldName];
		if (!dependencies || typeof dependencies !== 'object') {
			continue;
		}
		for (const [dependencyName, versionRange] of Object.entries(dependencies)) {
			if (dependencyName.startsWith('@0xintuition/')) {
				entries.push({ fieldName, dependencyName, versionRange });
			}
		}
	}
	return entries;
}

/**
 * Loads every registered workspace manifest, keyed by directory name.
 */
export function readAllWorkspaceManifests(repoRoot) {
	const manifests = new Map();
	for (const { dirName } of PACKAGES) {
		manifests.set(dirName, readWorkspaceManifest(repoRoot, dirName));
	}
	return manifests;
}

/**
 * Asserts that PACKAGES covers exactly the set of registered names, that
 * registry order is a valid topological order over runtime internal
 * dependencies, and that every internal dependency (including dev) is
 * exact-pinned to the current workspace version.
 *
 * Throws with an aggregate message listing every violation.
 */
export function assertRegistryIntegrity(repoRoot) {
	const manifests = readAllWorkspaceManifests(repoRoot);
	const failures = [];

	const nameToDirName = new Map();
	const versionsByName = new Map();
	for (const [dirName, manifest] of manifests) {
		if (!manifest.name?.startsWith('@0xintuition/')) {
			failures.push(`${dirName}: package name ${manifest.name} is not in the @0xintuition scope`);
			continue;
		}
		nameToDirName.set(manifest.name, dirName);
		versionsByName.set(manifest.name, manifest.version);
	}

	const positionByDirName = new Map(PACKAGE_ORDER.map((dirName, index) => [dirName, index]));

	for (const [dirName, manifest] of manifests) {
		const position = positionByDirName.get(dirName);

		for (const { fieldName, dependencyName, versionRange } of internalDependencyEntries(
			manifest,
			ALL_DEPENDENCY_FIELDS
		)) {
			const expectedVersion = versionsByName.get(dependencyName);
			if (expectedVersion === undefined) {
				failures.push(
					`${dirName}: ${fieldName}.${dependencyName} is not a registered workspace package`
				);
				continue;
			}
			if (versionRange !== expectedVersion) {
				failures.push(
					`${dirName}: ${fieldName}.${dependencyName} must be exact-pinned to workspace version ${expectedVersion}, found "${versionRange}"`
				);
			}
		}

		for (const { fieldName, dependencyName } of internalDependencyEntries(
			manifest,
			RUNTIME_DEPENDENCY_FIELDS
		)) {
			const dependencyDirName = nameToDirName.get(dependencyName);
			if (dependencyDirName === undefined) {
				continue;
			}
			const dependencyPosition = positionByDirName.get(dependencyDirName);
			if (dependencyPosition >= position) {
				failures.push(
					`${dirName}: ${fieldName}.${dependencyName} must appear earlier in PACKAGE_ORDER (topological publish order)`
				);
			}
		}
	}

	if (failures.length > 0) {
		throw new Error(
			`Package registry integrity check failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`
		);
	}

	return manifests;
}

const isDirectInvocation =
	process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname;

if (isDirectInvocation) {
	const repoRoot = resolve(new URL('..', import.meta.url).pathname);
	assertRegistryIntegrity(repoRoot);
	console.log(
		`Package registry integrity check passed for ${PACKAGES.length} packages: ${PACKAGE_ORDER.join(', ')}.`
	);
}
