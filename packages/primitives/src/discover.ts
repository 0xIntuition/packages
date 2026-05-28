import {
	CLASSIFICATION_SPECS,
	type ClassificationCategory,
	getClassification,
	getClassificationsByCategory,
} from '@0xintuition/classifications';

import type { ClassificationSummary, FieldInfo } from './types.js';

/**
 * List available classifications, optionally filtered by category.
 *
 * When called without arguments, returns all 37 classification types. Pass a
 * category string to narrow the results.
 *
 * @example
 * ```ts
 * // All classifications
 * const all = listClassifications();
 *
 * // Only entity classifications
 * const entities = listClassifications('Entity');
 * // => [{ slug: 'brand', ... }, { slug: 'company', ... }, { slug: 'defined-term', ... }, { slug: 'person', ... }, ...]
 * ```
 *
 * @param category - Optional category filter (e.g. "Entity", "Creative Work", "Media", "Product", "Web", "Blockchain", "Other").
 * @returns An array of {@link ClassificationSummary} objects.
 */
export function listClassifications(category?: string): ClassificationSummary[] {
	const specs = category
		? getClassificationsByCategory(category as ClassificationCategory)
		: CLASSIFICATION_SPECS;

	return specs.map((spec) => ({
		slug: spec.slug,
		type: spec.type,
		displayName: spec.displayName,
		description: spec.description,
		category: spec.category,
	}));
}

/**
 * Get all fields (required and optional) for a classification.
 *
 * Returns an array of {@link FieldInfo} objects describing each field's key,
 * label, type, and whether it is required. Returns an empty array if the
 * classification slug is unknown.
 *
 * @example
 * ```ts
 * const fields = getClassificationFields('person');
 * // => [
 * //   { key: 'givenName', label: 'First Name', fieldType: 'string', required: true, ... },
 * //   { key: 'familyName', label: 'Last Name', fieldType: 'string', required: true, ... },
 * // ]
 * ```
 *
 * @param classificationSlug - The classification slug to inspect.
 * @returns An array of {@link FieldInfo} objects for the classification's fields.
 */
export function getClassificationFields(classificationSlug: string): FieldInfo[] {
	const spec = getClassification(classificationSlug);

	if (!spec) {
		return [];
	}

	return spec.fields.map((field) => ({
		key: field.key,
		label: field.label,
		description: field.description,
		fieldType: field.fieldType,
		required: field.required,
		placeholder: field.placeholder,
	}));
}

/**
 * Get all fields (required and optional) for a classification.
 *
 * @deprecated Use {@link getClassificationFields} instead. This function name
 * is misleading because it returns all fields, not just required ones.
 *
 * @param classificationSlug - The classification slug to inspect.
 * @returns An array of {@link FieldInfo} objects for the classification's fields.
 */
export function getRequiredFields(classificationSlug: string): FieldInfo[] {
	return getClassificationFields(classificationSlug);
}

/**
 * Suggest the best-matching classification for a set of raw field values.
 *
 * This performs a heuristic match by checking which classification has the
 * highest overlap between its field keys and the provided value keys. Among
 * ties, classifications where all required fields are present are preferred.
 *
 * Returns `null` when no reasonable match is found (i.e. no classification
 * shares any fields with the provided values).
 *
 * @example
 * ```ts
 * suggestClassification({ givenName: 'Vitalik', familyName: 'Buterin' });
 * // => 'person'
 *
 * suggestClassification({ name: 'Intuition', codeRepository: 'https://github.com/...' });
 * // => 'software'
 *
 * suggestClassification({ totallyRandom: true });
 * // => null
 * ```
 *
 * @param values - A record of field key-value pairs.
 * @returns The classification slug of the best match, or `null`.
 */
export function suggestClassification(values: Record<string, unknown>): string | null {
	const valueKeys = new Set(Object.keys(values));

	if (valueKeys.size === 0) {
		return null;
	}

	let bestSlug: string | null = null;
	let bestScore = 0;
	let bestRequiredMet = false;

	for (const spec of CLASSIFICATION_SPECS) {
		const specKeys = new Set(spec.fields.map((field) => field.key));
		let matchCount = 0;

		for (const key of valueKeys) {
			if (specKeys.has(key)) {
				matchCount++;
			}
		}

		if (matchCount === 0) {
			continue;
		}

		const requiredFields = spec.fields.filter((field) => field.required);
		const allRequiredMet = requiredFields.every((field) => valueKeys.has(field.key));

		// Prefer higher match count. Break ties by whether required fields are fully met.
		const isBetter =
			matchCount > bestScore || (matchCount === bestScore && allRequiredMet && !bestRequiredMet);

		if (isBetter) {
			bestSlug = spec.slug;
			bestScore = matchCount;
			bestRequiredMet = allRequiredMet;
		}
	}

	return bestSlug;
}
