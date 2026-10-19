import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import * as sdkActions from './actions';
import * as sdkApi from './api';
import * as sdk from './index';
import * as sdkProtocol from './protocol';
import * as sdkTrustSwapAndBridgeRouter from './trust-swap-and-bridge-router';
import * as sdkUtils from './utils';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as {
	version: string;
	private: boolean;
	main: string;
	types: string;
	files: string[];
	exports: Record<string, unknown>;
	publishConfig: Record<string, unknown>;
	scripts: Record<string, string>;
};

const distEntry = (path: string) => ({
	types: `./dist/${path}.d.ts`,
	import: `./dist/${path}.js`,
});

describe('@0xintuition/sdk package manifest', () => {
	it('publishes sdk v4 on alpha without changing latest', () => {
		expect(packageJson.version).toBe('4.0.0');
		expect(packageJson.private).toBe(false);
		expect(packageJson.publishConfig).toEqual({ access: 'public', tag: 'alpha' });
	});

	it('defines the documented package export map over built entrypoints', () => {
		expect(packageJson.main).toBe('./dist/index.js');
		expect(packageJson.types).toBe('./dist/index.d.ts');
		expect(packageJson.files).toEqual(['dist', 'README.md', 'LICENSE', 'docs']);
		expect(packageJson.exports).toMatchObject({
			'.': distEntry('index'),
			'./api': distEntry('api/index'),
			'./actions': distEntry('actions/index'),
			'./protocol': distEntry('protocol'),
			'./trust-swap-and-bridge-router': distEntry('trust-swap-and-bridge-router/index'),
			'./utils': distEntry('utils/index'),
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

describe('sdk public entrypoints', () => {
	it('exposes the documented modules behind each subpath', async () => {
		const fetcher = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			async json() {
				return {
					data: {
						atom: {
							term_id: '0xabc',
							label: 'entrypoint',
							data: null,
							image: null,
							emoji: null,
							type: 'Thing',
						},
					},
				};
			},
			async text() {
				return '';
			},
		});

		expect(typeof sdk.createIntuitionApiClient).toBe('function');
		expect(typeof sdk.getIntuitionApiUrl).toBe('function');
		expect(typeof sdk.multivaultPrepareDepositTx).toBe('function');
		expect(typeof sdk.calculateAtomId).toBe('function');

		expect(typeof sdkApi.createIntuitionApiClient).toBe('function');
		expect(typeof sdkApi.getIntuitionApiUrl).toBe('function');
		expect(typeof sdkActions.multivaultPrepareDepositTx).toBe('function');
		expect(typeof sdkProtocol.getMultiVaultAddressFromChainId).toBe('function');
		expect(typeof sdkUtils.formatCompactHex).toBe('function');
		expect(typeof sdkTrustSwapAndBridgeRouter.sameAddress).toBe('function');

		const client = sdkApi.createIntuitionApiClient({
			baseUrl: 'https://mainnet.intuition.sh/v1/graphql',
			fetch: fetcher,
		});

		await expect(client.atoms.getById({ termId: '0xabc' })).resolves.toEqual({
			termId: '0xabc',
			label: 'entrypoint',
			data: null,
			image: null,
			emoji: null,
			type: 'Thing',
		});
	});
});
