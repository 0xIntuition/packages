/**
 * Artifact => `data_resolved` projection for IID atoms (contract C4).
 *
 * Bare-IID atoms mint with no display payload: `data_resolved` starts empty
 * and this projector CREATES the document from enrichment artifacts (unlike
 * the TMDB title projection, which only mutates an existing one). Field
 * values come from the classification extraction tiers (provider extractors >
 * knowledge graph > page metadata), so provider precedence is inherited, not
 * reimplemented.
 *
 * Contract requirements (Track D W3.4):
 * - `@type` is ALWAYS present and ALWAYS a scalar string — the
 *   search-document classification subsystem rejects arrays.
 * - `identifier` carries the canonical IID so the payload stays
 *   self-describing (P1-shaped) and clusterable.
 * - `search_text` derives from the classification's text fields, never the
 *   raw identifier (D-7).
 */
import { buildClassificationSearchText, getClassification } from '@0xintuition/classifications';
import {
	hasAuthoritativeProjectionName,
	isCorpusProjectionFallbackName,
	projectCorpusDataResolvedFromArtifacts,
	resolveCorpusProjectionNameFromArtifacts,
} from './corpus-data-resolved-projection';
import { extractClassificationFields } from './extraction/extract';
import type { FetchLike } from './plugins/providers/__shared__/http';
import type { EnrichmentArtifact } from './types';

export type IidDataResolvedProjection = {
	dataResolved: Record<string, unknown>;
	searchText: string;
};

export type ProjectIidDataResolvedInput = {
	/** Canonical `int:<scheme>:<value>` identifier of the atom. */
	canonicalIid: string;
	/** Registry classification slug; unknown/absent falls back to `thing`. */
	classificationSlug?: string | undefined;
	/** Scalar schema type override; defaults to the classification's type. */
	schemaType?: string | undefined;
	artifacts: readonly EnrichmentArtifact[];
	fetcher?: FetchLike;
	language?: string;
	signal?: AbortSignal;
};

/**
 * Project a JSON-LD-shaped `data_resolved` document (plus `search_text`)
 * from enrichment artifacts. Returns `undefined` when the artifacts cannot
 * even produce a display name — completing without promotion keeps surfaces
 * in their "Untitled" state instead of writing a nameless document.
 */
export async function projectIidDataResolvedFromArtifacts(
	input: ProjectIidDataResolvedInput
): Promise<IidDataResolvedProjection | undefined> {
	if (input.artifacts.length === 0) {
		return undefined;
	}

	const spec =
		(input.classificationSlug ? getClassification(input.classificationSlug) : undefined) ??
		getClassification('thing');
	if (!spec) {
		return undefined;
	}

	const extraction = await extractClassificationFields({
		classification: spec.slug,
		artifacts: input.artifacts,
		...(input.fetcher ? { fetcher: input.fetcher } : {}),
		...(input.language ? { language: input.language } : {}),
		...(input.signal ? { signal: input.signal } : {}),
	});

	const values = compactValues(extraction.values);
	const corpusArtifacts = input.artifacts.map((artifact) => ({
		artifactKind: artifact.artifact_type,
		data: artifact.data,
		stableKey: artifact.meta.sourceUrl,
		status: 'active',
	}));
	const resolvedName =
		readNonEmptyString(values.name) ??
		composePersonName(values) ??
		resolveCorpusProjectionNameFromArtifacts(corpusArtifacts);
	const name =
		resolvedName &&
		isUsableProjectionName(
			resolvedName,
			input.canonicalIid,
			hasAuthoritativeProjectionName(resolvedName, corpusArtifacts, input.schemaType ?? spec.type)
		)
			? resolvedName
			: undefined;
	if (!name) {
		return undefined;
	}

	const schemaType = readNonEmptyString(input.schemaType) ?? spec.type;
	const baseDataResolved: Record<string, unknown> = {
		...values,
		'@context': spec.schema?.context ?? 'https://schema.org/',
		'@type': schemaType,
		identifier: input.canonicalIid,
		name,
	};
	const dataResolved = projectCorpusDataResolvedFromArtifacts({
		dataResolved: baseDataResolved,
		artifacts: corpusArtifacts,
	});
	if (!isRecord(dataResolved)) {
		return undefined;
	}

	return {
		dataResolved,
		searchText: buildClassificationSearchText(spec.fields, dataResolved, name),
	};
}

function compactValues(values: Record<string, unknown>): Record<string, unknown> {
	const compacted: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(values)) {
		if (value === undefined || value === null) {
			continue;
		}
		if (typeof value === 'string' && value.trim().length === 0) {
			continue;
		}
		if (Array.isArray(value) && value.length === 0) {
			continue;
		}
		compacted[key] = value;
	}

	return compacted;
}

function composePersonName(values: Record<string, unknown>): string | undefined {
	const composed = [values.givenName, values.familyName]
		.map(readNonEmptyString)
		.filter((part): part is string => part !== undefined)
		.join(' ');

	return composed.length > 0 ? composed : undefined;
}

function readNonEmptyString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function isUrlLike(value: string): boolean {
	return /^https?:\/\//i.test(value) || /^int:/i.test(value);
}

function isUsableProjectionName(
	value: string,
	canonicalIid: string,
	providerBacked: boolean
): boolean {
	const normalized = value.trim();
	if (isUrlLike(normalized) || (!providerBacked && isCorpusProjectionFallbackName(normalized))) {
		return false;
	}
	if (/^OL\d+[AMW]$/i.test(normalized)) {
		return false;
	}

	const iidValue = /^int:[^:]+:(.+)$/i.exec(canonicalIid)?.[1];
	if (!iidValue) {
		return true;
	}
	// Format-insensitive identifier-echo check: a hyphenated/spaced/cased
	// variant of the atom's own identifier value is still the identifier
	// (D-7), e.g. "978-0-14-032872-1" for int:isbn:9780140328721.
	const foldedName = foldIdentifierVariant(normalized);
	return foldedName !== '' && foldedName !== foldIdentifierVariant(iidValue);
}

function foldIdentifierVariant(value: string): string {
	return value.toLocaleLowerCase('en-US').replace(/[^a-z0-9]/gu, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}
