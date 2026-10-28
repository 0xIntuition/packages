// Cross-provider augmentation: after an enrichment pass, look at what peer
// providers in the same media family could add (cross-provider-augmentation-
// spec.md). Unlike identifier-chaining — which follows exact ids — these
// edges may use gated catalog searches (title + publisher corroboration in
// the target plugin), so they only fire when the source artifact carries a
// trustworthy name. Harvested metadata feeds both dedup keys and the bento
// box on the preview page.

import type { EnrichmentArtifact } from '../types';
import type { ChainHarvest } from './chaining';
import { findArtifactData, parseAppleMusic, parseSpotify, readString } from './shared';

// Spotify fallback artifacts synthesize names like "Show 4rOoJ6Egrf8K2I..."
// when no display name was available — never search catalogs with those.
const GENERATED_SPOTIFY_NAME_PATTERN =
	/^(?:Spotify )?(Track|Album|Artist|Playlist|Show|Episode) [A-Za-z0-9]+$/i;

const PODCAST_INDEX_DATA_KEYS = ['feedUrl', 'itunesId'] as const;

/**
 * True for synthesized spotify fallback display names ("Track 4rOoJ6Egrf…").
 * Shared with the tRPC track-preview resolver (ENG-13713 round 4) so lazy
 * song-catalog searches never fire on generated names either.
 */
export function isGeneratedSpotifyDisplayName(value: string): boolean {
	return GENERATED_SPOTIFY_NAME_PATTERN.test(value);
}

function usableName(value: unknown): string | undefined {
	const name = readString(value);
	return name && !isGeneratedSpotifyDisplayName(name) ? name : undefined;
}

// spotify show/episode → iTunes podcast catalog (gated search). The iTunes
// result carries the canonical RSS feedUrl, which round 2 chains into
// Podcast Index.
function harvestSpotifyPodcastPeers(
	artifacts: readonly EnrichmentArtifact[],
	presentTypes: ReadonlySet<string>,
	harvest: ChainHarvest
): void {
	if (presentTypes.has('apple-music')) return;
	const spotify = findArtifactData(artifacts, 'spotify', parseSpotify);
	if (!spotify) return;

	const isShow = spotify.data.type === 'show';
	const isEpisode = spotify.data.type === 'episode';
	if (!(isShow || isEpisode)) return;

	// Episodes search by their parent show — that's the entity peers index.
	const term = isShow ? usableName(spotify.data.name) : usableName(spotify.data.showName);
	if (!term) return;

	const publisher = readString(spotify.data.publisher);
	harvest.identifiers.itunesPodcastSearch = publisher ? `${term}|${publisher}` : term;
	harvest.pluginSlugs.push('apple-music');
}

// There is deliberately NO spotify track -> iTunes edge here (ENG-16981). It used to
// harvest the track's ISRC "for apple-music", but the free iTunes API cannot look
// anything up by ISRC (`apple-music` rejects the identifier), so the follow-up
// pass dialled nothing. Preview recovery for tracks is the tRPC track-preview
// resolver's gated name + artist song search.

// apple-music podcast → Podcast Index (exact joins: feedUrl, else itunesId).
function harvestApplePodcastPeers(
	artifacts: readonly EnrichmentArtifact[],
	presentTypes: ReadonlySet<string>,
	harvest: ChainHarvest
): void {
	if (presentTypes.has('podcast-index')) return;
	const appleMusic = findArtifactData(artifacts, 'apple-music', parseAppleMusic);
	if (appleMusic?.data.type !== 'podcast') return;

	const feedUrl = readString(appleMusic.data.feedUrl);
	if (feedUrl) {
		harvest.identifiers.feedUrl = feedUrl;
		harvest.pluginSlugs.push('podcast-index');
		return;
	}
	const itunesId = readString(appleMusic.data.appleMusicId);
	if (itunesId && /^\d+$/.test(itunesId)) {
		harvest.identifiers.itunesId = itunesId;
		harvest.pluginSlugs.push('podcast-index');
	}
}

// podcast-index → iTunes lookup (exact join: itunesId). Covers users pasting
// a podcastindex.org URL directly.
function harvestPodcastIndexPeers(
	artifacts: readonly EnrichmentArtifact[],
	presentTypes: ReadonlySet<string>,
	harvest: ChainHarvest
): void {
	if (presentTypes.has('apple-music')) return;
	const podcastIndex = artifacts.find((artifact) => artifact.artifact_type === 'podcast-index');
	if (!podcastIndex) return;

	const data = podcastIndex.data as Record<(typeof PODCAST_INDEX_DATA_KEYS)[number], unknown>;
	const itunesId = data.itunesId;
	if (typeof itunesId === 'number' && Number.isInteger(itunesId)) {
		harvest.identifiers.itunesId = String(itunesId);
		harvest.pluginSlugs.push('apple-music');
	}
}

/**
 * Harvests peer-provider lookups from gathered artifacts, excluding plugins
 * that already produced an artifact. Returns the same shape as
 * harvestChainIdentifiers so callers can merge both into one follow-up pass.
 */
export function harvestAugmentationLookups(artifacts: readonly EnrichmentArtifact[]): ChainHarvest {
	const harvest: ChainHarvest = { identifiers: {}, pluginSlugs: [] };
	const presentTypes = new Set(artifacts.map((artifact) => artifact.artifact_type));

	harvestSpotifyPodcastPeers(artifacts, presentTypes, harvest);
	harvestApplePodcastPeers(artifacts, presentTypes, harvest);
	harvestPodcastIndexPeers(artifacts, presentTypes, harvest);

	const pluginSlugs = [...new Set(harvest.pluginSlugs)];
	if (pluginSlugs.length === 0) {
		return { identifiers: {}, pluginSlugs: [] };
	}
	return { identifiers: harvest.identifiers, pluginSlugs };
}

/** Merges chain + augmentation harvests into one follow-up enrichment pass. */
export function mergeHarvests(...harvests: ChainHarvest[]): ChainHarvest {
	const collisions = harvests.flatMap((harvest) => harvest.collisions ?? []);
	const identifiers: Record<string, string> = {};
	const pluginSlugs: string[] = [];
	for (const harvest of harvests) {
		for (const [key, value] of Object.entries(harvest.identifiers)) {
			identifiers[key] ??= value;
		}
		pluginSlugs.push(...harvest.pluginSlugs);
	}
	return {
		...(collisions.length > 0 ? { collisions } : {}),
		identifiers,
		pluginSlugs: [...new Set(pluginSlugs)],
	};
}
