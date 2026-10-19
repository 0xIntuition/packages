import { readFileSync } from 'node:fs';

import { decodeFunctionData } from 'viem';
import { describe, expect, it } from 'vitest';

import * as protocol from './index';

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

describe('@0xintuition/protocol wrapper entrypoints', () => {
	const entrypoints: Record<string, unknown> = protocol;

	it.each([
		'atomWardenBatchGrantAtomWalletOwnership',
		'atomWardenClaimAsCreatorAfterExpiry',
		'atomWardenClaimAuthorizationTypehash',
		'atomWardenClaimCapWindow',
		'atomWardenClaimNonces',
		'atomWardenClaimOwnershipOverAddressAtom',
		'atomWardenClaimWindow',
		'atomWardenClaimWithAuthorization',
		'atomWardenClaimsInWindow',
		'atomWardenCurrentClaimWindowId',
		'atomWardenGrantAtomWalletOwnership',
		'atomWardenIncrementNonce',
		'atomWardenMaxBatchSize',
		'atomWardenMaxClaimsPerWindow',
		'atomWardenMaxValidAfter',
		'atomWardenMaxValidUntil',
		'atomWardenMinFeeThreshold',
		'atomWardenOperatorRole',
		'atomWardenSetClaimCapWindow',
		'atomWardenSetClaimWindow',
		'atomWardenSetMaxClaimsPerWindow',
		'atomWardenSetMaxValidAfter',
		'atomWardenSetMaxValidUntil',
		'atomWardenSetMinFeeThreshold',
		'atomWardenSetMultiVault',
		'atomWardenSetSignatureThreshold',
		'atomWardenSignatureThreshold',
		'atomWardenSignerCount',
		'atomWardenSignerRole',
		'bondingCurveRegistryCurveAddresses',
		'bondingCurveRegistryPreviewMint',
		'dynamicFeeFlatPriceCurveClaim',
		'dynamicFeeFlatPriceCurveClaimEncode',
		'dynamicFeeFlatPriceCurveClaimable',
		'dynamicFeeFlatPriceCurveClaimableAcross',
		'dynamicFeeFlatPriceCurveGetConfig',
		'dynamicFeeFlatPriceCurveMultiVaultAddress',
		'dynamicFeeFlatPriceCurvePendingFor',
		'dynamicFeeFlatPriceCurvePreviewRedeemFor',
		'dynamicFeeFlatPriceCurveQuoteDepositFee',
		'dynamicFeeFlatPriceCurveQuoteRedeemFee',
		'dynamicFeeFlatPriceCurveTierFeeOverride',
		'dynamicFeeFlatPriceCurveUserStake',
		'dynamicFeeFlatPriceCurveUserTier',
		'dynamicFeeFlatPriceCurveVaultStake',
		'eventParseClaimed',
		'eventParseDepositBandRecorded',
		'eventParseDepositRecorded',
		'multiVaultApproveEncode',
		'multiVaultCreateAtomsFor',
		'multiVaultCreateAtomsForEncode',
		'multiVaultCreateTriplesFor',
		'multiVaultCreateTriplesForEncode',
		'multiVaultIsApprovedToCreate',
		'multiVaultIsApprovedToDeposit',
		'multiVaultIsApprovedToRedeem',
		'multiVaultMulticall',
		'multiVaultMulticallEncode',
	])('exports %s', (name) => {
		expect(entrypoints[name]).toBeTypeOf('function');
	});

	it('exports the new ABIs and deployment bytecode', () => {
		expect(entrypoints.AtomWardenAbi).toEqual(expect.any(Array));
		expect(entrypoints.DynamicFeeFlatPriceCurveAbi).toEqual(expect.any(Array));
		expect(entrypoints.AtomWardenBytecode).toMatch(/^0x[0-9a-f]+$/i);
		expect(entrypoints.DynamicFeeFlatPriceCurveBytecode).toMatch(/^0x[0-9a-f]+$/i);
	});

	it('exports every approval bit combination as a plain object', () => {
		expect(entrypoints.ApprovalTypes).toEqual({
			NONE: 0,
			DEPOSIT: 1,
			REDEMPTION: 2,
			BOTH: 3,
			CREATION: 4,
			DEPOSIT_AND_CREATION: 5,
			REDEMPTION_AND_CREATION: 6,
			ALL: 7,
		});
	});

	it('encodes creator attribution and explicit multicall value allocations', () => {
		const creator = '0x1111111111111111111111111111111111111111';
		const approval = protocol.multiVaultApproveEncode(creator, protocol.ApprovalTypes.CREATION);
		const atoms = protocol.multiVaultCreateAtomsForEncode(creator, ['0x1234'], [9n]);
		const subject = `0x${'11'.repeat(32)}` as const;
		const predicate = `0x${'22'.repeat(32)}` as const;
		const object = `0x${'33'.repeat(32)}` as const;
		const triples = protocol.multiVaultCreateTriplesForEncode(
			creator,
			[subject],
			[predicate],
			[object],
			[7n]
		);
		const decode = (data: `0x${string}`) =>
			decodeFunctionData({ abi: protocol.MultiVaultAbi, data });

		expect(decode(approval)).toEqual({ functionName: 'approve', args: [creator, 4] });
		expect(decode(atoms)).toEqual({
			functionName: 'createAtomsFor',
			args: [creator, ['0x1234'], [9n]],
		});
		expect(decode(triples)).toEqual({
			functionName: 'createTriplesFor',
			args: [creator, [subject], [predicate], [object], [7n]],
		});
		expect(
			decode(protocol.multiVaultMulticallEncode([approval, atoms, triples], [0n, 9n, 7n]))
		).toEqual({
			functionName: 'multicall',
			args: [
				[approval, atoms, triples],
				[0n, 9n, 7n],
			],
		});
	});
});
