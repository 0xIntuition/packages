import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
	main: string;
	types: string;
	files: string[];
	exports: Record<string, unknown>;
	scripts: Record<string, string>;
};

describe('@0xintuition/primitives package manifest', () => {
	it('exports built entrypoints for npm consumers', () => {
		expect(packageJson.main).toBe('./dist/index.js');
		expect(packageJson.types).toBe('./dist/index.d.ts');
		expect(packageJson.files).toEqual(['dist', 'README.md', 'LICENSE']);
		expect(packageJson.exports).toMatchObject({
			'.': {
				types: './dist/index.d.ts',
				import: './dist/index.js',
			},
			'./package.json': './package.json',
			'./atom': {
				types: './dist/atom.d.ts',
				import: './dist/atom.js',
			},
			'./predicate': {
				types: './dist/predicate.d.ts',
				import: './dist/predicate.js',
			},
			'./triple': {
				types: './dist/triple.d.ts',
				import: './dist/triple.js',
			},
			'./discover': {
				types: './dist/discover.d.ts',
				import: './dist/discover.js',
			},
			'./validate': {
				types: './dist/validate.d.ts',
				import: './dist/validate.js',
			},
			'./types': {
				types: './dist/types.d.ts',
				import: './dist/types.js',
			},
		});
	});

	it('packs directly from the package root', () => {
		expect(packageJson.scripts['pack:dry-run']).toBe(
			'bun run build && npm pack --ignore-scripts --dry-run --json'
		);
		expect(packageJson.scripts['pack:release']).toBe(
			'bun run build && node ../../scripts/pack-release.mjs'
		);
		expect(packageJson.scripts.prepublishOnly).toBe(
			'bun run build && node ../../scripts/guard-direct-publish.mjs'
		);
	});
});
