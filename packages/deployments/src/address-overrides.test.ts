import { getAddress } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	type AddressOverrides,
	AddressOverridesParseError,
	hasAddressOverrides,
	INTUITION_DEPLOYMENT_NAMES,
	isIntuitionDeploymentName,
	listOverriddenContractNames,
	mergeAddressOverrides,
	parseAddressOverrides,
	resolveContractAddressSet,
	summarizeContractAddressSet,
} from './address-overrides.js';
import { type IntuitionDeploymentName, intuitionDeployments } from './deployments.js';
import { getContractAddressFromChainId, getMultiVaultAddressFromChainId } from './helpers.js';
import { intuitionMainnet, intuitionTestnet } from './networks.js';

const STAGING_SET_13579 = {
	MultiVault: '0x53967Bbf23c176DbC7cd68312d7a07989b317771',
	AtomWarden: '0x35053b0C8eC86a423467F8c895BF81c201812113',
	AtomWalletFactory: '0x60fc0fc01faFCBC8905d8764B7B6fc4B737a6542',
	SatelliteEmissionsController: '0xa648c92a5f061B835A89d35023ade3d7a8D365C2',
	TrustBonding: '0xf25226B6339Afd6841f86F4a543928b6C8c3B008',
	BondingCurveRegistry: '0x03514598D77A8B15e292367e3e42ADF8f36c6643',
	LinearCurve: '0x358216B07f242e2Cb0d89dC5378657D90261C8a2',
	OffsetProgressiveCurve: '0xFd9C65eE0D2192abb63D305449Ca81da30b6b4C4',
} as const satisfies Partial<Record<IntuitionDeploymentName, `0x${string}`>>;

const STAGING_BLOB_13579 = JSON.stringify(
	Object.fromEntries(
		Object.entries(STAGING_SET_13579).map(([name, address]) => [
			name,
			{ [String(intuitionTestnet.id)]: address },
		])
	)
);

const TESTNET = intuitionTestnet.id;
const MAINNET = intuitionMainnet.id;

describe('parseAddressOverrides', () => {
	it('parses the staging blob into a numeric-keyed AddressOverrides map', () => {
		const parsed = parseAddressOverrides(STAGING_BLOB_13579);

		expect(Object.keys(parsed).sort()).toEqual(Object.keys(STAGING_SET_13579).sort());
		for (const [name, address] of Object.entries(STAGING_SET_13579)) {
			const perChain = parsed[name as IntuitionDeploymentName];
			expect(perChain).toBeDefined();
			// keys are coerced to numbers: numeric access works and there is no
			// leftover string-keyed duplicate.
			expect(perChain?.[TESTNET]).toBe(address);
			expect(Object.keys(perChain ?? {})).toEqual([String(TESTNET)]);
			expect(perChain?.[MAINNET]).toBeUndefined();
		}
	});

	it('every staging address differs from the canonical 13579 map (the blob is not a no-op)', () => {
		const parsed = parseAddressOverrides(STAGING_BLOB_13579);
		for (const name of Object.keys(STAGING_SET_13579) as IntuitionDeploymentName[]) {
			const canonical = intuitionDeployments[name]?.[TESTNET];
			expect(canonical).toBeDefined();
			expect(parsed[name]?.[TESTNET]).not.toBe(canonical);
		}
	});

	it('checksum-normalizes lowercase and uppercase addresses', () => {
		const lower = STAGING_SET_13579.MultiVault.toLowerCase();
		const upper = `0x${STAGING_SET_13579.TrustBonding.slice(2).toUpperCase()}`;
		const parsed = parseAddressOverrides(
			JSON.stringify({
				MultiVault: { '13579': lower },
				TrustBonding: { '13579': upper },
			})
		);
		expect(parsed.MultiVault?.[TESTNET]).toBe(STAGING_SET_13579.MultiVault);
		expect(parsed.TrustBonding?.[TESTNET]).toBe(STAGING_SET_13579.TrustBonding);
		expect(parsed.MultiVault?.[TESTNET]).toBe(getAddress(lower));
	});

	it('supports several chain ids under one contract name and trims chain keys', () => {
		const parsed = parseAddressOverrides(
			JSON.stringify({
				MultiVault: {
					' 13579 ': STAGING_SET_13579.MultiVault,
					'31337': '0x0000000000000000000000000000000000000001',
				},
			})
		);
		expect(parsed.MultiVault?.[TESTNET]).toBe(STAGING_SET_13579.MultiVault);
		expect(parsed.MultiVault?.[31_337]).toBe('0x0000000000000000000000000000000000000001');
	});

	it.each([
		['undefined', undefined],
		['null', null],
		['empty string', ''],
		['whitespace', '   \n\t '],
	])('returns an empty map for %s input (no overrides)', (_label, input) => {
		expect(parseAddressOverrides(input)).toEqual({});
	});

	it('returns an empty map for an empty JSON object', () => {
		expect(parseAddressOverrides('{}')).toEqual({});
	});

	it('rejects invalid JSON with a message naming the reason', () => {
		expect(() => parseAddressOverrides('{"MultiVault":')).toThrow(AddressOverridesParseError);
		expect(() => parseAddressOverrides('{"MultiVault":')).toThrow(/not valid JSON/);
	});

	it.each([
		['array', '[]'],
		['string', '"MultiVault"'],
		['number', '13579'],
		['null literal', 'null'],
	])('rejects a top-level %s', (_label, input) => {
		expect(() => parseAddressOverrides(input)).toThrow(/expected a JSON object/);
	});

	it('rejects unknown contract names and lists the known ones', () => {
		const attempt = () =>
			parseAddressOverrides(
				JSON.stringify({ FeeProxy: { '13579': STAGING_SET_13579.MultiVault } })
			);
		expect(attempt).toThrow(AddressOverridesParseError);
		expect(attempt).toThrow(/unknown contract name "FeeProxy"/);
		expect(attempt).toThrow(/MultiVault/);
	});

	it('is case-sensitive on contract names', () => {
		expect(() =>
			parseAddressOverrides(
				JSON.stringify({ multivault: { '13579': STAGING_SET_13579.MultiVault } })
			)
		).toThrow(/unknown contract name "multivault"/);
	});

	it.each([
		['string', '"0x53967Bbf23c176DbC7cd68312d7a07989b317771"'],
		['array', '["0x53967Bbf23c176DbC7cd68312d7a07989b317771"]'],
		['null', 'null'],
	])('rejects a contract value that is not a chain map (%s)', (_label, value) => {
		expect(() => parseAddressOverrides(`{"MultiVault":${value}}`)).toThrow(
			/"MultiVault" must map chain ids to addresses/
		);
	});

	it.each([
		['testnet'],
		['13579.5'],
		['-1'],
		['0'],
		['013579'],
		['0x35EB'],
		['1e4'],
		[''],
	])('rejects non-numeric chain id key %j', (chainKey) => {
		expect(() =>
			parseAddressOverrides(
				JSON.stringify({ MultiVault: { [chainKey]: STAGING_SET_13579.MultiVault } })
			)
		).toThrow(/"MultiVault" has non-numeric chain id key/);
	});

	it('rejects a chain id beyond the safe-integer range', () => {
		expect(() =>
			parseAddressOverrides(
				JSON.stringify({ MultiVault: { '99999999999999999999': STAGING_SET_13579.MultiVault } })
			)
		).toThrow(/not a safe integer/);
	});

	it.each([
		['too short', '0x1234'],
		['no 0x prefix', '53967Bbf23c176DbC7cd68312d7a07989b317771'],
		['non-hex chars', '0xZZ967Bbf23c176DbC7cd68312d7a07989b317771'],
		['41 hex chars', '0x53967Bbf23c176DbC7cd68312d7a07989b3177711'],
		['number', 12_345],
		['null', null],
		['object', { address: '0x53967Bbf23c176DbC7cd68312d7a07989b317771' }],
	])('rejects an invalid address (%s) and names the (name, chainId)', (_label, value) => {
		const attempt = () =>
			parseAddressOverrides(JSON.stringify({ TrustBonding: { '13579': value } }));
		expect(attempt).toThrow(AddressOverridesParseError);
		expect(attempt).toThrow(/"TrustBonding"\[13579\] is not a valid EVM address/);
	});

	it('rejects a mixed-case address whose EIP-55 checksum is wrong (probable typo)', () => {
		const good = STAGING_SET_13579.MultiVault;
		// Flip the case of the first hex LETTER after 0x -> checksum no longer matches.
		const letterIndex = good
			.split('')
			.findIndex((char, index) => index >= 2 && /[a-f]/i.test(char));
		expect(letterIndex).toBeGreaterThan(1);
		const letter = good[letterIndex] as string;
		const flippedLetter =
			letter === letter.toLowerCase() ? letter.toUpperCase() : letter.toLowerCase();
		const flipped = `${good.slice(0, letterIndex)}${flippedLetter}${good.slice(letterIndex + 1)}`;
		expect(flipped).not.toBe(good);
		expect(flipped.toLowerCase()).toBe(good.toLowerCase());
		expect(() =>
			parseAddressOverrides(JSON.stringify({ MultiVault: { '13579': flipped } }))
		).toThrow(/is not a valid EVM address/);
	});

	it('fails on the first bad key even when other keys are valid', () => {
		const blob = JSON.stringify({
			MultiVault: { '13579': STAGING_SET_13579.MultiVault },
			TrustBonding: { '13579': 'nope' },
		});
		expect(() => parseAddressOverrides(blob)).toThrow(/"TrustBonding"\[13579\]/);
	});

	it('rejects a top-level "__proto__" key as an unknown contract name (no prototype pollution)', () => {
		const blob = `{"__proto__":{"13579":"${STAGING_SET_13579.MultiVault}"}}`;
		expect(() => parseAddressOverrides(blob)).toThrow(/unknown contract name "__proto__"/);
		expect(Object.hasOwn(Object.prototype, '13579')).toBe(false);
	});

	it('rejects two chain keys that collide after trimming instead of letting the last one win', () => {
		const blob = JSON.stringify({
			MultiVault: {
				'13579': STAGING_SET_13579.MultiVault,
				' 13579': '0x0000000000000000000000000000000000000001',
			},
		});
		const attempt = () => parseAddressOverrides(blob);
		expect(attempt).toThrow(AddressOverridesParseError);
		expect(attempt).toThrow(/"MultiVault" lists chain id 13579 more than once/);
	});

	it('labels the error message with the source exactly once when given', () => {
		const attempt = () =>
			parseAddressOverrides('{"MultiVault":', { source: 'INTUITION_CONTRACT_ADDRESS_OVERRIDES' });
		expect(attempt).toThrow(AddressOverridesParseError);
		expect(attempt).toThrow(
			/^Invalid contract address overrides \(INTUITION_CONTRACT_ADDRESS_OVERRIDES\): not valid JSON/
		);
		try {
			attempt();
		} catch (error) {
			expect(error).toBeInstanceOf(AddressOverridesParseError);
			expect((error as AddressOverridesParseError).source).toBe(
				'INTUITION_CONTRACT_ADDRESS_OVERRIDES'
			);
			expect(
				(error as AddressOverridesParseError).message.match(/INTUITION_CONTRACT_ADDRESS_OVERRIDES/g)
			).toHaveLength(1);
		}
		// unlabelled: unchanged shape
		expect(() => parseAddressOverrides('{"MultiVault":')).toThrow(
			/^Invalid contract address overrides: not valid JSON/
		);
	});
});

describe('hasAddressOverrides', () => {
	it('is false for undefined, {}, and empty per-name objects', () => {
		expect(hasAddressOverrides(undefined)).toBe(false);
		expect(hasAddressOverrides({})).toBe(false);
		expect(hasAddressOverrides({ MultiVault: {} })).toBe(false);
		expect(hasAddressOverrides(parseAddressOverrides('{"MultiVault":{}}'))).toBe(false);
	});

	it('is true as soon as one (name, chainId) entry exists', () => {
		expect(hasAddressOverrides({ MultiVault: { [TESTNET]: STAGING_SET_13579.MultiVault } })).toBe(
			true
		);
		expect(hasAddressOverrides(parseAddressOverrides(STAGING_BLOB_13579))).toBe(true);
	});
});

describe('isIntuitionDeploymentName / INTUITION_DEPLOYMENT_NAMES', () => {
	it('mirrors the canonical map keys exactly', () => {
		expect([...INTUITION_DEPLOYMENT_NAMES].sort()).toEqual(
			Object.keys(intuitionDeployments).sort()
		);
		for (const name of INTUITION_DEPLOYMENT_NAMES) {
			expect(isIntuitionDeploymentName(name)).toBe(true);
		}
		expect(isIntuitionDeploymentName('FeeProxy')).toBe(false);
		expect(isIntuitionDeploymentName('toString')).toBe(false);
		expect(isIntuitionDeploymentName('__proto__')).toBe(false);
	});
});

describe('mergeAddressOverrides', () => {
	const legacy: AddressOverrides = {
		MultiVault: { [TESTNET]: '0xa459000000000000000000000000000000000459' },
	};

	it('returns undefined when every layer is empty or undefined', () => {
		expect(mergeAddressOverrides()).toBeUndefined();
		expect(mergeAddressOverrides(undefined, undefined)).toBeUndefined();
		expect(mergeAddressOverrides({}, undefined, {})).toBeUndefined();
		expect(mergeAddressOverrides({ MultiVault: {} })).toBeUndefined();
	});

	it('later layers win per (name, chainId) and untouched entries survive', () => {
		const blob = parseAddressOverrides(STAGING_BLOB_13579);
		const merged = mergeAddressOverrides(legacy, blob);
		expect(merged?.MultiVault?.[TESTNET]).toBe(STAGING_SET_13579.MultiVault);
		expect(merged?.TrustBonding?.[TESTNET]).toBe(STAGING_SET_13579.TrustBonding);
	});

	it('is order-sensitive: swapping layers swaps the winner', () => {
		const blob = parseAddressOverrides(STAGING_BLOB_13579);
		const merged = mergeAddressOverrides(blob, legacy);
		expect(merged?.MultiVault?.[TESTNET]).toBe(legacy.MultiVault?.[TESTNET]);
		// non-conflicting keys from the lower layer are still present
		expect(merged?.TrustBonding?.[TESTNET]).toBe(STAGING_SET_13579.TrustBonding);
	});

	it('merges different chain ids of the same contract from different layers', () => {
		const local: AddressOverrides = {
			MultiVault: { 31337: '0x0000000000000000000000000000000000000001' },
		};
		const merged = mergeAddressOverrides(local, legacy);
		expect(merged?.MultiVault?.[31_337]).toBe('0x0000000000000000000000000000000000000001');
		expect(merged?.MultiVault?.[TESTNET]).toBe(legacy.MultiVault?.[TESTNET]);
	});

	it('does not mutate its inputs', () => {
		const legacyCopy = structuredClone(legacy);
		const blob = parseAddressOverrides(STAGING_BLOB_13579);
		const blobCopy = structuredClone(blob);
		mergeAddressOverrides(legacy, blob);
		expect(legacy).toEqual(legacyCopy);
		expect(blob).toEqual(blobCopy);
	});
});

describe('precedence through getContractAddressFromChainId (blob > legacy > map)', () => {
	const legacy: AddressOverrides = {
		MultiVault: { [TESTNET]: '0xa459000000000000000000000000000000000459' },
	};
	const canonicalMultiVault = intuitionDeployments.MultiVault[TESTNET];

	it('map when nothing is set', () => {
		expect(getMultiVaultAddressFromChainId(TESTNET, mergeAddressOverrides())).toBe(
			canonicalMultiVault
		);
	});

	it('legacy beats map', () => {
		expect(getMultiVaultAddressFromChainId(TESTNET, mergeAddressOverrides(legacy))).toBe(
			legacy.MultiVault?.[TESTNET]
		);
	});

	it('blob beats legacy and map; non-blob names still come from the map', () => {
		const overrides = mergeAddressOverrides(legacy, parseAddressOverrides(STAGING_BLOB_13579));
		expect(getMultiVaultAddressFromChainId(TESTNET, overrides)).toBe(STAGING_SET_13579.MultiVault);
		expect(getContractAddressFromChainId('TrustBonding', TESTNET, overrides)).toBe(
			STAGING_SET_13579.TrustBonding
		);
		expect(getContractAddressFromChainId('AtomWarden', TESTNET, overrides)).toBe(
			STAGING_SET_13579.AtomWarden
		);
		expect(getContractAddressFromChainId('EntryPoint', TESTNET, overrides)).toBe(
			intuitionDeployments.EntryPoint[TESTNET]
		);
		// mainnet untouched
		expect(getMultiVaultAddressFromChainId(MAINNET, overrides)).toBe(
			intuitionDeployments.MultiVault[MAINNET]
		);
	});
});

describe('resolveContractAddressSet', () => {
	it('returns the canonical 13579 set when no overrides are given', () => {
		const set = resolveContractAddressSet(TESTNET);
		for (const name of INTUITION_DEPLOYMENT_NAMES) {
			const canonical = intuitionDeployments[name]?.[TESTNET];
			if (canonical) {
				expect(set[name]).toBe(canonical);
			} else {
				expect(set).not.toHaveProperty(name);
			}
		}
		// Base-only contracts never appear on 13579
		expect(set.Trust).toBeUndefined();
		expect(set.BaseEmissionsController).toBeUndefined();
	});

	it('reflects the staging blob for the 8 overridden names and the map for the rest', () => {
		const overrides = parseAddressOverrides(STAGING_BLOB_13579);
		const set = resolveContractAddressSet(TESTNET, overrides);
		for (const [name, address] of Object.entries(STAGING_SET_13579)) {
			expect(set[name as IntuitionDeploymentName]).toBe(address);
		}
		expect(set.WrappedTrust).toBe(intuitionDeployments.WrappedTrust[TESTNET]);
		expect(set.AtomWarden).toBe(STAGING_SET_13579.AtomWarden);
		expect(set.AtomWalletBeacon).toBe(intuitionDeployments.AtomWalletBeacon[TESTNET]);
		expect(set.EntryPoint).toBe(intuitionDeployments.EntryPoint[TESTNET]);
	});

	it('includes an override for a chain the map does not know', () => {
		const set = resolveContractAddressSet(31_337, {
			MultiVault: { 31337: '0x0000000000000000000000000000000000000001' },
		});
		expect(set).toEqual({ MultiVault: '0x0000000000000000000000000000000000000001' });
	});
});

describe('listOverriddenContractNames', () => {
	it('lists exactly the names whose address differs from the map on the requested chain', () => {
		const overrides = mergeAddressOverrides(
			{ MultiVault: { 31337: '0x0000000000000000000000000000000000000001' } },
			parseAddressOverrides(STAGING_BLOB_13579)
		);
		expect(listOverriddenContractNames(TESTNET, overrides).sort()).toEqual(
			Object.keys(STAGING_SET_13579).sort()
		);
		// chain unknown to the map: the override is the only address -> listed
		expect(listOverriddenContractNames(31_337, overrides)).toEqual(['MultiVault']);
		expect(listOverriddenContractNames(MAINNET, overrides)).toEqual([]);
		expect(listOverriddenContractNames(TESTNET, undefined)).toEqual([]);
	});

	it('does not list an override equal to the canonical value (a no-op is not "overridden")', () => {
		const overrides: AddressOverrides = {
			MultiVault: { [TESTNET]: intuitionDeployments.MultiVault[TESTNET] as `0x${string}` },
			TrustBonding: { [TESTNET]: STAGING_SET_13579.TrustBonding },
		};
		expect(listOverriddenContractNames(TESTNET, overrides)).toEqual(['TrustBonding']);
	});
});

describe('summarizeContractAddressSet', () => {
	it('combines the differing names and the resolved set for the chain', () => {
		const overrides = parseAddressOverrides(STAGING_BLOB_13579);
		const summary = summarizeContractAddressSet(TESTNET, overrides);
		expect(summary.chainId).toBe(TESTNET);
		expect([...summary.overridden].sort()).toEqual(Object.keys(STAGING_SET_13579).sort());
		expect(summary.resolvedSet).toEqual(resolveContractAddressSet(TESTNET, overrides));
		expect(summary.resolvedSet.MultiVault).toBe(STAGING_SET_13579.MultiVault);
		expect(summary.resolvedSet.AtomWarden).toBe(STAGING_SET_13579.AtomWarden);
		expect(Object.keys(summary).sort()).toEqual(['chainId', 'overridden', 'resolvedSet']);
	});

	it('is the canonical set with nothing overridden when no overrides are given', () => {
		const summary = summarizeContractAddressSet(TESTNET);
		expect(summary.overridden).toEqual([]);
		expect(summary.resolvedSet).toEqual(resolveContractAddressSet(TESTNET));
	});

	it('serializes to a single JSON line (what the consumers log)', () => {
		const line = JSON.stringify(
			summarizeContractAddressSet(TESTNET, parseAddressOverrides(STAGING_BLOB_13579))
		);
		expect(line).not.toContain('\n');
		expect(JSON.parse(line).resolvedSet.MultiVault).toBe(STAGING_SET_13579.MultiVault);
	});
});

describe('parser error message parity', () => {
	it.each([
		['[]', 'expected a JSON object keyed by contract name (e.g. {"MultiVault":{"13579":"0x…"}})'],
		[
			'{"Unknown":{}}',
			`unknown contract name "Unknown" (known: ${INTUITION_DEPLOYMENT_NAMES.join(', ')})`,
		],
		['{"MultiVault":null}', '"MultiVault" must map chain ids to addresses (e.g. {"13579":"0x…"})'],
		['{"MultiVault":{"01":"0x1234"}}', '"MultiVault" has non-numeric chain id key "01"'],
		[
			'{"MultiVault":{"9007199254740992":"0x1234"}}',
			'"MultiVault" chain id "9007199254740992" is not a safe integer',
		],
		[
			'{"MultiVault":{"1":"0x0000000000000000000000000000000000000001"," 1":"0x1234"}}',
			'"MultiVault" lists chain id 1 more than once (keys differ only by whitespace)',
		],
		['{"MultiVault":{"1":null}}', '"MultiVault"[1] is not a valid EVM address (got null)'],
	])('retains the exact reference message for %s', (input, reason) => {
		for (const source of [undefined, '', 'caller']) {
			const label = source ? ` (${source})` : '';
			expect(() => parseAddressOverrides(input, { source })).toThrow(
				new AddressOverridesParseError(reason, source)
			);
			try {
				parseAddressOverrides(input, { source });
			} catch (error) {
				expect((error as Error).message).toBe(
					`Invalid contract address overrides${label}: ${reason}`
				);
			}
		}
	});
});
