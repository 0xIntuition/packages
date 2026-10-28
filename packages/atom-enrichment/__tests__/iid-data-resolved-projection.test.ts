import { describe, expect, it } from 'bun:test';

import { projectIidDataResolvedFromArtifacts } from '../src/iid-data-resolved-projection';
import type { EnrichmentArtifact } from '../src/types';

const CANONICAL_IID = 'int:isrc:USUM71703861';
const FETCHED_AT = '2026-08-07T12:00:00.000Z';

function spotifyArtifact(): EnrichmentArtifact {
	return {
		artifact_type: 'spotify',
		data: {
			name: 'One Last Time',
			type: 'track',
			spotifyId: '1zzxoZVylsna2BQB65Ppcb',
			spotifyUrl: 'https://open.spotify.com/track/1zzxoZVylsna2BQB65Ppcb',
			artists: [{ name: 'Ariana Grande', spotifyId: '66CXWjxzNUsdJxJ2JdwvnR' }],
			albumName: 'My Everything',
			isrc: 'USUM71703861',
		},
		meta: {
			pluginId: 'spotify',
			provider: 'spotify',
			fetchedAt: FETCHED_AT,
		},
	};
}

function opengraphArtifact(): EnrichmentArtifact {
	return {
		artifact_type: 'opengraph',
		data: {
			title: 'Some Web Entity',
			description: 'A description from page metadata.',
		},
		meta: {
			pluginId: 'opengraph',
			provider: 'opengraph',
			fetchedAt: FETCHED_AT,
			sourceUrl: 'https://example.com/entity',
		},
	};
}

function openLibraryArtifact(): EnrichmentArtifact {
	return {
		artifact_type: 'openlibrary',
		data: {
			authors: [
				{
					olid: 'OL34184A',
					name: 'Roald Dahl',
					url: 'https://openlibrary.org/authors/OL34184A',
				},
			],
			name: 'Matilda',
			subjects: ['Juvenile fiction', 'Animals'],
		},
		meta: {
			pluginId: 'openlibrary',
			provider: 'openlibrary',
			fetchedAt: FETCHED_AT,
			sourceUrl: 'https://openlibrary.org/works/OL45883W',
		},
	};
}

describe('projectIidDataResolvedFromArtifacts', () => {
	it('CREATES a data_resolved document from artifacts for a bare IID atom', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: 'music-recording',
			schemaType: 'MusicRecording',
			artifacts: [spotifyArtifact()],
		});

		expect(projection).toBeDefined();
		expect(projection?.dataResolved).toMatchObject({
			'@context': 'https://schema.org/',
			'@type': 'MusicRecording',
			identifier: CANONICAL_IID,
			name: 'One Last Time',
			byArtist: 'Ariana Grande',
		});
	});

	it('always emits @type as a scalar string (search-doc contract)', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: 'music-recording',
			schemaType: 'MusicRecording',
			artifacts: [spotifyArtifact()],
		});

		expect(typeof projection?.dataResolved['@type']).toBe('string');
	});

	it('derives search_text from classification text fields, never the raw IID (D-7)', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: 'music-recording',
			schemaType: 'MusicRecording',
			artifacts: [spotifyArtifact()],
		});

		expect(projection?.searchText).toContain('One Last Time');
		expect(projection?.searchText).toContain('Ariana Grande');
		expect(projection?.searchText).not.toContain('int:');
		expect(projection?.searchText).not.toContain('https://');
	});

	it.each([
		['raw IID', 'int:isbn:9780140328721'],
		['mixed-case raw IID', 'InT:isbn:9780140328721'],
		['bare identifier value', '9780140328721'],
		['URL', 'https://openlibrary.org/isbn/9780140328721'],
		['hyphenated identifier variant', '978-0-14-032872-1'],
		['bare edition OLID', 'OL7353617M'],
	])('rejects an OpenLibrary %s as both display name and search text', async (_, leakedName) => {
		const artifact = openLibraryArtifact();
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: 'int:isbn:9780140328721',
			classificationSlug: 'book',
			schemaType: 'Book',
			artifacts: [
				{
					...artifact,
					data: { ...artifact.data, name: leakedName, title: leakedName },
				},
			],
		});

		expect(projection).toBeUndefined();
	});

	it('falls back to the thing classification for unknown/absent slugs', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: 'int:wd:Q42',
			classificationSlug: 'no-such-classification',
			schemaType: undefined,
			artifacts: [opengraphArtifact()],
		});

		expect(projection?.dataResolved['@type']).toBe('Thing');
		expect(projection?.dataResolved.name).toBe('Some Web Entity');
	});

	it('creates Book corpus fields and search text from an OpenLibrary artifact', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: 'int:isbn:9780140328721',
			classificationSlug: 'book',
			schemaType: 'Book',
			artifacts: [openLibraryArtifact()],
		});

		expect(projection?.dataResolved).toMatchObject({
			'@type': 'Book',
			about: ['Animals', 'Juvenile fiction'],
			description: 'Book by Roald Dahl. Subjects: Juvenile fiction, Animals.',
			name: 'Matilda',
		});
		expect(projection?.searchText).toContain('Roald Dahl');
		expect(projection?.searchText).toContain('Animals');
		expect(projection?.searchText).not.toContain('int:isbn:');
	});

	it('returns undefined for empty artifacts', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: 'music-recording',
			schemaType: 'MusicRecording',
			artifacts: [],
		});

		expect(projection).toBeUndefined();
	});

	it('returns undefined when artifacts cannot produce a display name', async () => {
		const nameless: EnrichmentArtifact = {
			artifact_type: 'opengraph',
			data: { description: 'description only, no title' },
			meta: { pluginId: 'opengraph', provider: 'opengraph', fetchedAt: FETCHED_AT },
		};

		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: 'thing',
			schemaType: 'Thing',
			artifacts: [nameless],
		});

		expect(projection).toBeUndefined();
	});
});

describe('provider-backed name fallback for unknown classifications (ENG-15388)', () => {
	it('resolves the display name from a spotify artifact when only the thing spec applies', async () => {
		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: undefined,
			schemaType: 'MusicRecording',
			artifacts: [spotifyArtifact()],
		});

		expect(projection).toBeDefined();
		expect(projection?.dataResolved.name).toBe('One Last Time');
	});

	it('accepts a completed provider title even when it resembles a Spotify intake label', async () => {
		const placeholderOnly: EnrichmentArtifact = {
			artifact_type: 'spotify',
			data: {
				name: 'Spotify Track 1zzxoZVylsna2BQB65Ppcb',
				spotifyId: '1zzxoZVylsna2BQB65Ppcb',
				type: 'track',
			},
			meta: { pluginId: 'spotify', provider: 'spotify', fetchedAt: FETCHED_AT },
		};

		const projection = await projectIidDataResolvedFromArtifacts({
			canonicalIid: CANONICAL_IID,
			classificationSlug: undefined,
			schemaType: 'MusicRecording',
			artifacts: [placeholderOnly],
		});

		expect(projection?.dataResolved.name).toBe('Spotify Track 1zzxoZVylsna2BQB65Ppcb');
	});
});

it('F2 IID Book accepts the completed OpenLibrary title despite its intake-like spelling', async () => {
	const artifact = openLibraryArtifact();
	const projection = await projectIidDataResolvedFromArtifacts({
		canonicalIid: 'int:isbn:9780140328721',
		classificationSlug: 'book',
		schemaType: 'Book',
		artifacts: [
			{
				...artifact,
				data: {
					...artifact.data,
					title: 'OpenLibrary Edition OL123M',
					name: 'OpenLibrary Edition OL123M',
				},
			},
		],
	});
	expect(projection?.dataResolved.name).toBe('OpenLibrary Edition OL123M');
});
