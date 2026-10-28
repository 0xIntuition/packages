import { SCHEMES } from '@0xintuition/iid';
import { createLadder } from '@0xintuition/iid-ladder';

import {
	type CorpusProjectionArtifact,
	isCorpusProjectionFallbackName,
	projectCorpusDataResolvedFromArtifacts,
} from './corpus-data-resolved-projection';
import {
	type DataResolved,
	parseVideoObject,
	sanitizeProjectedDataResolvedWithinBudget,
} from './data-resolved-schema';
import { wikidataSameAsUrls } from './extraction/extract';
import { canonicalizeIid, recognizeProviderHandle } from './identifier';
import { mergeAdmittedIdentifierRungs, projectIdentifierRungs } from './identifier-rung-projection';
import {
	authorizeOpenGraphPageSource,
	isAdmissibleMaterializedImage,
	isAllowedOpenGraphPageSource,
	type OpenGraphPageAuthorization,
	readHttpUrl,
	selectPermissiveImage,
} from './image-policy';
import { selectPrimaryTrailer } from './trailer-projection';

// Preserve the application-local handle policy of the reference package.
const { iidForIdentityRung, projectIdentifierLadder } = createLadder({
	providerLocalHandles: 'mint',
});

export type NodeMaterializationArtifact = {
	artifactKind?: string;
	artifact_type?: string;
	data: unknown;
	error?: unknown;
	extracted?: unknown;
	meta?: unknown;
	sourceUri?: string | null;
	stableKey?: string | null;
	status?: string | null;
};

export type NodeMaterializationClassification = {
	evidence?: readonly unknown[];
	canonicalIid?: string;
	data?: unknown;
	sameAs?: readonly string[];
	/** Whether sameAs came from stored data_resolved or independent classifier evidence. */
	sameAsProvenance?: 'inherited' | 'independent';
	schemaType?: string;
	sourceFamily?: string;
	sourceUrl?: string;
	title?: string;
};

export type MaterializeNodeDataResolvedInput = {
	/** Complete active-current evidence permits withdrawal of a stored trailer. */
	artifactsAreComplete?: boolean;
	artifacts: readonly NodeMaterializationArtifact[];
	classification: NodeMaterializationClassification;
	/** Existing/user-edited resolved data wins over classifier defaults. */
	dataResolved?: unknown;
	/** Seed-only raw sidecars are normalized here, not by a second projector. */
	openLibraryPayloadJson?: unknown;
	wikipediaPayload?: unknown;
};

export function materializeProcessDataResolved(input: {
	classification: unknown;
	enrichment: unknown;
	rawInput?: string;
}): DataResolved | undefined {
	const classification = record(input.classification);
	const resolved = record(classification?.resolved);
	const atoms = Array.isArray(resolved?.atoms) ? resolved.atoms : [];
	const atom = record(atoms[0]);
	if (!atom) return undefined;
	const atomData = record(atom.data) ?? {};
	const sameAs = Array.isArray(atom.sameAs)
		? atom.sameAs.filter((value): value is string => typeof value === 'string')
		: [];
	const canonicalId = readString(atom.canonicalId);
	const embeddedIdentifier = readString(atomData.identifier);
	const hints = record(atom.hints);
	const sourceFamily =
		readString(record(atom.metadata)?.sourceFamily) ?? readString(record(atom.hints)?.sourceFamily);
	const enrichment = record(input.enrichment);
	const artifacts = Array.isArray(enrichment?.artifacts)
		? enrichment.artifacts.filter(
				(value): value is NodeMaterializationArtifact => record(value) !== undefined
			)
		: [];
	const sourceUrl =
		readHttpUrl(record(atom.metadata)?.sourceUrl) ?? readHttpUrl(input.rawInput) ?? undefined;

	const canonicalIid =
		[embeddedIdentifier, canonicalId].flatMap((value) => {
			if (!value) return [];
			const registered = canonicalizeIid(value);
			if (registered) return [registered];
			const provider = projectIdentifierLadder({
				providerCanonicalId: value.replace(/^int:/u, ''),
			});
			return provider.iid && recognizeProviderHandle(provider.iid) ? [provider.iid] : [];
		})[0] ??
		(() => {
			const canonical = SCHEMES.url.canonicalize(
				sourceUrl ?? sameAs.find((value) => readHttpUrl(value)) ?? ''
			);
			return canonical
				? (projectIdentifierLadder({ canonicalUrl: canonical }).iid ?? undefined)
				: undefined;
		})();

	const materialized = materializeNodeDataResolved({
		artifacts,
		classification: {
			...(canonicalIid ? { canonicalIid } : {}),
			data: {
				...atomData,
				'@context': readString(atomData['@context']) ?? 'https://schema.org/',
				'@type': readString(atom.schemaType) ?? readString(atomData['@type']) ?? 'Thing',
				...(readString(atom.title) ? { name: readString(atom.title) } : {}),
			},
			evidence: [hints],
			sameAs,
			schemaType: readString(atom.schemaType),
			sourceFamily,
			sourceUrl,
			title: readString(atom.title),
		},
	});
	// This process boundary chooses identity before create owns the document bytes.
	const podcastGuid =
		atom.schemaType === 'PodcastSeries'
			? materialized.identifierRung?.find((entry) => entry.rung === 'podcastguid')
			: undefined;
	const podcastIid = podcastGuid ? iidForIdentityRung('podcastguid', podcastGuid.value) : undefined;
	return podcastIid ? { ...materialized, identifier: podcastIid } : materialized;
}

/**
 * Artifact kind is the authority for whether a URL identifies a page. Image/icon
 * endpoint artifacts must be registered here; URL string sniffing is deliberately
 * forbidden because endpoint shapes vary and can make shared assets look like pages.
 */
const NON_PAGE_IDENTITY_ARTIFACT_KINDS = new Set(['favicon']);

/**
 * The one storage-agnostic classification + artifacts => data_resolved seam.
 * Artifact order is normalized so seed and app callers produce byte-equivalent
 * objects from the same evidence.
 */
export function materializeNodeDataResolved(input: MaterializeNodeDataResolvedInput): DataResolved {
	const classificationData = record(input.classification.data) ?? {};
	const current = record(input.dataResolved) ?? {};
	const artifacts = normalizeArtifacts(input.artifacts);
	const base: Record<string, unknown> = { ...classificationData, ...current };
	const schemaType =
		readString(base['@type']) ?? readString(input.classification.schemaType) ?? 'Thing';
	const storedIid = readString(current.identifier)?.startsWith('int:')
		? readString(current.identifier)
		: undefined;
	const existingIdentifierRung = mergeIdentifierRungs(
		schemaType,
		classificationData.identifierRung,
		current.identifierRung,
		storedIid
	);
	if (existingIdentifierRung !== undefined) base.identifierRung = existingIdentifierRung;
	const canonicalIid =
		readString(input.classification.canonicalIid) ??
		(readString(base.identifier)?.startsWith('int:') ? readString(base.identifier) : undefined);
	const derivedIdentifierRung = canonicalIid
		? projectIdentifierRungs({
				canonicalUrl: input.classification.sourceUrl,
				data: base,
				evidence: [...(input.classification.evidence ?? []), ...artifacts.map(artifactData)],
				existingIdentifier: canonicalIid,
				schemaType,
				sourceFamily: input.classification.sourceFamily,
			})
		: [];
	const identifierRung = mergeIdentifierRungs(
		schemaType,
		derivedIdentifierRung,
		existingIdentifierRung,
		canonicalIid ?? storedIid
	);
	if (identifierRung === undefined) {
		delete base.identifierRung;
	} else {
		base.identifierRung = identifierRung;
	}
	const artifactName = firstArtifactString(artifacts, ['name', 'title', 'label']);
	const userEditedName = usableName(current.name, schemaType);
	const initialName =
		userEditedName ??
		usableName(readString(classificationData.name), schemaType) ??
		usableName(input.classification.title, schemaType) ??
		artifactName;
	const year = readYear(base.datePublished) ?? firstArtifactYear(artifacts);
	const name = userEditedName ?? formatClassifiedName(initialName, schemaType, year);
	const classificationSameAs =
		input.classification.sameAsProvenance === 'inherited' ? undefined : input.classification.sameAs;
	const identityEvidence = collectIdentityUrlEvidence({
		artifacts,
		canonicalIid,
		classificationSameAs,
		classificationSourceUrl: input.classification.sourceUrl,
	});
	const sameAs = collectSameAs({
		artifacts,
		base,
		classificationSameAs,
		canonicalIid,
		identityEvidence,
	});
	const url =
		readInheritedPageUrl(base.url, identityEvidence) ??
		canonicalUrlForIid(canonicalIid, sameAs) ??
		(readHttpUrl(input.classification.sourceUrl) &&
		authorizeOpenGraphPageSource(input.classification.sourceUrl ?? '', {
			genericUserPasted: true,
		})
			? readHttpUrl(input.classification.sourceUrl)
			: undefined) ??
		firstArtifactUrl(artifacts) ??
		sameAs[0];
	const description =
		readString(base.description) ??
		firstArtifactString(artifacts, ['description', 'extract', 'overview']);
	const image =
		(schemaType === 'Movie' || schemaType === 'TVSeries'
			? firstProviderImage(
					artifacts.filter((artifact) => artifact.artifactKind === 'tmdb'),
					schemaType
				)
			: undefined) ??
		admissibleBaseImage(base, input.classification.sourceUrl, sameAs) ??
		firstArtifactImage(artifacts) ??
		(!readString(base.image) ? firstProviderImage(artifacts, schemaType) : undefined);
	const existingTrailer =
		schemaType === 'Movie' || schemaType === 'TVSeries'
			? parseVideoObject(current.trailer)
			: undefined;
	const trailer =
		selectPrimaryTrailer(artifacts, schemaType) ??
		(input.artifactsAreComplete ? undefined : existingTrailer);
	const projectedBase = { ...base };
	delete projectedBase.url;
	delete projectedBase.sameAs;
	delete projectedBase.trailer;

	let projected: Record<string, unknown> = {
		...projectedBase,
		...(readString(base['@context']) ? { '@context': readString(base['@context']) } : {}),
		'@type': schemaType,
		...(name ? { name } : {}),
		...(description ? { description } : {}),
		...(image ? { image } : {}),
		...(trailer ? { trailer } : {}),
		...(url ? { url } : {}),
		...(sameAs.length > 0 ? { sameAs } : {}),
		...(canonicalIid ? { identifier: canonicalIid } : {}),
	};
	const beforeProviderProjection = projected;

	projected =
		record(
			projectCorpusDataResolvedFromArtifacts({
				dataResolved: projected,
				artifacts: artifacts.map(toCorpusArtifact),
				openLibraryPayloadJson: input.openLibraryPayloadJson,
				wikipediaPayload: input.wikipediaPayload,
			})
		) ?? projected;

	return sanitizeProjectedDataResolvedWithinBudget(projected, beforeProviderProjection);
}

/**
 * identifierRung is additive descriptive metadata only. It is merged after
 * authoritative IID selection and is never read by the IID/keying path.
 */
function mergeIdentifierRungs(
	schemaType: string,
	left: unknown,
	right: unknown,
	primaryIid?: string
): unknown {
	if (!(Array.isArray(left) || Array.isArray(right))) return undefined;
	return mergeAdmittedIdentifierRungs(schemaType, left, right, primaryIid);
}

function normalizeArtifacts(
	artifacts: readonly NodeMaterializationArtifact[]
): Array<NodeMaterializationArtifact & { artifactKind: string }> {
	return artifacts
		.flatMap((artifact) => {
			const artifactKind = readString(artifact.artifactKind ?? artifact.artifact_type);
			if (!artifactKind) {
				return [];
			}
			if ((artifact.status ?? 'active') !== 'active' || artifact.error != null) {
				return [];
			}
			return [{ ...artifact, artifactKind }];
		})
		.sort((left, right) => artifactKey(left).localeCompare(artifactKey(right), 'en'));
}

function artifactKey(artifact: NodeMaterializationArtifact & { artifactKind: string }): string {
	return [
		artifactPriority(artifact.artifactKind),
		artifact.artifactKind,
		artifactSourceUrl(artifact),
	]
		.map(String)
		.join('\u0000');
}

function artifactPriority(kind: string): number {
	return (
		(
			{
				wikipedia: 10,
				wikidata: 20,
				openlibrary: 30,
				tmdb: 40,
				spotify: 40,
				opengraph: 50,
			} as Record<string, number>
		)[kind] ?? 100
	);
}

function artifactData(artifact: NodeMaterializationArtifact): Record<string, unknown> {
	const outer = record(artifact.data) ?? {};
	return record(outer.data) ?? outer;
}

function artifactSourceUrl(artifact: NodeMaterializationArtifact): string {
	const meta = record(artifact.meta);
	return (
		readHttpUrl(meta?.sourceUrl) ??
		readHttpUrl(artifact.sourceUri) ??
		readHttpUrl(artifact.stableKey) ??
		''
	);
}

function firstArtifactString(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[],
	keys: readonly string[]
): string | undefined {
	for (const artifact of artifacts) {
		const data = artifactData(artifact);
		for (const key of keys) {
			const value = readString(data[key]);
			if (value) {
				return value;
			}
		}
	}
	return undefined;
}

function firstArtifactYear(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[]
): string | undefined {
	for (const artifact of artifacts) {
		const data = artifactData(artifact);
		for (const key of ['datePublished', 'releaseDate', 'firstPublishDate']) {
			const year = readYear(data[key]);
			if (year) return year;
		}
	}
	return undefined;
}

function firstArtifactImage(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[]
): string | undefined {
	for (const artifact of artifacts) {
		const data = artifactData(artifact);
		const schemaOrg = record(data.schemaOrg);
		const coverImageUrls = record(data.coverImageUrls);
		const pageSourceUrl = artifactSourceUrl(artifact) || readHttpUrl(data.url);
		const meta = record(artifact.meta);
		const rawAuthorization = record(meta?.imagePolicy);
		const pageAuthorization: OpenGraphPageAuthorization | undefined =
			(rawAuthorization?.kind === 'allowlisted' ||
				rawAuthorization?.kind === 'generic-user-pasted') &&
			typeof rawAuthorization.authorizedUrl === 'string'
				? {
						authorizedUrl: rawAuthorization.authorizedUrl,
						kind: rawAuthorization.kind,
					}
				: undefined;
		if (
			artifact.artifactKind === 'opengraph' &&
			(!pageSourceUrl || (!pageAuthorization && !isAllowedOpenGraphPageSource(pageSourceUrl)))
		) {
			continue;
		}
		const image = selectPermissiveImage({
			image:
				data.image ??
				data.imageUrl ??
				data.thumbnailUrl ??
				schemaOrg?.image ??
				coverImageUrls?.large ??
				coverImageUrls?.medium,
			imageAny: data.image_any ?? data.imageAny,
		});
		if (
			image &&
			isAdmissibleMaterializedImage({ imageUrl: image, pageAuthorization, pageSourceUrl })
		) {
			return image;
		}
	}
	return undefined;
}

/** Stored provider artwork is not an OpenGraph page fetch. Keep page admission unchanged. */
function firstProviderImage(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[],
	schemaType: string
): string | undefined {
	// A selected details poster takes precedence over the images sidecar's alternatives.
	const ordered = [...artifacts].sort(
		(left, right) => Number(right.artifactKind === 'tmdb') - Number(left.artifactKind === 'tmdb')
	);
	for (const artifact of ordered) {
		const data = artifactData(artifact);
		let candidates: unknown[] = [];
		if ((schemaType === 'Movie' || schemaType === 'TVSeries') && artifact.artifactKind === 'tmdb') {
			candidates = [
				providerPosterImageUrl(data.posterUrl),
				tmdbPosterUrl(data.posterPath),
				tmdbPosterUrl(record(data.tmdbApiPayload)?.poster_path),
			];
		} else if (
			(schemaType === 'Movie' || schemaType === 'TVSeries') &&
			(artifact.artifactKind === 'tmdb-images' || artifact.artifactKind === 'tmdb_sidecar')
		) {
			const images = artifact.artifactKind === 'tmdb-images' ? data : record(data.images);
			// The stored provider order is the fallback preference; the details poster wins first.
			candidates = array(images?.posters).map((poster) => tmdbPosterUrl(record(poster)?.file_path));
		} else if (schemaType === 'Book' && artifact.artifactKind === 'openlibrary') {
			const coverId = data.coverId;
			if (typeof coverId === 'number' && Number.isSafeInteger(coverId) && coverId > 0) {
				candidates = [`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`];
			}
		} else if (schemaType === 'PodcastSeries' && artifact.artifactKind === 'podcast-index') {
			candidates = [data.artworkUrl, data.imageUrl, data.image, record(data.schemaOrg)?.image];
		}
		for (const imageUrl of candidates) {
			if (isAdmissibleMaterializedImage({ imageUrl })) return readString(imageUrl);
		}
	}
	return undefined;
}

/** An explicit provider poster must name an image file; a page URL or bare CDN root never displaces a base image. */
function providerPosterImageUrl(value: unknown): string | undefined {
	const url = readHttpUrl(value);
	return url && /\.(?:jpg|jpeg|png|webp)$/i.test(new URL(url).pathname) ? url : undefined;
}

function tmdbPosterUrl(value: unknown): string | undefined {
	const path = readString(value);
	return path && /^\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(path)
		? `https://image.tmdb.org/t/p/original${path}`
		: undefined;
}

function admissibleBaseImage(
	base: Record<string, unknown>,
	sourceUrl: string | undefined,
	sameAs: readonly string[]
): string | undefined {
	const image = selectPermissiveImage({ image: base.image, imageAny: base.image_any });
	if (!image) return undefined;
	const pageSourceUrl =
		readHttpUrl(sourceUrl) ?? sameAs.find((value) => isAllowedOpenGraphPageSource(value));
	return isAdmissibleMaterializedImage({ imageUrl: image, pageSourceUrl }) ? image : undefined;
}

function firstArtifactUrl(
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[]
): string | undefined {
	for (const artifact of artifacts) {
		if (isNonPageIdentityArtifact(artifact.artifactKind) || isTitleOnlyArtifact(artifact)) continue;
		const data = artifactData(artifact);
		for (const value of [data.url, data.pageUrl, data.openLibraryUrl, data.spotifyUrl]) {
			const url = readHttpUrl(value);
			if (url) return url;
		}
		const sourceUrl = artifactSourceUrl(artifact);
		if (sourceUrl) return sourceUrl;
	}
	return undefined;
}

function collectSameAs(input: {
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[];
	base: Record<string, unknown>;
	classificationSameAs?: readonly string[];
	canonicalIid?: string;
	identityEvidence: IdentityUrlEvidence;
}): string[] {
	const values: unknown[] = [
		...array(input.base.sameAs).flatMap((value) => {
			const url = readInheritedPageUrl(value, input.identityEvidence);
			return url ? [url] : [];
		}),
		...(input.classificationSameAs ?? []),
	];
	for (const artifact of input.artifacts) {
		if (isNonPageIdentityArtifact(artifact.artifactKind) || isTitleOnlyArtifact(artifact)) continue;
		const data = artifactData(artifact);
		values.push(
			...array(data.sameAs),
			data.url,
			data.pageUrl,
			data.openLibraryUrl,
			data.spotifyUrl
		);
	}
	const iidUrl = canonicalUrlForIid(input.canonicalIid, []);
	if (iidUrl) values.push(iidUrl);
	const aliases = unique(
		values.flatMap((value) => {
			const url = readHttpUrl(value);
			return url ? [url] : [];
		})
	);
	const preferred = canonicalUrlForIid(input.canonicalIid, aliases);
	return aliases.sort((left, right) => {
		if (left === preferred) return -1;
		if (right === preferred) return 1;
		return left < right ? -1 : left > right ? 1 : 0;
	});
}

function canonicalUrlForIid(
	canonicalIid: string | undefined,
	sameAs: readonly string[]
): string | undefined {
	const wikidataAlias = sameAs.find((value) =>
		/^https?:\/\/(?:www\.)?wikidata\.org\/(?:entity|wiki)\/Q[1-9]\d*$/i.test(value)
	);
	const wd = canonicalIid?.match(/^int:wd:(?:(?:film|television-series):)?(Q[1-9]\d*)$/i)?.[1];
	if (wd) {
		return wikidataAlias ?? `https://www.wikidata.org/entity/${wd.toUpperCase()}`;
	}
	// Wikidata is the documented preferred identity URL even before the client
	// overlays its typed IID, keeping server/seed permutations byte-stable.
	if (wikidataAlias) return wikidataAlias;
	const goodreadsBookId = canonicalIid?.match(/^int:goodreads:book:(\d+)$/i)?.[1];
	if (goodreadsBookId) return `https://www.goodreads.com/book/show/${goodreadsBookId}`;
	const olid = canonicalIid?.match(/^int:olid:(OL\d+W)$/i)?.[1];
	if (olid) return `https://openlibrary.org/works/${olid.toUpperCase()}`;
	return undefined;
}

function isTitleOnlyArtifact(artifact: NodeMaterializationArtifact): boolean {
	return record(artifact.meta)?.identityStrength === 'title';
}

function isNonPageIdentityArtifact(artifactKind: string): boolean {
	return NON_PAGE_IDENTITY_ARTIFACT_KINDS.has(artifactKind);
}

type IdentityUrlEvidence = {
	independentPageUrls: ReadonlySet<string>;
	nonPageArtifactUrls: ReadonlySet<string>;
};

function collectIdentityUrlEvidence(input: {
	artifacts: readonly (NodeMaterializationArtifact & { artifactKind: string })[];
	canonicalIid?: string;
	classificationSameAs?: readonly string[];
	classificationSourceUrl?: string;
}): IdentityUrlEvidence {
	const independentPageUrls = new Set<string>();
	const nonPageArtifactUrls = new Set<string>();
	const add = (target: Set<string>, value: unknown): void => {
		const key = identityUrlEquivalenceKey(value);
		if (key) target.add(key);
	};

	for (const value of input.classificationSameAs ?? []) add(independentPageUrls, value);
	add(independentPageUrls, input.classificationSourceUrl);
	add(independentPageUrls, canonicalUrlForIid(input.canonicalIid, []));

	for (const artifact of input.artifacts) {
		const target =
			isNonPageIdentityArtifact(artifact.artifactKind) || isTitleOnlyArtifact(artifact)
				? nonPageArtifactUrls
				: independentPageUrls;
		const data = artifactData(artifact);
		const entityId =
			readString(data.entityId) ?? readString(data.wikibaseItem) ?? readString(data.wikidataId);
		for (const value of [
			...(entityId && /^Q[1-9]\d*$/i.test(entityId)
				? [`https://www.wikidata.org/wiki/${entityId}`]
				: []),
			...wikidataSameAsUrls(data.claims),
			...Object.values(record(data.sitelinks) ?? {}).map((link) =>
				typeof link === 'string' ? link : record(link)?.url
			),
			...array(data.sameAs),
			data.url,
			data.pageUrl,
			data.openLibraryUrl,
			data.spotifyUrl,
		]) {
			add(target, value);
		}
		if (target === independentPageUrls || isTitleOnlyArtifact(artifact))
			add(target, artifactSourceUrl(artifact));
	}

	return { independentPageUrls, nonPageArtifactUrls };
}

function readInheritedPageUrl(value: unknown, evidence: IdentityUrlEvidence): string | undefined {
	const url = readHttpUrl(value);
	if (!url) return undefined;
	const key = identityUrlEquivalenceKey(url);
	if (key && evidence.nonPageArtifactUrls.has(key) && !evidence.independentPageUrls.has(key)) {
		return undefined;
	}
	return url;
}

/**
 * Legacy cleanup compares identities under the frozen `int:url` canonicalizer
 * (`@0xintuition/iid` url scheme v0.2): scheme folded to https, leading `www.`
 * stripped, default port / fragment / tracking params dropped, trailing slashes
 * stripped. The KG writer's `normalizeCanonicalUrl` wraps this same canonicalizer
 * (provider-path reductions and database-kg tracking extensions layered on top),
 * so both sides agree for every endpoint those layers leave untouched — which
 * includes all non-page (icon) endpoints. Wikipedia page spellings and Wikidata
 * entity routes additionally share provider identity keys. atom-enrichment must not import
 * database-kg, so the shared protocol canonicalizer is the one key.
 */
function identityUrlEquivalenceKey(value: unknown): string | undefined {
	const url = readHttpUrl(value);
	if (!url) return undefined;
	const parsed = new URL(url);
	const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
	if (host === 'wikidata.org') {
		const entityId =
			parsed.pathname.match(/^\/(?:wiki|entity)\/(Q[1-9]\d*)\/?$/i)?.[1] ??
			parsed.pathname.match(
				/^\/(?:(?:wiki|entity)\/)?Special:EntityData\/(Q[1-9]\d*)\.json\/?$/i
			)?.[1];
		if (entityId) return `wikidata:${entityId.toUpperCase()}`;
	}
	if (/^(?:[a-z-]+\.)?(?:m\.)?wikipedia\.org$/.test(host) && parsed.pathname.startsWith('/wiki/')) {
		try {
			parsed.hostname = host.replace(/\.m\./, '.');
			parsed.pathname = `/wiki/${decodeURIComponent(parsed.pathname.slice(6)).replace(/ /g, '_')}`;
			return SCHEMES.url.canonicalize(parsed.toString()) ?? undefined;
		} catch {
			return undefined;
		}
	}
	return SCHEMES.url.canonicalize(url) ?? undefined;
}

function formatClassifiedName(
	name: string | undefined,
	schemaType: string,
	year: string | undefined
): string | undefined {
	if (!(name && year) || (schemaType !== 'Movie' && schemaType !== 'TVSeries')) return name;
	return /\(\d{4}\)\s*$/.test(name) ? name : `${name} (${year})`;
}

function usableName(value: unknown, schemaType: string): string | undefined {
	const name = readString(value);
	return name && !isCorpusProjectionFallbackName(name, schemaType) ? name : undefined;
}

function readYear(value: unknown): string | undefined {
	const match = readString(value)?.match(/(?:^|\D)((?:18|19|20|21)\d{2})(?:\D|$)/);
	return match?.[1];
}

function toCorpusArtifact(
	artifact: NodeMaterializationArtifact & { artifactKind: string }
): CorpusProjectionArtifact {
	return {
		artifactKind: artifact.artifactKind,
		data: artifact.data,
		error: artifact.error,
		stableKey: artifactSourceUrl(artifact),
		status: artifact.status ?? 'active',
	};
}

function unique(values: readonly string[]): string[] {
	return [...new Set(values)];
}

function array(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function readString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function record(value: unknown): Record<string, unknown> | undefined {
	return value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}
