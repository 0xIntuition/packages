import { hasClassification, validateClassificationValues } from '@0xintuition/classifications';
import { validateIntuitionId } from '@0xintuition/iid';

import type { ValidationResult } from './types.js';

/**
 * Validate a set of values against a classification spec.
 *
 * Returns a {@link ValidationResult} indicating whether the values are valid
 * and providing a list of issue messages when they are not.
 *
 * Unlike the underlying `validateClassificationValues` which throws for unknown
 * classifications, this function returns a structured result with an error message.
 *
 * @example
 * ```ts
 * const result = validateAtom('person', { givenName: 'Vitalik' });
 * if (!result.valid) {
 *   console.log(result.issues); // ['Missing required field "familyName".']
 * }
 * ```
 *
 * @param classificationSlug - The classification slug to validate against.
 * @param values - A record of field values to validate.
 * @returns A {@link ValidationResult} with validity status and issue messages.
 */
export function validateAtom(
	classificationSlug: string,
	values: Record<string, unknown>
): ValidationResult {
	if (!hasClassification(classificationSlug)) {
		return {
			valid: false,
			issues: [`Unknown classification "${classificationSlug}".`],
		};
	}

	const issues = validateClassificationValues(classificationSlug, values);

	if (issues.length === 0) {
		return { valid: true, issues: [] };
	}

	return {
		valid: false,
		issues: issues.map((issue) => issue.message),
	};
}

/**
 * Check if a string is valid JSON-LD atom data.
 *
 * A string is considered valid JSON-LD atom data if it parses as JSON and
 * contains either a `@context` property (schema.org atom data) or is a
 * well-formed JSON object (non-schema atom data like blockchain classifications).
 *
 * This is a best-effort structural check. It does not validate against any
 * specific classification schema.
 *
 * @example
 * ```ts
 * isValidAtomData('{"@context":"https://schema.org/","@type":"Person","givenName":"Vitalik","familyName":"Buterin"}');
 * // true
 *
 * isValidAtomData('not json');
 * // false
 *
 * isValidAtomData('42');
 * // false — not a JSON object
 * ```
 *
 * @param data - The string to check.
 * @returns `true` if the string is a valid JSON object, `false` otherwise.
 */
export function isValidAtomData(data: string): boolean {
	return recognizeAtomData(data) !== 'invalid';
}

/**
 * Classify an atom data string without reclassifying arbitrary strings:
 *
 * - `'iid-anchor'` — a VALID canonical IID (P0 anchor bytes). Only strings
 *   that pass full IID validation qualify; a well-formed but non-canonical
 *   or unknown-scheme string is NOT an anchor.
 * - `'json-object'` — a JSON object (legacy JSON-LD and P1/P2 payloads).
 * - `'invalid'` — anything else.
 */
export function recognizeAtomData(data: string): 'iid-anchor' | 'json-object' | 'invalid' {
	if (validateIntuitionId(data)) {
		return 'iid-anchor';
	}

	try {
		const parsed: unknown = JSON.parse(data);

		return !!parsed && typeof parsed === 'object' && !Array.isArray(parsed)
			? 'json-object'
			: 'invalid';
	} catch {
		return 'invalid';
	}
}
