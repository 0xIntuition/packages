import { getClassification } from '@0xintuition/classifications';
import type { SchemeName } from '@0xintuition/iid';
import { SCHEME_TYPING } from '@0xintuition/iid';
import { parseCanonical } from './canonical.js';
import { SCHEME_CLASSIFICATIONS } from './classification-map.js';
import type { IidClassification, UnambiguousScheme } from './types.js';

function toResolution(slug: string): IidClassification | undefined {
	const spec = getClassification(slug);

	if (!spec) {
		return undefined;
	}

	return {
		slug: spec.slug,
		schemaType: spec.type,
		displayName: spec.displayName,
		category: spec.category,
	};
}

/**
 * Resolve a scheme (plus, for value-typed schemes, a value) to its
 * classification. Polymorphic schemes always return `undefined` — callers
 * classify Unknown/Thing and still enrich on the identifier.
 *
 * `value` may be raw or canonical; it is canonicalized before the type
 * segment is read. It is required for the value-typed schemes (`mbid`,
 * `olid`, `caip19`, `gen1`) and ignored otherwise.
 */
export function classificationForScheme(
	scheme: SchemeName,
	value?: string
): IidClassification | undefined {
	if (SCHEME_TYPING[scheme] !== 'unambiguous') {
		return undefined;
	}

	const entry = SCHEME_CLASSIFICATIONS[scheme as UnambiguousScheme];

	switch (entry.kind) {
		case 'direct':
			return toResolution(entry.slug);
		case 'unmapped':
			return undefined;
		case 'value-typed': {
			if (value === undefined) {
				return undefined;
			}

			const parsed = parseCanonical(`int:${scheme}:${value}`);

			if (!parsed) {
				return undefined;
			}

			const slug = entry.resolveSlug(parsed.value);
			return slug === undefined ? undefined : toResolution(slug);
		}
		default:
			return undefined;
	}
}

/**
 * Classify an IID string. `undefined` for polymorphic schemes, malformed or
 * uncanonicalizable IIDs, and ratified-but-unmapped schemes. Never throws.
 *
 * Non-canonical valid-grammar IIDs resolve through their canonical form —
 * they classify correctly as cluster members even though they can never be
 * elected anchor.
 */
export function classificationForIid(iid: string): IidClassification | undefined {
	const parsed = parseCanonical(iid);

	if (!parsed) {
		return undefined;
	}

	return classificationForScheme(parsed.scheme, parsed.value);
}

/**
 * Enumerate the scheme => classification pairs for schemes whose scheme
 * alone decides the classification — for consumers that build static maps.
 * Value-typed schemes (`mbid`, `olid`, `caip19`, `gen1`) are excluded: they
 * have no single classification.
 */
export function listUnambiguousSchemeClassifications(): readonly ({
	readonly scheme: UnambiguousScheme;
} & IidClassification)[] {
	const entries: ({ readonly scheme: UnambiguousScheme } & IidClassification)[] = [];

	for (const [scheme, entry] of Object.entries(SCHEME_CLASSIFICATIONS) as [
		UnambiguousScheme,
		(typeof SCHEME_CLASSIFICATIONS)[UnambiguousScheme],
	][]) {
		if (entry.kind !== 'direct') {
			continue;
		}

		const resolution = toResolution(entry.slug);

		if (resolution) {
			entries.push({ scheme, ...resolution });
		}
	}

	return entries;
}
