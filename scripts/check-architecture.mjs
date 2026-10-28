import { readFileSync } from 'node:fs';
import { assertRegistryIntegrity, readAllWorkspaceManifests } from './package-registry.mjs';

const root = new URL('../', import.meta.url).pathname;
assertRegistryIntegrity(root);
const manifests = readAllWorkspaceManifests(root);
const map = readFileSync(new URL('../docs/architecture/package-map.md', import.meta.url), 'utf8');
const graph = readFileSync(
	new URL('../docs/architecture/dependency-graph.md', import.meta.url),
	'utf8'
);
for (const [name, manifest] of manifests) {
	if (!map.includes('`' + manifest.name + '`')) throw new Error(`Package map missing ${name}`);
	for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
		for (const dep of Object.keys(manifest[field] ?? {})) {
			const target = dep.replace('@0xintuition/', '');
			if (
				dep.startsWith('@0xintuition/') &&
				manifests.has(target) &&
				!graph.includes(`${name} --> ${target}`)
			)
				throw new Error(`Dependency graph missing ${name} -> ${target}`);
		}
	}
}
for (const name of ['atom-parser', 'atom-enrichment', 'atom-classification', 'atom-runtime']) {
	if (manifests.get(name).dependencies?.effect) throw new Error(`${name} must remain Effect-free`);
}
console.log('Architecture registry, dependency graph, and package map agree.');
