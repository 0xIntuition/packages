import { resolveWikidataP31Identity } from '@0xintuition/iid-ladder';
import type { ObservedRequestContext } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { readEntityIdClaimValues } from '../../../extraction/wikidata-claims';
import { wikidataEntityLookupResponseSchema } from '../wikidata/external';
import { isWikimediaMiss } from './provider-fetch';
import { type WikimediaClient, wikimediaJson } from './wikimedia';

const TYPE_FAMILIES = [
	['TVSeries', 'TVSeason', 'TVEpisode'],
	['MusicAlbum', 'MusicRecording'],
	['Person', 'Organization', 'MusicGroup'],
] as const;

export function schemaTypesAgree(expected: unknown, actual: string): boolean {
	const types = Array.isArray(expected) ? expected : [expected];
	return types.some(
		(type) =>
			typeof type === 'string' &&
			(type === actual ||
				TYPE_FAMILIES.some(
					(family) =>
						family.some((member) => member === type) && family.some((member) => member === actual)
				))
	);
}

export function wikidataTypeAgreement(
	claims: unknown,
	expected: unknown
): 'agree' | 'mismatch' | 'unknown' {
	const { schemaType } = resolveWikidataP31Identity(readEntityIdClaimValues(claims, 'P31'));
	const expectedTypes = Array.isArray(expected) ? expected : [expected];
	if (
		!expectedTypes.some((type) => typeof type === 'string' && type !== 'Thing') ||
		schemaType === 'Thing'
	)
		return 'unknown';
	return schemaTypesAgree(expected, schemaType) ? 'agree' : 'mismatch';
}

/**
 * The one EntityData fetch of both title providers (`wikidata|entity`, ENG-17015): paced, carrying
 * the Wikimedia User-Agent, observed. A 404 or an absent entity is a miss and returns `undefined`;
 * any other failure throws, already recorded.
 */
export async function fetchWikidataEntity(
	client: WikimediaClient,
	entityId: string,
	context: ObservedRequestContext
) {
	try {
		const payload = await wikimediaJson({
			client,
			provider: 'wikidata',
			operation: 'entity',
			url: `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(entityId)}.json`,
			schema: wikidataEntityLookupResponseSchema,
			context,
			classifyResult: (value) => (value.entities?.[entityId] ? 'hit' : 'miss'),
		});
		return payload.entities?.[entityId];
	} catch (error) {
		if (isWikimediaMiss(error)) return undefined;
		throw error;
	}
}
