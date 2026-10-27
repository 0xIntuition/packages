import type { ParsedIid } from '@0xintuition/iid';
import { formatIntuitionId, getScheme, parseIntuitionId } from '@0xintuition/iid';
import { createLadder, PROVIDER_PREFIX_MAPPINGS } from '@0xintuition/iid-ladder';
import { identifierHintsForIid } from '@0xintuition/iid-registry';

// Preserve the application-local handle policy of the reference package.
const { projectIdentifierLadder } = createLadder({ providerLocalHandles: 'mint' });

type IdentifierBearingInput = {
	identifier?: {
		iid: string;
	};
	jsonLd?: Record<string, unknown>;
	hints?: {
		identifiers?: Record<string, string>;
	};
};

export function canonicalizeIid(iid: string): string | undefined {
	const parsed = parseIntuitionId(iid);
	if (!parsed) {
		return undefined;
	}

	const canonicalValue = getScheme(parsed.scheme)?.canonicalize(parsed.value);
	if (canonicalValue === undefined) {
		return undefined;
	}

	return formatIntuitionId(parsed.scheme, canonicalValue);
}

/**
 * Build the typed first-class identifier for a canonical(izable) IID string —
 * the shape `ClassifiedAtomInput.identifier` requires. Returns undefined for
 * anything that cannot canonicalize to a registered scheme.
 */
export function buildClassifiedAtomIdentifier(
	iid: string
): { iid: string; scheme: ParsedIid['scheme']; value: string } | undefined {
	const canonical = canonicalizeIid(iid);
	if (!canonical) {
		return undefined;
	}

	const parsed = parseIntuitionId(canonical);
	if (!parsed) {
		return undefined;
	}

	return { iid: canonical, scheme: parsed.scheme, value: parsed.value };
}

export function resolveCanonicalIid(input: IdentifierBearingInput): string | undefined {
	const firstClassIid = input.identifier?.iid;
	if (firstClassIid) {
		return canonicalizeIid(firstClassIid);
	}

	const embeddedIid = readEmbeddedIid(input.jsonLd);
	return embeddedIid ? canonicalizeIid(embeddedIid) : undefined;
}

export function resolveIdentifierHints(
	input: IdentifierBearingInput
): Record<string, string> | undefined {
	const canonicalIid = resolveCanonicalIid(input);
	const derivedHints = canonicalIid
		? consumerHintKeys(identifierHintsForIid(canonicalIid))
		: providerHandleHints(input.identifier?.iid ?? readEmbeddedIid(input.jsonLd));
	const existingHints = input.hints?.identifiers;

	if (!(existingHints || Object.keys(derivedHints).length > 0)) {
		return undefined;
	}

	// Preserve registered-IID precedence; caller hints win over handle fallbacks.
	return canonicalIid
		? { ...(existingHints ?? {}), ...derivedHints }
		: { ...derivedHints, ...(existingHints ?? {}) };
}

export function hasInvalidEmbeddedIid(input: IdentifierBearingInput): boolean {
	if (input.identifier?.iid) {
		return false;
	}

	const embeddedIid = readEmbeddedIid(input.jsonLd);
	return (
		embeddedIid !== undefined &&
		canonicalizeIid(embeddedIid) === undefined &&
		recognizeProviderHandle(embeddedIid) === undefined
	);
}

function readEmbeddedIid(jsonLd: Record<string, unknown> | undefined): string | undefined {
	const identifier = jsonLd?.identifier;
	return typeof identifier === 'string' && identifier.startsWith('int:') ? identifier : undefined;
}

// Consumer keys only: recognition and suffix validation belong to the ladder.
const PROVIDER_HINT_KEYS: Partial<
	Record<(typeof PROVIDER_PREFIX_MAPPINGS)[number]['providerPrefix'], string>
> = {
	'spotify:artist:': 'spotifyArtistId',
	'spotify:album:': 'spotifyAlbumId',
	'spotify:track:': 'spotifyId',
	'spotify:playlist:': 'spotifyPlaylistId',
	'spotify:show:': 'spotifyShowId',
	'spotify:episode:': 'spotifyEpisodeId',
	'apple-podcasts:': 'itunesId',
	'podcast-index:': 'podcastIndexFeedId',
	'steam:app:': 'steamAppId',
	'youtube:video:': 'youtubeVideoId',
	'coingecko:': 'coingeckoId',
	'places:': 'placeId',
};

// Registered Class D podcast schemes hint under their scheme name in the public
// registry; the podcast providers read the consumer keys this package has always
// produced for those handles.
const REGISTERED_HINT_KEYS: Readonly<Record<string, string>> = {
	'apple-podcasts': 'itunesId',
	'podcast-index': 'podcastIndexFeedId',
};

function consumerHintKeys(hints: Record<string, string>): Record<string, string> {
	const renamed: Record<string, string> = {};
	for (const [key, value] of Object.entries(hints)) {
		renamed[REGISTERED_HINT_KEYS[key] ?? key] = value;
	}
	return renamed;
}

export function recognizeProviderHandle(iid: string | undefined) {
	if (!iid?.startsWith('int:')) return undefined;
	const handle = iid.slice(4);
	for (const mapping of PROVIDER_PREFIX_MAPPINGS) {
		if (mapping.kind !== 'provider-local' || !handle.startsWith(mapping.iidPrefix)) continue;
		const value = handle.slice(mapping.iidPrefix.length);
		if (!mapping.valuePattern.test(value)) continue;
		// The ladder owns the complete acceptance rules (value pattern, IID shape, length cap):
		// a handle is recognized only when the ladder projects it back to this exact iid.
		const projected = projectIdentifierLadder({
			providerCanonicalId: `${mapping.providerPrefix}${value}`,
		});
		if (projected.iid === iid && 'rung' in projected && projected.rung === 'handle') {
			return { prefix: mapping.providerPrefix, value };
		}
	}
	return undefined;
}

function providerHandleHints(iid: string | undefined): Record<string, string> {
	const handle = recognizeProviderHandle(iid);
	if (!handle) return {};
	const key = PROVIDER_HINT_KEYS[handle.prefix];
	if (!key) return {};
	return { [key]: handle.prefix === 'spotify:track:' ? `track:${handle.value}` : handle.value };
}
