import type { ClassificationFieldSpec } from './types.js';

export const CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH = 20_000;
const CORPUS_SEARCH_KEYS = ['description', 'author', 'about'] as const;

/**
 * Build the classification-owned search surface promoted with `data_resolved`.
 *
 * This is the unbounded authoritative base. The database-kg canonical node
 * composer applies CLASSIFICATION_SEARCH_TEXT_MAX_LENGTH once, after adding
 * the globally bounded active-artifact aggregate.
 *
 * Provider projection and later artifact rebuilds must use this same field
 * policy so removing or moving an artifact cannot erase still-authoritative
 * classification text such as an artist, album, or ISRC.
 */
export function buildClassificationSearchText(
	specFields: readonly Pick<ClassificationFieldSpec, 'fieldType' | 'key'>[],
	values: Record<string, unknown>,
	primaryText?: unknown
): string {
	const parts: string[] = [];
	pushSearchText(parts, primaryText);

	for (const specField of specFields) {
		if (specField.key === 'name') {
			continue;
		}
		if (specField.fieldType !== 'string' && specField.fieldType !== 'string[]') {
			continue;
		}

		const value = values[specField.key];
		const candidates = Array.isArray(value) ? value : [value];
		for (const candidate of candidates) {
			pushSearchText(parts, candidate);
		}
	}

	for (const key of CORPUS_SEARCH_KEYS) {
		for (const candidate of searchableCorpusValues(values[key])) {
			pushSearchText(parts, candidate);
		}
	}

	return parts.join(' ');
}

function pushSearchText(parts: string[], value: unknown): void {
	const text = readNonEmptyString(value);
	if (text && !isUrlLike(text) && !parts.includes(text)) {
		parts.push(text);
	}
}

function searchableCorpusValues(value: unknown): string[] {
	const values = Array.isArray(value) ? value : [value];
	return values.flatMap((candidate) => {
		const direct = readNonEmptyString(candidate);
		if (direct) {
			return [direct];
		}
		if (isRecord(candidate)) {
			const name = readNonEmptyString(candidate.name);
			return name ? [name] : [];
		}
		return [];
	});
}

function readNonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isUrlLike(value: string): boolean {
	return /^https?:\/\//i.test(value) || /^int:/i.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
