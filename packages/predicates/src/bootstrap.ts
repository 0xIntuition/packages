import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import type { Hex } from 'viem';
import { CONTAIN_ID, HAS_TYPE_ID, LAUNCH_PREDICATE_KEYS, type LaunchPredicateKey } from './launch';
import { PREDICATE_ATOM_DATA, PREDICATE_DEFS, PREDICATE_IDS } from './predicates';
import type { MarketPattern } from './types';

const MARKET_PATTERN_DESCRIPTIONS = {
	depositional: 'Market pattern where depositors make first-person claims via the I-subject',
	attributive: 'Market pattern where the triple asserts a fact about a specific entity',
	comparative: 'Market pattern where the triple compares two entities',
} as const satisfies Record<MarketPattern, string>;

export interface PredicateAtomDefinition<TKey extends string = string> {
	key: TKey;
	atomData: string;
	atomId: Hex;
}

export interface PredicateBootstrapTripleDefinition {
	kind: 'market-pattern' | 'registry-membership';
	predicateKey: LaunchPredicateKey;
	subject: Hex;
	predicate: Hex;
	object: Hex;
}

export const MARKET_PATTERN_ATOM_DATA = {
	depositional: createPredicateAtomData('depositional', MARKET_PATTERN_DESCRIPTIONS.depositional),
	attributive: createPredicateAtomData('attributive', MARKET_PATTERN_DESCRIPTIONS.attributive),
	comparative: createPredicateAtomData('comparative', MARKET_PATTERN_DESCRIPTIONS.comparative),
} as const satisfies Record<MarketPattern, string>;

export const MARKET_PATTERN_ATOM_IDS = {
	depositional: calculateAtomId(MARKET_PATTERN_ATOM_DATA.depositional),
	attributive: calculateAtomId(MARKET_PATTERN_ATOM_DATA.attributive),
	comparative: calculateAtomId(MARKET_PATTERN_ATOM_DATA.comparative),
} as const satisfies Record<MarketPattern, Hex>;

export const MARKET_PATTERN_IDS = MARKET_PATTERN_ATOM_IDS;

export const PREDICATE_REGISTRY_ATOM_DATA = createPredicateAtomData(
	'predicate registry',
	'Canonical registry of enshrined Intuition predicates'
);
export const PREDICATE_REGISTRY_ATOM_ID = calculateAtomId(PREDICATE_REGISTRY_ATOM_DATA);
export const PREDICATE_REGISTRY_DATA = PREDICATE_REGISTRY_ATOM_DATA;
export const PREDICATE_REGISTRY_ID = PREDICATE_REGISTRY_ATOM_ID;

export const BOOTSTRAP_ATOMS = [
	{
		key: 'predicateRegistry',
		atomData: PREDICATE_REGISTRY_ATOM_DATA,
		atomId: PREDICATE_REGISTRY_ATOM_ID,
	},
	{
		key: 'depositional',
		atomData: MARKET_PATTERN_ATOM_DATA.depositional,
		atomId: MARKET_PATTERN_ATOM_IDS.depositional,
	},
	{
		key: 'attributive',
		atomData: MARKET_PATTERN_ATOM_DATA.attributive,
		atomId: MARKET_PATTERN_ATOM_IDS.attributive,
	},
	{
		key: 'comparative',
		atomData: MARKET_PATTERN_ATOM_DATA.comparative,
		atomId: MARKET_PATTERN_ATOM_IDS.comparative,
	},
] as const satisfies readonly PredicateAtomDefinition<'predicateRegistry' | MarketPattern>[];

export const LAUNCH_PREDICATE_ATOMS = LAUNCH_PREDICATE_KEYS.map((key) => ({
	key,
	atomData: PREDICATE_ATOM_DATA[key],
	atomId: PREDICATE_IDS[key],
})) as readonly PredicateAtomDefinition<LaunchPredicateKey>[];

export function getMarketPatternAtomId(pattern: MarketPattern) {
	return MARKET_PATTERN_ATOM_IDS[pattern];
}

export function getLaunchPredicateAtoms() {
	return [...LAUNCH_PREDICATE_ATOMS];
}

export function getLaunchPredicateBootstrapTriples() {
	return LAUNCH_PREDICATE_KEYS.flatMap((key) => [
		{
			kind: 'market-pattern' as const,
			predicateKey: key,
			subject: PREDICATE_IDS[key],
			predicate: HAS_TYPE_ID,
			object: getMarketPatternAtomId(PREDICATE_DEFS[key].marketPattern),
		},
		{
			kind: 'registry-membership' as const,
			predicateKey: key,
			subject: PREDICATE_REGISTRY_ATOM_ID,
			predicate: CONTAIN_ID,
			object: PREDICATE_IDS[key],
		},
	]) as readonly PredicateBootstrapTripleDefinition[];
}
