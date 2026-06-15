import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
	types: string;
	files: string[];
	exports: Record<string, unknown>;
	scripts: Record<string, string>;
};

describe('@0xintuition/classifications package manifest', () => {
	it('exports source entrypoints for workspace consumers', () => {
		expect(packageJson.types).toBe('./src/index.ts');
		expect(packageJson.files).toEqual(['src', 'README.md']);
		expect(packageJson.exports).toMatchObject({
			'.': './src/index.ts',
			'./package.json': './package.json',
			'./creation': './src/generated/creation/index.ts',
			'./creation/*': './src/generated/creation/*.ts',
			'./*': './src/generated/specs/*.ts',
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

	it('uses the staged release packer for publishable tarballs', () => {
		expect(packageJson.scripts['pack:dry-run']).toContain('../../scripts/pack-release.mjs');
		expect(packageJson.scripts['pack:dry-run']).toContain('--dist-entrypoints');
		expect(packageJson.scripts['pack:dry-run']).toContain('--rewrite-workspace-deps');
		expect(packageJson.scripts.prepublishOnly).toBe('node ../../scripts/guard-direct-publish.mjs');
	});
});
