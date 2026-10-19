import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import type { AuthUserAtomData, AuthUserAtomInput } from './index.js';
import * as ids from './index.js';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
	main: string;
	types: string;
	files: string[];
	exports: Record<string, unknown>;
	scripts: Record<string, string>;
};

describe('@0xintuition/ids package manifest', () => {
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

describe('@0xintuition/ids public builders', () => {
	it('exports auth-user constants and builders', () => {
		expect(ids).toMatchObject({
			AUTH_USER_ATOM_CONTEXT: 'https://schema.0xintuition.com/v1/metadata.jsonld',
			AUTH_USER_ATOM_DERIVATION_VERSION: 'auth-user-default-wallet-v1',
			AUTH_USER_ATOM_TYPE: 'IntuitionAuthUser',
			authUserAtomDataHex: expect.any(Function),
			authUserIdHash: expect.any(Function),
			calculateAuthUserAtomId: expect.any(Function),
			createAuthUserAtomData: expect.any(Function),
			serializeAuthUserAtomData: expect.any(Function),
		});
		const input: AuthUserAtomInput = { userId: '018f8f2d-7d7b-7c2d-9a07-5f5f1adbd201' };
		const data: AuthUserAtomData = ids.createAuthUserAtomData(input);
		expect(data.userIdHash).toBe(ids.authUserIdHash(input.userId));
		expect(ids.calculateAuthUserAtomId(input)).toBe(
			ids.calculateAtomId(ids.serializeAuthUserAtomData(input))
		);
		expect(ids.calculateAtomId(ids.authUserAtomDataHex(input))).toBe(
			ids.calculateAuthUserAtomId(input)
		);
	});

	it('exports the I subject data and pinned id', () => {
		expect(ids).toMatchObject({
			I_SUBJECT: 'I',
			I_SUBJECT_DATA: 'I',
			I_SUBJECT_ID: '0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b',
		});
	});
});
