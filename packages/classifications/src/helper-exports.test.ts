import { describe, expect, it } from 'vitest';
import {
	CLASSIFICATION_SPECS,
	deriveClassificationIdentifier,
	getClassification,
	getClassificationByType,
	IDENTITY_FIELD_SCHEMA_ORG_ALIASES,
} from './index.js';

describe('consumer helper exports', () => {
	it('looks up every schema type using the frozen catalogue objects', () => {
		for (const spec of CLASSIFICATION_SPECS)
			expect(getClassificationByType(spec.type)).toBe(getClassification(spec.slug));
		expect(getClassificationByType('Person')?.slug).toBe('person');
		expect(getClassificationByType('Organization')?.slug).toBe('company');
		expect(getClassificationByType('MusicRecording')?.slug).toBe('music-recording');
	});
	it('preserves exact type matching and not-found behavior', () => {
		for (const type of ['', 'missing', 'person', ' Person '])
			expect(getClassificationByType(type)).toBeUndefined();
	});
	it('exports the complete identity field alias table', () => {
		expect(IDENTITY_FIELD_SCHEMA_ORG_ALIASES).toEqual({ isrc: ['isrcCode'] });
	});
	it('throws for unknown classifications and returns undefined when no rung fires', () => {
		expect(() => deriveClassificationIdentifier('missing', {})).toThrow(
			'Unknown classification "missing".'
		);
		expect(deriveClassificationIdentifier('review', {})).toBeUndefined();
	});
	it('FR3 feed-host case uses the pipeline Podcast GUID in classification', () => {
		const values = { feedUrl: 'https://FEEDS.EXAMPLE.ORG/podcast.xml', name: 'Podcast' };
		expect(deriveClassificationIdentifier('podcast-series', values)?.iid).toBe(
			'int:podcastguid:7d8bd745-04d4-5ab5-9754-49afad1729dc'
		);
		expect(values.feedUrl).toBe('https://FEEDS.EXAMPLE.ORG/podcast.xml');
	});
	it('normalizes only feed host and scheme while retaining path case and query bytes', () => {
		const base = { feedUrl: 'HTTPS://FEEDS.EXAMPLE.ORG/Podcast.xml?Token=A%2FB' };
		const canonical = { feedUrl: 'feeds.example.org/Podcast.xml?Token=A%2FB' };
		const different = { feedUrl: 'feeds.example.org/podcast.xml?Token=A%2FB' };
		expect(deriveClassificationIdentifier('podcast-series', base)?.iid).toBe(
			deriveClassificationIdentifier('podcast-series', canonical)?.iid
		);
		expect(deriveClassificationIdentifier('podcast-series', base)?.iid).not.toBe(
			deriveClassificationIdentifier('podcast-series', different)?.iid
		);
	});
});
