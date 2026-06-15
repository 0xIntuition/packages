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

describe('@0xintuition/classifications package manifest', () => {
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
			'./creation': {
				types: './dist/generated/creation/index.d.ts',
				import: './dist/generated/creation/index.js',
			},
			'./creation/*': {
				types: './dist/generated/creation/*.d.ts',
				import: './dist/generated/creation/*.js',
			},
			'./*': {
				types: './dist/generated/specs/*.d.ts',
				import: './dist/generated/specs/*.js',
			},
		});
	});

	it('checks generated creation profile artifacts', () => {
		expect(packageJson.scripts['creation-profiles:generate']).toBe(
			'bun ../../scripts/generate-classification-creation-profiles.mjs'
		);
		expect(packageJson.scripts['creation-profiles:check-generated']).toBe(
			'node ../../scripts/check-classification-creation-profiles.mjs'
		);
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
