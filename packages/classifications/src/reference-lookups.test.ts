import { describe, expect, it } from 'vitest';
import * as classifications from './index.js';
import type { ClassificationSpec } from './types.js';

// Reflection gives a failing assertion for absent exports before implementation.
function resolver(specs?: readonly ClassificationSpec[]) {
	const name = specs ? 'buildClassificationReferenceResolver' : 'getClassificationByReference';
	const helper = Reflect.get(classifications, name);
	expect(helper, name).toBeTypeOf('function');
	return specs ? helper(specs) : helper;
}

describe('reference public lookup requirements', () => {
	it('resolves unambiguous public references without overriding canonical slugs', () => {
		const resolve = resolver();
		expect(resolve('song')?.type).toBe('MusicRecording');
		expect(resolve('music-recording')?.type).toBe('MusicRecording');
		expect(resolve('musicrecording')?.type).toBe('MusicRecording');
		expect(resolve('thing')?.type).toBe('Thing');
		expect(resolve('podcast episode')?.type).toBe('PodcastEpisode');
		expect(resolve('Podcast Episode')?.type).toBe('PodcastEpisode');
		expect(resolve('podcast')).toBeUndefined();
		expect(resolve('not-a-real-label')).toBeUndefined();
	});
	it('canonical slugs and schema types beat aliases case-insensitively', () => {
		const publicResolve = resolver();
		expect(publicResolve('MUSIC-RECORDING')?.type).toBe('MusicRecording');
		expect(publicResolve('Music-Recording')?.type).toBe('MusicRecording');
		const synthetic = [
			{ slug: 'canonical-slug', type: 'CanonicalSlugOwner', displayName: 'Canonical Slug Owner' },
			{
				slug: 'alias-owner',
				type: 'AliasOwner',
				displayName: 'Alias Owner',
				commonName: 'CANONICAL-SLUG',
			},
			{
				slug: 'canonical-schema-type',
				type: 'CanonicalSchemaType',
				displayName: 'Canonical Schema Type',
			},
			{
				slug: 'schema-alias-owner',
				type: 'SchemaAliasOwner',
				displayName: 'Schema Alias Owner',
				commonName: 'canonicalschematype',
			},
		] as unknown as ClassificationSpec[];
		const resolve = resolver(synthetic);
		expect(resolve('CANONICAL-SLUG')?.type).toBe('CanonicalSlugOwner');
		expect(resolve('canonicalschematype')?.type).toBe('CanonicalSchemaType');
	});
	it('resolves every reference independently of registry order', () => {
		const forward = resolver(classifications.CLASSIFICATION_SPECS);
		const reversed = resolver([...classifications.CLASSIFICATION_SPECS].reverse());
		for (const spec of classifications.CLASSIFICATION_SPECS) {
			for (const reference of [
				spec.slug,
				spec.type,
				Reflect.get(spec, 'commonName'),
				spec.displayName,
				Reflect.get(spec, 'atomCategory'),
			]) {
				if (reference) expect(reversed(reference)?.type).toBe(forward(reference)?.type);
			}
		}
	});
	it('owns the engine atom category for every schema type', () => {
		expect(classifications.getClassificationByType('Person')).toMatchObject({
			slug: 'person',
			atomCategory: 'person',
		});
		expect(classifications.getClassificationByType('Organization')).toMatchObject({
			slug: 'company',
			atomCategory: 'company',
		});
		expect(classifications.getClassificationByType('MusicRecording')).toMatchObject({
			slug: 'music-recording',
			atomCategory: 'song',
		});
		expect(
			classifications.CLASSIFICATION_SPECS.every(
				(spec) =>
					typeof Reflect.get(spec, 'atomCategory') === 'string' &&
					Reflect.get(spec, 'atomCategory').length > 0
			)
		).toBe(true);
	});
	it('resolves render labels via commonName without touching canonical names', () => {
		const label = Reflect.get(classifications, 'getClassificationLabel');
		expect(label).toBeTypeOf('function');
		const song = classifications.getClassification('music-recording');
		expect(song).toMatchObject({
			type: 'MusicRecording',
			displayName: 'Music Recording',
			commonName: 'Song',
		});
		expect(label(song)).toBe('Song');
		const band = classifications.getClassification('music-group');
		expect(band).toMatchObject({
			type: 'MusicGroup',
			displayName: 'Music Group',
			commonName: 'Artist/Band',
		});
		expect(label(band)).toBe('Artist/Band');
		const person = classifications.getClassification('person')!;
		expect(Reflect.get(person, 'commonName')).toBeUndefined();
		expect(label(person)).toBe('Person');
	});
});
