import { getClassification, hasClassification } from '@0xintuition/classifications';
import { SCHEME_NAMES, SCHEME_TYPING } from '@0xintuition/iid';
import { getType } from '@0xintuition/schema-org';
import { describe, expect, it } from 'vitest';

import {
	classificationForIid,
	classificationForScheme,
	listUnambiguousSchemeClassifications,
} from '../classification.js';
import { SCHEME_CLASSIFICATIONS } from '../classification-map.js';
import type { UnambiguousScheme } from '../types.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

/**
 * Slugs whose spec declares the schema.org context for a type the pinned
 * vocabulary does not define. Mirrors (and must shrink with) the
 * KNOWN_CONTEXT_DRIFT allowlist in
 * `@0xintuition/classifications` `classification-references.test.ts` — the
 * fix is the packages-backport context migration, not a spec edit.
 */
const KNOWN_CONTEXT_DRIFT = new Set(['social-media-account']);

const DIRECT_EXPECTATIONS: Readonly<Record<string, string>> = {
	isbn: 'book',
	isrc: 'music-recording',
	lei: 'company',
	gtin: 'product',
	eidr: 'movie',
	podcastguid: 'podcast-series',
	appid: 'mobile-application',
	purl: 'software',
	acct: 'social-media-account',
	rssitem: 'podcast-episode',
	termset: 'defined-term',
};

/** One canonical sample per value-typed scheme type segment. */
const VALUE_TYPED_EXPECTATIONS: readonly {
	scheme: UnambiguousScheme;
	value: string;
	slug: string | undefined;
}[] = [
	{ scheme: 'mbid', value: 'artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56', slug: 'music-group' },
	{
		scheme: 'mbid',
		value: 'recording:9d30e408-1559-448b-b491-2f8de1583ccf',
		slug: 'music-recording',
	},
	{
		scheme: 'mbid',
		value: 'release-group:1b022e01-4da6-387b-8658-8678046e4cef',
		slug: 'music-album',
	},
	{ scheme: 'mbid', value: 'release:a4864e94-6d75-4ade-bc93-0dabf3521453', slug: 'music-album' },
	{ scheme: 'mbid', value: 'label:46f0f4cd-8aab-4b33-b698-f459faf64190', slug: 'company' },
	{ scheme: 'mbid', value: 'work:944b95df-6f2f-3348-9d1a-9c934f4bbde3', slug: undefined },
	{ scheme: 'olid', value: 'OL26320A', slug: 'person' },
	{ scheme: 'olid', value: 'OL45804W', slug: 'book' },
	{ scheme: 'olid', value: 'OL7353617M', slug: 'book' },
	{
		scheme: 'caip19',
		value: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
		slug: 'ethereum-erc20',
	},
	{
		scheme: 'caip19',
		value: 'eip155:1/erc721:0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
		slug: undefined,
	},
	{
		scheme: 'caip19',
		value:
			'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
		slug: undefined,
	},
	{ scheme: 'gen1', value: `person:r4:${'a'.repeat(32)}`, slug: 'person' },
	{ scheme: 'gen1', value: `no-such-classification:r1:${'a'.repeat(32)}`, slug: undefined },
];

describe('totality over SCHEME_TYPING', () => {
	it('maps exactly the D30-unambiguous schemes', () => {
		const unambiguous = SCHEME_NAMES.filter((scheme) => SCHEME_TYPING[scheme] === 'unambiguous');
		expect(new Set(Object.keys(SCHEME_CLASSIFICATIONS))).toEqual(new Set(unambiguous));
	});

	it('references only real classification slugs in direct entries', () => {
		for (const [scheme, entry] of Object.entries(SCHEME_CLASSIFICATIONS)) {
			if (entry.kind === 'direct') {
				expect(hasClassification(entry.slug), `${scheme} -> ${entry.slug}`).toBe(true);
			}
		}
	});

	it('returns undefined for every polymorphic scheme, with or without a value', () => {
		for (const scheme of SCHEME_NAMES) {
			if (SCHEME_TYPING[scheme] === 'unambiguous') {
				continue;
			}

			expect(classificationForScheme(scheme), scheme).toBeUndefined();
			expect(classificationForScheme(scheme, 'Q42'), scheme).toBeUndefined();
		}
	});

	it('resolves every unambiguous scheme as mapped, value-typed, or asserted-unmapped', () => {
		for (const [scheme, entry] of Object.entries(SCHEME_CLASSIFICATIONS)) {
			if (entry.kind === 'unmapped') {
				expect(entry.reason.length, scheme).toBeGreaterThan(0);
				expect(classificationForScheme(scheme as UnambiguousScheme)).toBeUndefined();
			}
		}

		expect(SCHEME_CLASSIFICATIONS.iswc.kind).toBe('unmapped');
	});
});

describe('classificationForScheme', () => {
	it('resolves direct schemes without a value', () => {
		for (const [scheme, slug] of Object.entries(DIRECT_EXPECTATIONS)) {
			const resolution = classificationForScheme(scheme as UnambiguousScheme);
			expect(resolution?.slug, scheme).toBe(slug);
			expect(resolution?.schemaType, scheme).toBe(getClassification(slug)?.type);
			expect(resolution?.displayName, scheme).toBe(getClassification(slug)?.displayName);
			expect(resolution?.category, scheme).toBe(getClassification(slug)?.category);
		}
	});

	it('resolves value-typed schemes from the type segment in the value', () => {
		for (const { scheme, value, slug } of VALUE_TYPED_EXPECTATIONS) {
			expect(classificationForScheme(scheme, value)?.slug, `${scheme}:${value}`).toBe(slug);
		}
	});

	it('requires a value for value-typed schemes', () => {
		for (const scheme of ['mbid', 'olid', 'caip19', 'gen1'] as const) {
			expect(classificationForScheme(scheme)).toBeUndefined();
		}
	});

	it('rejects uncanonicalizable values for value-typed schemes', () => {
		expect(
			classificationForScheme('mbid', 'movie:056e4f3e-d505-4dad-8ec1-d04f521cbb56')
		).toBeUndefined();
		expect(classificationForScheme('olid', 'not-an-olid')).toBeUndefined();
		expect(classificationForScheme('gen1', 'person:not-a-rung')).toBeUndefined();
	});
});

describe('classificationForIid', () => {
	it('classifies a canonical P0 anchor', () => {
		expect(classificationForIid('int:isrc:USUM71703861')).toEqual({
			slug: 'music-recording',
			schemaType: 'MusicRecording',
			displayName: 'Music Recording',
			category: 'Media',
		});
	});

	it('classifies non-canonical valid-grammar IIDs through their canonical form (read-compatibility)', () => {
		expect(classificationForIid('int:isbn:0-684-83272-0')?.slug).toBe('book');
		expect(classificationForIid('int:olid:ol26320a')?.slug).toBe('person');
	});

	it('returns undefined for polymorphic, malformed, and unknown-scheme input', () => {
		expect(classificationForIid('int:wd:Q42')).toBeUndefined();
		expect(classificationForIid('int:isbn:not-a-book')).toBeUndefined();
		expect(classificationForIid('int:nosuchscheme:value')).toBeUndefined();
		expect(classificationForIid('not an iid at all')).toBeUndefined();
		expect(classificationForIid('')).toBeUndefined();
	});
});

describe('vocabulary grounding (schema.org v30.0)', () => {
	it('every classification the registry can emit resolves in the pinned vocabulary', () => {
		const slugs = new Set<string>();

		for (const entry of Object.values(SCHEME_CLASSIFICATIONS)) {
			if (entry.kind === 'direct') {
				slugs.add(entry.slug);
			}
		}

		for (const { slug } of VALUE_TYPED_EXPECTATIONS) {
			if (slug) {
				slugs.add(slug);
			}
		}

		for (const slug of slugs) {
			const spec = getClassification(slug);
			expect(spec, slug).toBeDefined();

			if (spec?.schemaOrg?.context === SCHEMA_ORG_CONTEXT && !KNOWN_CONTEXT_DRIFT.has(slug)) {
				expect(getType(spec.schemaOrg.type), `${slug} -> ${spec.schemaOrg.type}`).toBeDefined();
			}
		}
	});
});

describe('listUnambiguousSchemeClassifications', () => {
	it('lists direct schemes and excludes value-typed ones', () => {
		const entries = listUnambiguousSchemeClassifications();
		const bySlug = new Map(entries.map((entry) => [entry.scheme, entry.slug]));

		expect(bySlug.get('isrc')).toBe('music-recording');
		expect(bySlug.get('acct')).toBe('social-media-account');
		expect(bySlug.has('mbid')).toBe(false);
		expect(bySlug.has('olid')).toBe(false);
		expect(bySlug.has('caip19')).toBe(false);
		expect(bySlug.has('gen1')).toBe(false);
		expect(entries.length).toBe(Object.keys(DIRECT_EXPECTATIONS).length);
	});
});
