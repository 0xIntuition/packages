import type { PinAwareFetch } from '@0xintuition/atom-enrichment/provider-fetch';
import { pickWikidataLabel, resolveWikidataP31Identity } from '@0xintuition/iid-ladder';
import type { ResolverAtom } from '../../plugins';
import { toRecordMaybe, toStringMaybe, tryParseUrl, withPlatformMetadata } from '../shared/helpers';
import {
	createPlatformPlugin,
	PLATFORM_STAGE_MISS,
	type PlatformStageAdapter,
	type PlatformV0PluginOptions,
	type PlatformV0Profile,
} from '../shared/platform';
import { toProviderStageDiagnostic } from '../shared/provider-stage-diagnostic';
import { extractWikidataP31, fetchGuardedWikidataEntity } from './entity-data';

export type WikidataPluginOptions = PlatformV0PluginOptions & {
	/**
	 * Transport seam for fixtures: a pin-aware fetch (`createPinAwareFetch`). Any other fetcher,
	 * including the default `globalThis.fetch`, is ignored and the shared pinned transport dials.
	 */
	fetch?: PinAwareFetch;
	useDefaultDomainApiAdapter?: boolean;
};

const WIKIDATA_HOSTS = new Set(['wikidata.org', 'www.wikidata.org', 'm.wikidata.org']);

export const wikidataProfile: PlatformV0Profile = {
	domain: 'wikidata',
	display: {
		classificationSlugs: ['movie', 'tv-series', 'book', 'music-recording', 'person', 'thing'],
		exampleUrl: 'https://www.wikidata.org/wiki/Q751921',
		host: 'wikidata.org',
		label: 'Wikidata',
	},
	supportsOEmbed: false,
	allowDomainApiWithoutCredentials: true,
	classifier: {
		id: 'wikidata-url-classifier',
		priority: 10,
		classify(input: string) {
			const target = parseWikidataUrl(input);
			if (!target) {
				return null;
			}
			return {
				type: 'url' as const,
				domain: 'wikidata',
				subtype: 'entity',
				confidence: 1,
				meta: target,
			};
		},
	},
	resolveGeneric({ classification, canonicalUrl, now }) {
		const qid = toStringMaybe(classification.meta.qid);
		if (!qid) {
			return null;
		}
		return buildWikidataAtom({
			qid,
			canonicalUrl,
			label: `Wikidata ${qid}`,
			p31: [],
			now,
		});
	},
};

export function createWikidataPlugin(options: WikidataPluginOptions = {}) {
	const { fetch, useDefaultDomainApiAdapter = true, ...platformOptions } = options;
	const domainApi =
		platformOptions.adapters?.domainApi ??
		(useDefaultDomainApiAdapter ? createWikidataEntityDataAdapter(fetch) : undefined);

	return createPlatformPlugin({
		pluginId: 'wikidata',
		resolverId: 'wikidata-resolver',
		profile: wikidataProfile,
		options: {
			...platformOptions,
			adapters: {
				...platformOptions.adapters,
				domainApi,
			},
		},
	});
}

export function createWikidataEntityDataAdapter(fetcher?: PinAwareFetch): PlatformStageAdapter {
	return async ({ runtime, domain, classification, canonicalUrl, now, signal, deadlineAtMs }) => {
		if (runtime !== 'server' || domain !== 'wikidata') {
			return PLATFORM_STAGE_MISS;
		}
		const qid = toStringMaybe(classification.meta.qid);
		if (!qid) {
			return PLATFORM_STAGE_MISS;
		}
		// The shared provider fetch owns the pinned transport, the stage signal, the body cap, the
		// Wikimedia User-Agent and the `wikidata|classify_entity` request metric. Its failures are
		// structured and become typed stage diagnostics.
		const entityData = await fetchGuardedWikidataEntity({
			fetch: fetcher,
			qid,
			signal,
			deadlineAtMs,
		}).catch((error: unknown) => {
			throw toProviderStageDiagnostic(error, 'Wikidata', { signal, deadlineAtMs });
		});
		if (entityData.kind === 'too_large') {
			return buildWikidataAtom({
				qid,
				canonicalUrl,
				label: `Wikidata ${qid}`,
				p31: [],
				now,
				identityProjectionReason: 'entitydata_response_too_large',
			});
		}
		if (entityData.kind !== 'ok') {
			return PLATFORM_STAGE_MISS;
		}
		const { entity } = entityData;
		const finalQid = entityData.qid;
		const labels = toRecordMaybe(entity.labels);
		const descriptions = toRecordMaybe(entity.descriptions);
		const aliases = toRecordMaybe(entity.aliases);
		// Same locale policy as the identity bridge and enrichment readers (ENG-16199):
		// en → regional English → mul, then the synthesized placeholder as the last resort.
		const label = pickWikidataLabel(labels, 'en') ?? `Wikidata ${finalQid}`;
		const description = pickWikidataLabel(descriptions, 'en');
		const alternateNames = languageAliases(aliases, 'en');
		return buildWikidataAtom({
			qid: finalQid,
			canonicalUrl: `https://www.wikidata.org/wiki/${finalQid}`,
			label,
			description,
			alternateNames,
			p31: extractWikidataP31(entity),
			now,
		});
	};
}

function buildWikidataAtom(input: {
	qid: string;
	canonicalUrl: string;
	label: string;
	description?: string;
	alternateNames?: string[];
	p31: string[];
	now: string;
	identityProjectionReason?: 'entitydata_response_too_large';
}): ResolverAtom {
	const identity = resolveWikidataP31Identity(input.p31);
	const canonicalId = identity.wdSlug ? `wd:${identity.wdSlug}:${input.qid}` : `wd:${input.qid}`;
	const category =
		identity.schemaType === 'Person'
			? ('person' as const)
			: identity.schemaType === 'MusicRecording'
				? ('song' as const)
				: ('thing' as const);
	return withPlatformMetadata(
		{
			schemaType: identity.schemaType,
			category,
			title: input.label,
			...(input.description ? { description: input.description } : {}),
			canonicalId,
			sameAs: [input.canonicalUrl],
			...(input.identityProjectionReason
				? { metadata: { identityProjectionReason: input.identityProjectionReason } }
				: {}),
			hints: {
				identifiers: {
					wd: input.qid,
					wikidata: input.qid,
					...(identity.wdSlug ? { wdSlug: identity.wdSlug } : {}),
				},
			},
			data: {
				'@context': 'https://schema.org/',
				'@type': identity.schemaType,
				name: input.label,
				identifier: canonicalId,
				url: input.canonicalUrl,
				sameAs: [input.canonicalUrl],
				...(input.description ? { description: input.description } : {}),
				...(input.alternateNames && input.alternateNames.length > 0
					? { alternateName: input.alternateNames }
					: {}),
				instanceOf: input.p31,
			},
		},
		'wikidata',
		'entity',
		{
			pluginId: 'wikidata',
			provider: 'wikidata',
			fetchedAt: input.now,
			sourceUrl: input.canonicalUrl,
			confidence: 1,
			sourceFamily: 'domain-api',
		}
	);
}

function parseWikidataUrl(input: string): { qid: string; canonicalUrl: string } | undefined {
	const parsed = tryParseUrl(input);
	if (!parsed || !WIKIDATA_HOSTS.has(parsed.hostname.toLowerCase())) {
		return undefined;
	}
	const match = parsed.pathname.match(
		/^\/(?:wiki\/|entity\/|(?:wiki\/)?Special:EntityData\/)(Q[1-9]\d*)(?:\.json)?\/?$/i
	);
	const qid = match?.[1]?.toUpperCase();
	return qid ? { qid, canonicalUrl: `https://www.wikidata.org/wiki/${qid}` } : undefined;
}

function languageAliases(value: unknown, language: string): string[] {
	const entries = toRecordMaybe(value)?.[language];
	if (!Array.isArray(entries)) {
		return [];
	}
	return [
		...new Set(
			entries.flatMap((entry) => {
				const alias = toStringMaybe(toRecordMaybe(entry)?.value);
				return alias ? [alias] : [];
			})
		),
	].slice(0, 20);
}
