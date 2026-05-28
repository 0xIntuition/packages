import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { PREDICATE_SPECS } from './generated/predicate-specs';
import type { PredicateDefinition, PredicateStatus } from './types';

type PredicateSpec = (typeof PREDICATE_SPECS)[number];

export type PredicateKey = PredicateSpec['key'];
export type PredicateId = ReturnType<typeof calculateAtomId>;

export type PredicateRecord = PredicateDefinition & {
	key: PredicateKey;
	status: PredicateStatus;
};

export const PREDICATE_RECORDS = PREDICATE_SPECS.map((spec) => {
	const record: PredicateRecord = {
		key: spec.key,
		name: spec.name,
		description: spec.description,
		marketPattern: spec.marketPattern,
		conjugates: spec.conjugates,
		category: spec.category,
		status: spec.status,
		isTransitive:
			'isTransitive' in spec && typeof spec.isTransitive === 'boolean' ? spec.isTransitive : false,
		isSymmetric:
			'isSymmetric' in spec && typeof spec.isSymmetric === 'boolean' ? spec.isSymmetric : false,
		isHierarchical:
			'isHierarchical' in spec && typeof spec.isHierarchical === 'boolean'
				? spec.isHierarchical
				: false,
	};

	if ('thirdPerson' in spec && typeof spec.thirdPerson === 'string') {
		record.thirdPerson = spec.thirdPerson;
	}

	if ('examples' in spec && Array.isArray(spec.examples)) {
		record.examples = spec.examples;
	}

	if ('inversePredicate' in spec && typeof spec.inversePredicate === 'string') {
		record.inversePredicate = spec.inversePredicate;
	}

	return record;
});

export const PREDICATE_DEFS = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key, status, ...definition }) => [key, definition])
) as Record<PredicateKey, PredicateDefinition>;

export const PREDICATE_STATUSES = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key, status }) => [key, status])
) as Record<PredicateKey, PredicateStatus>;

export const PREDICATE_NAME_TO_KEY = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key, name }) => [name.toLowerCase(), key])
) as Record<string, PredicateKey>;

export const PREDICATE_ATOM_DATA = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key, name, description }) => [
		key,
		createPredicateAtomData(name, description),
	])
) as Record<PredicateKey, string>;

export const PREDICATE_IDS = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key }) => [key, calculateAtomId(PREDICATE_ATOM_DATA[key])])
) as Record<PredicateKey, ReturnType<typeof calculateAtomId>>;

export const PREDICATE_ID_TO_KEY = Object.fromEntries(
	PREDICATE_RECORDS.map(({ key }) => [PREDICATE_IDS[key], key])
) as Record<PredicateId, PredicateKey>;

export function getPredicateRecord(key: PredicateKey) {
	return PREDICATE_RECORDS.find((predicate) => predicate.key === key);
}

export function getPredicateRecordByName(name: string) {
	const key = PREDICATE_NAME_TO_KEY[name.trim().toLowerCase()];

	return key ? getPredicateRecord(key) : undefined;
}

export function getPredicateByKey(key: PredicateKey) {
	return PREDICATE_DEFS[key];
}

export function getPredicateByName(name: string) {
	const key = PREDICATE_NAME_TO_KEY[name.trim().toLowerCase()];

	return key ? PREDICATE_DEFS[key] : undefined;
}

export function getPredicateKeyById(predicateId: string) {
	return PREDICATE_ID_TO_KEY[predicateId as keyof typeof PREDICATE_ID_TO_KEY];
}

export function getPredicateById(predicateId: string) {
	const key = getPredicateKeyById(predicateId);

	return key ? getPredicateRecord(key) : undefined;
}

export function getPredicateStatus(key: PredicateKey) {
	return PREDICATE_STATUSES[key];
}

export function getPredicatesByStatus(status: PredicateStatus) {
	return PREDICATE_RECORDS.filter((predicate) => predicate.status === status);
}

export function getPredicateAtomData(key: PredicateKey) {
	return PREDICATE_ATOM_DATA[key];
}

export function getPredicateId(key: PredicateKey) {
	return PREDICATE_IDS[key];
}

export function isPredicateId(predicateId: string): predicateId is PredicateId {
	return predicateId in PREDICATE_ID_TO_KEY;
}

export function getPredicatesByCategory(category: PredicateRecord['category']) {
	return PREDICATE_RECORDS.filter((predicate) => predicate.category === category);
}

export function getPredicatesByMarketPattern(pattern: PredicateRecord['marketPattern']) {
	return PREDICATE_RECORDS.filter((predicate) => predicate.marketPattern === pattern);
}
