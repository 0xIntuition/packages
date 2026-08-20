import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
	version: string;
	main: string;
	types: string;
	files: string[];
	exports: Record<string, unknown>;
	publishConfig: Record<string, unknown>;
	scripts: Record<string, string>;
};

describe('@0xintuition/protocol package manifest', () => {
	it('publishes protocol v3 on the default dist-tag', () => {
		expect(packageJson.version).toBe('3.1.0');
		expect(packageJson.publishConfig).toEqual({ access: 'public' });
	});

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
