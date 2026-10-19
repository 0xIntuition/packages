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

const CLASSIFICATION_TYPE_MAP = new Map(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => [spec.type, spec] as const)
);

const resolveClassificationReference = buildClassificationReferenceResolver(
	CLASSIFICATION_SPECS_FROZEN
);

export const CLASSIFICATION_SPECS = CLASSIFICATION_SPECS_FROZEN;
export const CLASSIFICATION_SLUGS = Object.freeze(
	CLASSIFICATION_SPECS_FROZEN.map((spec) => spec.slug)
) as readonly string[];

export function getClassification(slug: string): ClassificationSpec | undefined {
	return CLASSIFICATION_MAP.get(slug);
}

export function getClassificationByType(type: string): ClassificationSpec | undefined {
	return CLASSIFICATION_TYPE_MAP.get(type);
}

/**
 * Resolve a public classification reference using explicit precedence: canonical slug,
 * canonical schema type, unique common name, unique display name, then unique atom category.
 * Comparisons after the slug tier are case-insensitive and trimmed. An ambiguous tier falls
 * through to the next tier; a reference ambiguous everywhere it appears remains unresolved.
 */
export function getClassificationByReference(reference: string): ClassificationSpec | undefined {
	return resolveClassificationReference(reference);
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

/**
 * The label frontends should RENDER for a classification: the vernacular
 * `commonName` when a spec defines one (e.g. MusicRecording → "Song",
 * MusicGroup → "Band"), otherwise the canonical `displayName`. Matching,
 * storage, and protocol logic must keep using `displayName`/`type` — this is
 * presentation only.
 */
export function getClassificationLabel(
	spec: Pick<ClassificationSpec, 'displayName' | 'commonName'>
): string {
	return spec.commonName ?? spec.displayName;
}

export function buildClassificationReferenceResolver(
	specs: readonly ClassificationSpec[]
): (reference: string) => ClassificationSpec | undefined {
	const [slugs, types, commonNames, displayNames, atomCategories] = [
		(spec: ClassificationSpec) => spec.slug,
		(spec: ClassificationSpec) => spec.type,
		(spec: ClassificationSpec) => spec.commonName,
		(spec: ClassificationSpec) => spec.displayName,
		(spec: ClassificationSpec) => spec.atomCategory,
	].map((readReference) => buildClassificationReferenceTier(specs, readReference));

	return (reference) => {
		const trimmed = reference.trim();
		const caseInsensitive = trimmed.toLowerCase();
		for (const [tier, normalized] of [
			[slugs, caseInsensitive],
			[types, caseInsensitive],
			[commonNames, caseInsensitive],
			[displayNames, caseInsensitive],
			[atomCategories, caseInsensitive],
		] as const) {
			const candidates = tier?.get(normalized);
			if (candidates?.size === 1) {
				return candidates.values().next().value;
			}
		}
		return undefined;
	};
}

// Every tier is case-insensitive (a canonical slug typed in any case must still beat
// an alias owned by another spec); precedence between tiers is what keeps canonical
// slugs and schema types ahead of aliases.
function buildClassificationReferenceTier(
	specs: readonly ClassificationSpec[],
	readReference: (spec: ClassificationSpec) => string | undefined
): Map<string, Set<ClassificationSpec>> {
	const candidates = new Map<string, Set<ClassificationSpec>>();
	for (const spec of specs) {
		const reference = readReference(spec)?.trim();
		if (!reference) continue;
		const normalized = reference.toLowerCase();
		const existing = candidates.get(normalized);
		if (existing) {
			existing.add(spec);
		} else {
			candidates.set(normalized, new Set([spec]));
		}
	}
	return candidates;
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
