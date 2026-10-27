/**
 * Letterboxd page identity has a hard provenance boundary: page-data TMDB
 * attributes are read only from the document body's own opening tag, with the
 * html opening tag used only when the document has no body tag. Descendant
 * attributes are user-content-adjacent and never contribute identity.
 */
export type LetterboxdMediaKind = 'movie' | 'tv';

export type LetterboxdTarget = {
	canonicalUrl: string;
	slug?: string;
	tmdbId?: string;
};

export type LetterboxdIdentityEvidence = {
	id: string;
	kind?: LetterboxdMediaKind;
	source: 'request_bridge' | 'page_data' | 'jsonld_same_as';
};

export type LetterboxdPageIdentity =
	| {
			status: 'resolved';
			evidence: LetterboxdIdentityEvidence[];
			kind: LetterboxdMediaKind;
			tmdbId: string;
	  }
	| {
			status: 'provider_local';
			evidence: LetterboxdIdentityEvidence[];
	  }
	| {
			status: 'identity_conflict';
			evidence: LetterboxdIdentityEvidence[];
	  };

export type ParsedLetterboxdPage = {
	aggregateRating?: Record<string, unknown>;
	canonicalUrl: string;
	dateCreated?: string;
	description?: string;
	directors: string[];
	genres: string[];
	identity: LetterboxdPageIdentity;
	image?: string;
	imdbUrl?: string;
	jsonLdNode?: Record<string, unknown>;
	releasedEvent?: Record<string, unknown>;
	schemaType: 'Movie' | 'TVSeries';
	title?: string;
	titleSource?: 'jsonld' | 'opengraph';
	year?: number;
};

const FILM_PATH = /^\/film\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/.*)?$/i;
const USER_FILM_PATH = /^\/[^/]+\/film\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/.*)?$/i;
const TMDB_BRIDGE_PATH = /^\/tmdb\/([1-9]\d*)\/?$/;
const TMDB_MEDIA_PATH = /^\/(movie|tv)\/([1-9]\d*)(?:[/?#-]|$)/;

export function parseLetterboxdUrl(input: string): LetterboxdTarget | undefined {
	let parsed: URL;
	try {
		parsed = new URL(input);
	} catch {
		return undefined;
	}
	if (
		parsed.protocol !== 'https:' ||
		parsed.username ||
		parsed.password ||
		!isLetterboxdHostname(parsed.hostname)
	) {
		return undefined;
	}

	const bridgeMatch = TMDB_BRIDGE_PATH.exec(parsed.pathname);
	if (bridgeMatch?.[1]) {
		return {
			canonicalUrl: `https://letterboxd.com/tmdb/${bridgeMatch[1]}`,
			tmdbId: bridgeMatch[1],
		};
	}

	const filmMatch = FILM_PATH.exec(parsed.pathname) ?? USER_FILM_PATH.exec(parsed.pathname);
	const slug = filmMatch?.[1]?.toLowerCase();
	return slug
		? {
				canonicalUrl: `https://letterboxd.com/film/${slug}/`,
				slug,
			}
		: undefined;
}

export function isLetterboxdHostname(value: string): boolean {
	const hostname = normalizeHostname(value).replace(/^www\./, '');
	return hostname === 'letterboxd.com' || hostname.endsWith('.letterboxd.com');
}

export function isAllowedLetterboxdPageUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			url.protocol === 'https:' &&
			!url.username &&
			!url.password &&
			isLetterboxdHostname(url.hostname)
		);
	} catch {
		return false;
	}
}

export function normalizeLetterboxdPosterUrl(value: unknown): string | undefined {
	const candidate = stringValue(value);
	if (!candidate) {
		return undefined;
	}
	try {
		const url = new URL(candidate);
		return url.protocol === 'https:' && url.hostname === 'a.ltrbxd.com'
			? url.toString()
			: undefined;
	} catch {
		return undefined;
	}
}

export function buildLetterboxdSameAs(input: {
	canonicalUrl: string;
	imdbUrl?: string;
	tmdbId?: string;
	tmdbKind?: LetterboxdMediaKind;
}): string[] {
	return Array.from(
		new Set(
			[
				input.canonicalUrl,
				input.tmdbId ? `https://letterboxd.com/tmdb/${input.tmdbId}` : undefined,
				input.tmdbId && input.tmdbKind
					? `https://www.themoviedb.org/${input.tmdbKind}/${input.tmdbId}`
					: undefined,
				input.imdbUrl,
			].filter((value): value is string => Boolean(value))
		)
	);
}

export function parseLetterboxdPage(
	html: string,
	requestCanonicalUrl: string
): ParsedLetterboxdPage {
	const requestTarget = parseLetterboxdUrl(requestCanonicalUrl);
	const openGraph = extractOpenGraph(html);
	const documentCanonical = extractCanonicalUrl(html);
	const canonicalUrl =
		(documentCanonical && parseLetterboxdUrl(documentCanonical)?.canonicalUrl) ??
		requestTarget?.canonicalUrl ??
		requestCanonicalUrl;
	const pageDataEvidence = collectDocumentRootPageDataEvidence(html);
	const nodeSelection = selectJsonLdNode(
		extractJsonLdNodes(html),
		requestTarget,
		pageDataEvidence,
		canonicalUrl
	);
	const selectedNode = nodeSelection.node;
	const evidence = collectIdentityEvidence(requestTarget, pageDataEvidence, selectedNode);
	const identity =
		nodeSelection.ambiguous === true
			? { status: 'identity_conflict' as const, evidence: nodeSelection.evidence }
			: reconcileIdentityEvidence(evidence);
	const nodeSchemaType = jsonLdSchemaType(selectedNode);
	const schemaType =
		identity.status === 'resolved' && identity.kind === 'tv'
			? 'TVSeries'
			: (nodeSchemaType ?? 'Movie');
	const jsonLdTitle = stringValue(selectedNode?.name);
	const parsedOpenGraphTitle = parseOpenGraphTitle(openGraph.title);
	const title = jsonLdTitle ?? parsedOpenGraphTitle?.title;
	const description = stringValue(selectedNode?.description) ?? openGraph.description;
	const dateCreated = stringValue(selectedNode?.dateCreated);
	const releasedEvent = recordValue(selectedNode?.releasedEvent);
	const releaseDate = dateCreated ?? stringValue(releasedEvent?.startDate);
	const yearText = releaseDate?.match(/^(\d{4})/)?.[1];
	const image =
		normalizeJsonLdImage(selectedNode?.image) ?? normalizeLetterboxdPosterUrl(openGraph.image);

	return {
		canonicalUrl,
		directors: normalizeDirectors(selectedNode?.director),
		genres: normalizeStringValues(selectedNode?.genre),
		identity,
		schemaType,
		...(selectedNode ? { jsonLdNode: selectedNode } : {}),
		...(title ? { title } : {}),
		...(title ? { titleSource: jsonLdTitle ? ('jsonld' as const) : ('opengraph' as const) } : {}),
		...(description ? { description } : {}),
		...(image ? { image } : {}),
		...(dateCreated ? { dateCreated } : {}),
		...(releasedEvent ? { releasedEvent } : {}),
		...(recordValue(selectedNode?.aggregateRating)
			? { aggregateRating: recordValue(selectedNode?.aggregateRating) }
			: {}),
		...(extractImdbUrl(html, selectedNode) ? { imdbUrl: extractImdbUrl(html, selectedNode) } : {}),
		...(yearText || parsedOpenGraphTitle?.year
			? { year: Number.parseInt(yearText ?? String(parsedOpenGraphTitle?.year), 10) }
			: {}),
	};
}

function collectIdentityEvidence(
	requestTarget: LetterboxdTarget | undefined,
	pageDataEvidence: LetterboxdIdentityEvidence[],
	selectedNode: Record<string, unknown> | undefined
): LetterboxdIdentityEvidence[] {
	const evidence: LetterboxdIdentityEvidence[] = [];
	if (requestTarget?.tmdbId) {
		evidence.push({ id: requestTarget.tmdbId, source: 'request_bridge' });
	}

	evidence.push(...pageDataEvidence);

	for (const value of flattenStrings(selectedNode?.sameAs)) {
		const tmdb = parseTmdbMediaUrl(value);
		if (tmdb) {
			evidence.push({ ...tmdb, source: 'jsonld_same_as' });
		}
	}

	return dedupeEvidence(evidence);
}

function collectDocumentRootPageDataEvidence(html: string): LetterboxdIdentityEvidence[] {
	// Only the document's own `<body>` opening tag may carry page-data identity.
	// Letterboxd always serves a body; there is no `<html>` fallback because a
	// forged `<html …>` inside head-level text would otherwise outrank the real
	// root in a body-less document (R4-01). The tag name must be followed by a
	// real HTML tag delimiter (whitespace, `/`, or `>`): `\b` alone lets
	// `<body-data …>` pass as the body element (R4-02).
	const bodyTag = html.match(/<body(?=[\s/>])[^>]*>/i)?.[0];
	return bodyTag ? pageDataEvidenceFromRootTag(bodyTag) : [];
}

function pageDataEvidenceFromRootTag(tag: string): LetterboxdIdentityEvidence[] {
	const attributes = parseTagAttributes(tag);
	const id = attributes['data-tmdb-id']?.match(/^[1-9]\d*$/)?.[0];
	const kind = normalizeMediaKind(attributes['data-tmdb-type']);
	if (!(id && kind)) {
		return [];
	}
	return [{ id, kind, source: 'page_data' }];
}

function reconcileIdentityEvidence(evidence: LetterboxdIdentityEvidence[]): LetterboxdPageIdentity {
	const ids = new Set(evidence.map((entry) => entry.id));
	const kinds = new Set(evidence.flatMap((entry) => (entry.kind ? [entry.kind] : [])));
	if (ids.size > 1 || kinds.size > 1) {
		return { status: 'identity_conflict', evidence };
	}
	const tmdbId = ids.values().next().value as string | undefined;
	const kind = kinds.values().next().value as LetterboxdMediaKind | undefined;
	return tmdbId && kind
		? { status: 'resolved', evidence, kind, tmdbId }
		: { status: 'provider_local', evidence };
}

function extractJsonLdNodes(html: string): Record<string, unknown>[] {
	const nodes: Record<string, unknown>[] = [];
	for (const match of html.matchAll(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	)) {
		try {
			nodes.push(...findTypedNodes(JSON.parse(match[1] ?? '')));
		} catch {
			// Malformed JSON-LD is ignored; later blocks and Open Graph remain usable.
		}
	}
	return nodes;
}

function findTypedNodes(value: unknown): Record<string, unknown>[] {
	if (Array.isArray(value)) {
		return value.flatMap(findTypedNodes);
	}
	const record = recordValue(value);
	if (!record) {
		return [];
	}
	return [...(jsonLdSchemaType(record) ? [record] : []), ...findTypedNodes(record['@graph'])];
}

function selectJsonLdNode(
	nodes: Record<string, unknown>[],
	requestTarget: LetterboxdTarget | undefined,
	pageDataEvidence: LetterboxdIdentityEvidence[],
	canonicalUrl: string
):
	| { ambiguous: false; node: Record<string, unknown> | undefined }
	| { ambiguous: true; evidence: LetterboxdIdentityEvidence[]; node: undefined } {
	if (nodes.length <= 1) {
		return { ambiguous: false, node: nodes[0] };
	}

	const requestEvidence = requestTarget?.tmdbId
		? [{ id: requestTarget.tmdbId, source: 'request_bridge' as const }]
		: [];
	const externalEvidence = [...requestEvidence, ...pageDataEvidence];
	const agreeing = nodes.filter((node) => jsonLdNodeAgrees(node, externalEvidence, canonicalUrl));
	if (agreeing.length === 1) {
		return { ambiguous: false, node: agreeing[0] };
	}

	return {
		ambiguous: true,
		evidence: dedupeEvidence([...externalEvidence, ...nodes.flatMap(jsonLdIdentityEvidence)]),
		node: undefined,
	};
}

function jsonLdNodeAgrees(
	node: Record<string, unknown>,
	externalEvidence: LetterboxdIdentityEvidence[],
	canonicalUrl: string
): boolean {
	const nodeEvidence = jsonLdIdentityEvidence(node);
	const combined = reconcileIdentityEvidence([...externalEvidence, ...nodeEvidence]);
	if (combined.status === 'identity_conflict') {
		return false;
	}
	const identityMatches = externalEvidence.length > 0 && nodeEvidence.length > 0;
	return identityMatches || jsonLdNodeMatchesCanonical(node, canonicalUrl);
}

function jsonLdIdentityEvidence(node: Record<string, unknown>): LetterboxdIdentityEvidence[] {
	return flattenStrings(node.sameAs).flatMap((value) => {
		const tmdb = parseTmdbMediaUrl(value);
		return tmdb ? [{ ...tmdb, source: 'jsonld_same_as' as const }] : [];
	});
}

function jsonLdNodeMatchesCanonical(node: Record<string, unknown>, canonicalUrl: string): boolean {
	const expected = parseLetterboxdUrl(canonicalUrl)?.canonicalUrl;
	if (!expected) {
		return false;
	}
	return [node.url, node['@id'], node.sameAs]
		.flatMap(flattenStrings)
		.some((value) => parseLetterboxdUrl(value)?.canonicalUrl === expected);
}

function jsonLdSchemaType(
	value: Record<string, unknown> | undefined
): 'Movie' | 'TVSeries' | undefined {
	const types = Array.isArray(value?.['@type']) ? value?.['@type'] : [value?.['@type']];
	if (types.includes('TVSeries')) {
		return 'TVSeries';
	}
	return types.includes('Movie') ? 'Movie' : undefined;
}

function extractOpenGraph(html: string): {
	description?: string;
	image?: string;
	title?: string;
} {
	const values: Record<string, string> = {};
	for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
		const attributes = parseTagAttributes(tag);
		const key = (attributes.property ?? attributes.name)?.toLowerCase();
		if (key && attributes.content && !(key in values)) {
			values[key] = attributes.content.trim();
		}
	}
	return {
		...(values['og:title'] || values['twitter:title']
			? { title: values['og:title'] ?? values['twitter:title'] }
			: {}),
		...(values['og:description'] || values['twitter:description']
			? { description: values['og:description'] ?? values['twitter:description'] }
			: {}),
		...(values['og:image'] || values['twitter:image']
			? { image: values['og:image'] ?? values['twitter:image'] }
			: {}),
	};
}

function parseOpenGraphTitle(value: string | undefined):
	| {
			title: string;
			year: number;
	  }
	| undefined {
	const normalized = value?.trim();
	if (!normalized || /^letterboxd$/i.test(normalized)) {
		return undefined;
	}
	const match = normalized.match(/^(.+?)\s*\((\d{4})\)(?:\s*[|·-].*)?$/);
	const title = match?.[1]?.trim();
	return title && match?.[2] ? { title, year: Number.parseInt(match[2], 10) } : undefined;
}

function extractCanonicalUrl(html: string): string | undefined {
	for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
		const attributes = parseTagAttributes(tag);
		if (attributes.rel?.toLowerCase().split(/\s+/).includes('canonical')) {
			return stringValue(attributes.href);
		}
	}
	return undefined;
}

function extractImdbUrl(
	html: string,
	selectedNode: Record<string, unknown> | undefined
): string | undefined {
	for (const candidate of [
		...flattenStrings(selectedNode?.sameAs),
		...(html.match(/https:\/\/(?:www\.)?imdb\.com\/title\/tt\d+\/?/gi) ?? []),
	]) {
		const id = candidate.match(/^https:\/\/(?:www\.)?imdb\.com\/title\/(tt\d+)\/?/i)?.[1];
		if (id) {
			return `https://www.imdb.com/title/${id}/`;
		}
	}
	return undefined;
}

function parseTmdbMediaUrl(value: string): { id: string; kind: LetterboxdMediaKind } | undefined {
	try {
		const url = new URL(value);
		const hostname = normalizeHostname(url.hostname).replace(/^www\./, '');
		if (url.protocol !== 'https:' || hostname !== 'themoviedb.org') {
			return undefined;
		}
		const match = TMDB_MEDIA_PATH.exec(url.pathname);
		return match?.[1] && match[2]
			? { kind: match[1] as LetterboxdMediaKind, id: match[2] }
			: undefined;
	} catch {
		return undefined;
	}
}

function normalizeJsonLdImage(value: unknown): string | undefined {
	if (Array.isArray(value)) {
		return value.map(normalizeJsonLdImage).find(Boolean);
	}
	const record = recordValue(value);
	return normalizeLetterboxdPosterUrl(
		typeof value === 'string' ? value : (record?.contentUrl ?? record?.url)
	);
}

function normalizeDirectors(value: unknown): string[] {
	const values = Array.isArray(value) ? value : [value];
	return Array.from(
		new Set(
			values.flatMap((entry) =>
				stringValue(recordValue(entry)?.name)
					? [stringValue(recordValue(entry)?.name) as string]
					: []
			)
		)
	);
}

function normalizeStringValues(value: unknown): string[] {
	const values = Array.isArray(value) ? value : [value];
	return Array.from(
		new Set(values.flatMap((entry) => (stringValue(entry) ? [stringValue(entry) as string] : [])))
	);
}

function flattenStrings(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.flatMap(flattenStrings);
	}
	return stringValue(value) ? [stringValue(value) as string] : [];
}

function parseTagAttributes(tag: string): Record<string, string> {
	const attributes: Record<string, string> = {};
	// HTML attribute semantics (R4-03): quoted or unquoted values, names are
	// case-insensitive, character references are decoded, and the FIRST
	// occurrence of a duplicated attribute wins — an appended duplicate can never
	// override the server-written value.
	for (const match of tag.matchAll(
		/([^\s"'<>/=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g
	)) {
		const name = match[1]?.toLowerCase();
		const value = match[2] ?? match[3] ?? match[4];
		if (name && value !== undefined && !Object.hasOwn(attributes, name)) {
			attributes[name] = decodeHtmlCharacterReferences(value);
		}
	}
	return attributes;
}

const NAMED_CHARACTER_REFERENCES: Record<string, string> = {
	amp: '&',
	apos: "'",
	gt: '>',
	lt: '<',
	quot: '"',
};

function decodeHtmlCharacterReferences(value: string): string {
	return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (reference, body: string) => {
		if (body[0] === '#') {
			const codePoint =
				body[1]?.toLowerCase() === 'x'
					? Number.parseInt(body.slice(2), 16)
					: Number.parseInt(body.slice(1), 10);
			return Number.isFinite(codePoint) && codePoint > 0 && codePoint <= 0x10_ff_ff
				? String.fromCodePoint(codePoint)
				: reference;
		}
		return NAMED_CHARACTER_REFERENCES[body.toLowerCase()] ?? reference;
	});
}

function normalizeMediaKind(value: string | undefined): LetterboxdMediaKind | undefined {
	const normalized = value?.trim().toLowerCase();
	if (normalized === 'movie' || normalized === 'film') {
		return 'movie';
	}
	return normalized === 'tv' || normalized === 'tvseries' || normalized === 'series'
		? 'tv'
		: undefined;
}

function dedupeEvidence(evidence: LetterboxdIdentityEvidence[]): LetterboxdIdentityEvidence[] {
	const seen = new Set<string>();
	return evidence.filter((entry) => {
		const key = `${entry.source}:${entry.id}:${entry.kind ?? ''}`;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined;
}

function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeHostname(value: string): string {
	return value.trim().toLowerCase().replace(/\.+$/, '');
}
