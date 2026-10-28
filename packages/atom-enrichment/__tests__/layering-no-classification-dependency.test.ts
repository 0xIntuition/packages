import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * atom-classification depends on atom-enrichment (the shared Spotify client and the pinned
 * transport live here). The reverse edge would be a cycle, so no atom-enrichment manifest
 * dependency or source import may name atom-classification. A string that merely identifies the
 * package (the handoff's `classificationEngine` id) is not an import and is allowed; so are the
 * package's own cross-package fixtures in `__tests__`, which predate this guard.
 */

const ROOT = join(import.meta.dir, '..');
const IMPORT_OF_CLASSIFICATION =
	/(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"][^'"]*atom-classification[^'"]*['"]/;

function sourceFiles(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry);
		if (entry === 'node_modules') return [];
		if (statSync(path).isDirectory()) return sourceFiles(path);
		return /\.(ts|tsx|mts)$/.test(entry) ? [path] : [];
	});
}

/** Source text that imports atom-classification, as a module specifier. */
export function importsClassification(text: string): boolean {
	return IMPORT_OF_CLASSIFICATION.test(text.replace(/\n\s*/g, ' '));
}

/** Manifest dependency names that are atom-classification. */
export function dependsOnClassification(manifest: Record<string, unknown>): string[] {
	return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
		.flatMap((field) => Object.keys((manifest[field] as Record<string, string> | undefined) ?? {}))
		.filter((name) => name.endsWith('atom-classification'));
}

describe('atom-enrichment never depends on atom-classification', () => {
	test('the scanners flag an import, a multi-line import, a dynamic import, a require and a dependency', () => {
		expect(importsClassification("import x from '@0xintuition/atom-classification';")).toBe(true);
		expect(
			importsClassification("import {\n\ta,\n} from '@0xintuition/atom-classification/src';")
		).toBe(true);
		expect(importsClassification("const m = await import('../../atom-classification/src');")).toBe(
			true
		);
		expect(importsClassification("const x = require('@0xintuition/atom-classification');")).toBe(
			true
		);
		expect(
			dependsOnClassification({
				dependencies: { '@0xintuition/atom-classification': 'workspace:*' },
			})
		).toEqual(['@0xintuition/atom-classification']);
	});

	test('the scanners ignore an id string and the allowed neighbours', () => {
		expect(importsClassification("classificationEngine: '@0xintuition/atom-classification',")).toBe(
			false
		);
		expect(importsClassification("import x from '@0xintuition/atom-enrichment';")).toBe(false);
		expect(
			dependsOnClassification({ dependencies: { '@0xintuition/atom-enrichment': '1' } })
		).toEqual([]);
	});

	test('no manifest dependency and no source import names it', () => {
		const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
		expect(dependsOnClassification(manifest)).toEqual([]);
		const files = sourceFiles(join(ROOT, 'src'));
		expect(files.length).toBeGreaterThan(50);
		expect(files.filter((file) => importsClassification(readFileSync(file, 'utf8')))).toEqual([]);
	});
});
