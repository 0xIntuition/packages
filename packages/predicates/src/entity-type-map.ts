import { ENTITY_PREDICATE_MAP_DATA } from './generated/entity-map-data';
import type { PredicateKey } from './predicates';

export type EntityType =
	| 'Person'
	| 'Organization'
	| 'Software'
	| 'ERC20Token'
	| 'Event'
	| 'Article'
	| 'Product'
	| 'Collection'
	| 'Location'
	| 'DefinedTerm'
	| 'SocialMediaAccount'
	| 'EthereumSmartContract';

export type PredicatePriority = 'core' | 'common' | 'optional';

export interface EntityPredicateEntry {
	predicateKey: PredicateKey;
	expectedObjectType: string;
	priority: PredicatePriority;
}

export const ENTITY_TYPES = [
	'Person',
	'Organization',
	'Software',
	'ERC20Token',
	'Event',
	'Article',
	'Product',
	'Collection',
	'Location',
	'DefinedTerm',
	'SocialMediaAccount',
	'EthereumSmartContract',
] as const satisfies readonly EntityType[];

export const UNIVERSAL_PREDICATE_ENTRIES = [
	{ predicateKey: 'hasType', expectedObjectType: 'DefinedTerm', priority: 'core' },
	{ predicateKey: 'hasTag', expectedObjectType: 'DefinedTerm', priority: 'core' },
	{ predicateKey: 'hasCategory', expectedObjectType: 'DefinedTerm', priority: 'common' },
	{ predicateKey: 'url', expectedObjectType: 'URL', priority: 'common' },
	{ predicateKey: 'imgUrl', expectedObjectType: 'ImageURL', priority: 'common' },
	{ predicateKey: 'hasDescription', expectedObjectType: 'String', priority: 'common' },
	{ predicateKey: 'sameAs', expectedObjectType: 'Same entity type', priority: 'common' },
	{ predicateKey: 'contain', expectedObjectType: 'Any', priority: 'optional' },
	{
		predicateKey: 'createdBy',
		expectedObjectType: 'Person / Organization',
		priority: 'common',
	},
	{ predicateKey: 'like', expectedObjectType: 'Any', priority: 'common' },
] as const satisfies readonly EntityPredicateEntry[];

export const ENTITY_PREDICATE_MAP = ENTITY_PREDICATE_MAP_DATA as Record<
	EntityType,
	readonly EntityPredicateEntry[]
>;

const UNIVERSAL_PREDICATE_KEYS = new Set<PredicateKey>(
	UNIVERSAL_PREDICATE_ENTRIES.map((entry) => entry.predicateKey)
);

function buildUniversalEntry(
	entityType: EntityType,
	entry: (typeof UNIVERSAL_PREDICATE_ENTRIES)[number]
) {
	return {
		...entry,
		expectedObjectType:
			entry.expectedObjectType === 'Same entity type' ? entityType : entry.expectedObjectType,
	};
}

export function getPredicatesForEntityType(entityType: EntityType, priority?: PredicatePriority) {
	const entries = [...ENTITY_PREDICATE_MAP[entityType]];
	const existingKeys = new Set(entries.map((entry) => entry.predicateKey));

	for (const universalEntry of UNIVERSAL_PREDICATE_ENTRIES) {
		if (!existingKeys.has(universalEntry.predicateKey)) {
			entries.push(buildUniversalEntry(entityType, universalEntry));
		}
	}

	if (!priority) {
		return entries;
	}

	return entries.filter((entry) => entry.priority === priority);
}

export function getEntityTypesForPredicate(key: PredicateKey) {
	if (UNIVERSAL_PREDICATE_KEYS.has(key)) {
		return [...ENTITY_TYPES];
	}

	return ENTITY_TYPES.filter((entityType) =>
		ENTITY_PREDICATE_MAP[entityType].some((entry) => entry.predicateKey === key)
	);
}

export function isPredicateValidForEntityType(key: PredicateKey, entityType: EntityType) {
	return (
		UNIVERSAL_PREDICATE_KEYS.has(key) ||
		ENTITY_PREDICATE_MAP[entityType].some((entry) => entry.predicateKey === key)
	);
}
