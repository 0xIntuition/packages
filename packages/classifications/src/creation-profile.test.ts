import { readFileSync } from 'node:fs';

import { musicRecordingCreationProfile as publicMusicRecordingCreationProfile } from '@0xintuition/classifications/creation/music-recording';
import { describe, expect, it } from 'vitest';

import { CREATION_PROFILE_SLUGS, CREATION_PROFILES } from './generated/creation/index.js';
import { musicRecordingCreationProfile } from './generated/creation/music-recording.js';
import { getClassification, getMetadataPredicateRelation } from './index.js';

describe('creation profiles', () => {
	it('generates one frontend-safe profile for each classification', () => {
		expect(CREATION_PROFILES).toHaveLength(37);
		expect(CREATION_PROFILE_SLUGS).toHaveLength(37);
		expect(new Set(CREATION_PROFILE_SLUGS).size).toBe(37);
		expect(CREATION_PROFILE_SLUGS).toContain('music-recording');
	});

	it('resolves a known creation profile from the public package subpath', () => {
		expect(publicMusicRecordingCreationProfile.classification.slug).toBe('music-recording');
		expect(
			publicMusicRecordingCreationProfile.relationships.map(({ predicate }) => predicate.key)
		).toEqual(['byArtist', 'inAlbum', 'inPlaylist', 'hasCategory', 'sameAs']);
	});

	it('composes classification fields, schema provenance, matrix rows, and predicate labels', () => {
		const classification = getClassification('music-recording');

		expect(musicRecordingCreationProfile.classification).toEqual({
			slug: classification?.slug,
			type: classification?.type,
			displayName: classification?.displayName,
			description: classification?.description,
			category: classification?.category,
			schema: classification?.schema,
		});
		expect(musicRecordingCreationProfile.fields.map((field) => field.key)).toEqual([
			'name',
			'byArtist',
			'inAlbum',
			'sameAs',
		]);
		expect(musicRecordingCreationProfile.fields[0]?.schema).toMatchObject({
			property: 'name',
			originType: 'Thing',
			rangeIncludes: ['Text'],
		});
		expect(musicRecordingCreationProfile.fields[1]?.schema).toMatchObject({
			property: 'byArtist',
			originType: 'MusicRecording',
			rangeIncludes: ['MusicGroup', 'Person'],
		});
		expect(musicRecordingCreationProfile.availableFieldCount).toBeGreaterThan(
			musicRecordingCreationProfile.fields.length
		);

		const byArtist = musicRecordingCreationProfile.relationships.find(
			(relationship) => relationship.predicate.key === 'byArtist'
		);
		expect(byArtist?.predicate).toMatchObject({
			key: 'byArtist',
			id: '0x13d5d4ad6ae3a4e1b5043141b6ce4633c2df4646eaefc9e45eba899c45ce235b',
			label: 'by artist',
			status: 'proposed',
		});
		expect(byArtist?.expectedObjects).toEqual(
			getMetadataPredicateRelation('music-recording', 'byArtist')?.expectedObjects
		);

		const sameAs = musicRecordingCreationProfile.relationships.find(
			(relationship) => relationship.predicate.key === 'sameAs'
		);
		expect(sameAs?.expectedObjects).toEqual([{ kind: 'same-classification' }]);
	});

	it('keeps direct profile modules free of runtime registry imports', () => {
		const source = readFileSync(
			new URL('./generated/creation/music-recording.ts', import.meta.url),
			'utf8'
		);

		expect(source).not.toContain('@0xintuition/schema-org');
		expect(source).not.toContain('@0xintuition/predicates');
		expect(source).not.toContain("from '../../generated/index");
		expect(source).not.toContain('getPropertiesFor');
		expect(source).toContain('import type { CreationProfile }');
	});
});
