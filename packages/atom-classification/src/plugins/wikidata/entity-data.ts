import {
	fetchProviderJson,
	isWikimediaMiss,
	type PinAwareFetch,
	ProviderHttpError,
	WIKIMEDIA_STATUS_OUTCOMES,
	WIKIMEDIA_USER_AGENT,
} from '@0xintuition/atom-enrichment/provider-fetch';
import { z } from 'zod/v4';

const DEFAULT_MAX_ENTITY_DATA_BYTES = 512 * 1024;
const QID_PATTERN = /^Q[1-9]\d*$/;

/**
 * The entity an EntityData body answers for `qid`: the requested id, else any entity id in the body
 * (a merged item answers under its target); missing, deleted and invalid
 * entries are skipped. `undefined` when the body holds no usable entity.
 */
export function pickWikidataEntity(
	body: unknown,
	qid: string
): { entity: Record<string, unknown>; qid: string } | undefined {
	const entities = recordValue(recordValue(body).entities);
	const candidates = uniqueStrings([
		qid,
		...Object.keys(entities).filter((key) => QID_PATTERN.test(key)),
	]);
	for (const candidate of candidates) {
		const entity = recordValue(entities[candidate]);
		if (Object.keys(entity).length === 0 || isInvalidEntity(entity)) {
			continue;
		}
		return { entity, qid: candidate };
	}
	return undefined;
}

export type GuardedWikidataEntityResult =
	| { entity: Record<string, unknown>; kind: 'ok'; qid: string }
	| { kind: 'not_found' }
	| { kind: 'too_large' };

/**
 * The classification stage's EntityData lookup (`wikidata|classify_entity`, ENG-17015) on the
 * shared provider fetch: guarded pinned transport, the stage signal, a body cap, the Wikimedia
 * User-Agent and one observed request. A 404 and a body without a usable entity are
 * `not_found` (a miss); a body over the cap is `too_large` (recorded as an invalid response);
 * every other failure throws a `ProviderHttpError`/`ZodError` for the caller to turn into a
 * stage diagnostic.
 */
export async function fetchGuardedWikidataEntity(input: {
	deadlineAtMs?: number | undefined;
	fetch?: PinAwareFetch | undefined;
	maxResponseBytes?: number;
	qid: string;
	signal?: AbortSignal | undefined;
}): Promise<GuardedWikidataEntityResult> {
	try {
		const picked = await fetchProviderJson({
			url: `https://www.wikidata.org/wiki/Special:EntityData/${input.qid}.json`,
			fetch: input.fetch,
			userAgent: WIKIMEDIA_USER_AGENT,
			signal: input.signal,
			deadlineAtMs: input.deadlineAtMs,
			maxResponseBytes: input.maxResponseBytes ?? DEFAULT_MAX_ENTITY_DATA_BYTES,
			schema: z
				.record(z.string(), z.unknown())
				.transform((body) => pickWikidataEntity(body, input.qid)),
			observe: {
				provider: 'wikidata',
				operation: 'classify_entity',
				statusOutcomes: WIKIMEDIA_STATUS_OUTCOMES,
				classifyResult: (picked) => (picked ? 'hit' : 'miss'),
			},
		});
		return picked ? { ...picked, kind: 'ok' } : { kind: 'not_found' };
	} catch (error) {
		if (error instanceof ProviderHttpError && error.errorClass === 'response_too_large') {
			return { kind: 'too_large' };
		}
		if (isWikimediaMiss(error)) return { kind: 'not_found' };
		throw error;
	}
}

export function extractWikidataP31(entity: Record<string, unknown>): string[] {
	return extractClaimValues(entity, 'P31').flatMap((value) => {
		const id = recordValue(value).id;
		return typeof id === 'string' && QID_PATTERN.test(id) ? [id] : [];
	});
}

export function entityHasExactExternalId(
	entity: Record<string, unknown>,
	property: string,
	value: string
): boolean {
	return extractClaimValues(entity, property).some(
		(candidate) =>
			typeof candidate === 'string' &&
			normalizeExternalId(property, candidate) === normalizeExternalId(property, value)
	);
}

function extractClaimValues(entity: Record<string, unknown>, property: string): unknown[] {
	const statements = recordValue(entity.claims)[property];
	if (!Array.isArray(statements)) {
		return [];
	}
	return statements.flatMap((statement) => {
		const statementRecord = recordValue(statement);
		if (statementRecord.rank === 'deprecated') {
			return [];
		}
		const snak = recordValue(statementRecord.mainsnak);
		if (snak.snaktype && snak.snaktype !== 'value') {
			return [];
		}
		const datavalue = recordValue(snak.datavalue);
		return 'value' in datavalue ? [datavalue.value] : [];
	});
}

function isInvalidEntity(entity: Record<string, unknown>): boolean {
	return Boolean(
		entity.missing !== undefined || entity.invalid !== undefined || entity.deleted !== undefined
	);
}

function normalizeExternalId(property: string, value: string): string {
	const trimmed = value.trim();
	return property === 'P345' ? trimmed.toLowerCase() : trimmed;
}

function uniqueStrings(values: readonly (string | undefined)[]): string[] {
	return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function recordValue(value: unknown): Record<string, unknown> {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}
