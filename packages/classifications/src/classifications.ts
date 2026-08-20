import type { IdentityLadder } from '@0xintuition/iid';
import { CLASSIFICATION_SPECS as GENERATED_CLASSIFICATION_SPECS } from './generated/index.js';
import type { ClassificationCategory, ClassificationSpec, PredicateKeyReference } from './types.js';

const CLASSIFICATION_SPECS_FROZEN = deepFreeze(
	GENERATED_CLASSIFICATION_SPECS.map((spec) => ({
		...spec,
		fields: [...spec.fields],
		metadataPredicates: [...spec.metadataPredicates],
	}))
) as readonly ClassificationSpec[];

const CLASSIFICATION_MAP = new Map(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => [spec.slug, spec] as const)
);

export const CLASSIFICATION_SPECS = CLASSIFICATION_SPECS_FROZEN;
export const CLASSIFICATION_SLUGS = Object.freeze(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => spec.slug)
) as readonly string[];

export function getClassification(slug: string): ClassificationSpec | undefined {
	return CLASSIFICATION_MAP.get(slug);
}

export function hasClassification(slug: string): boolean {
	return CLASSIFICATION_MAP.has(slug);
}

export function getClassificationsByCategory(
	category: ClassificationCategory
): ClassificationSpec[] {
	return CLASSIFICATION_SPECS_FROZEN.filter((spec) => spec.category === category);
}

export function getMetadataPredicatesFor(
	slug: string
): readonly PredicateKeyReference[] | undefined {
	return CLASSIFICATION_MAP.get(slug)?.metadataPredicates;
}

/**
 * A classification's identity ladder in the shape the `@0xintuition/iid`
 * derivation engine consumes (`deriveIntuitionId(ladder, values)`), or
 * `undefined` when the classification does not exist or declares no
 * identity. The gen1 hash namespace is the classification slug.
 */
export function identityLadderFor(slug: string): IdentityLadder | undefined {
	const spec = CLASSIFICATION_MAP.get(slug);

	if (!spec?.identity) {
		return undefined;
	}

	return {
		slug: spec.slug,
		identifies: spec.identity.identifies,
		rungs: spec.identity.ladder,
	};
}

function deepFreeze<T>(value: T): T {
	if (value && typeof value === 'object' && !Object.isFrozen(value)) {
		Object.freeze(value);

		for (const nestedValue of Object.values(value as Record<string, unknown>)) {
			deepFreeze(nestedValue);
		}
	}

	return value;
}
