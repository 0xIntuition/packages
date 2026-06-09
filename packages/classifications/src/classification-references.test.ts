import { PREDICATE_DEFS } from '@0xintuition/predicates';
import { getPropertiesFor, getType } from '@0xintuition/schema-org';
import { describe, expect, it } from 'vitest';

import { CLASSIFICATION_SPECS, getClassification, getMetadataPredicatesFor } from './index.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';

describe('classification references', () => {
	it('references only predicate keys exported by @0xintuition/predicates', () => {
		const predicateKeys = new Set(Object.keys(PREDICATE_DEFS));
		const issues: string[] = [];

		for (const spec of CLASSIFICATION_SPECS) {
			const seen = new Set<string>();

			for (const predicateKey of spec.metadataPredicates) {
				if (seen.has(predicateKey)) {
					issues.push(`${spec.slug}: duplicate metadata predicate "${predicateKey}"`);
				}

				seen.add(predicateKey);

				if (!predicateKeys.has(predicateKey)) {
					issues.push(`${spec.slug}: unknown metadata predicate "${predicateKey}"`);
				}
			}
		}

		expect(issues).toEqual([]);
	});

	it('resolves schema.org-backed fields through inherited schema.org properties', () => {
		const issues: string[] = [];

		for (const spec of CLASSIFICATION_SPECS) {
			if (spec.schema?.context !== SCHEMA_ORG_CONTEXT) {
				continue;
			}

			const schemaType = getType(spec.schema.type);

			if (!schemaType) {
				issues.push(`${spec.slug}: unknown schema.org type "${spec.schema.type}"`);
				continue;
			}

			const schemaPropertyNames = new Set(
				getPropertiesFor(schemaType.name).map((property) => property.name)
			);

			for (const field of spec.fields) {
				if (!field.schemaProperty) {
					issues.push(`${spec.slug}.${field.key}: missing schemaProperty pointer`);
					continue;
				}

				if (!schemaPropertyNames.has(field.schemaProperty)) {
					issues.push(
						`${spec.slug}.${field.key}: unknown schema.org property "${field.schemaProperty}" for ${schemaType.name}`
					);
				}
			}
		}

		expect(issues).toEqual([]);
	});

	it('keeps schema.org provenance intact for Book recommended fields', () => {
		const book = getClassification('book');
		expect(book?.metadataPredicates).toContain('authoredBy');
		expect(book?.metadataPredicates).toContain('sameAs');

		const properties = getPropertiesFor('Book');
		const name = properties.find((property) => property.name === 'name');
		const author = properties.find((property) => property.name === 'author');
		const isbn = properties.find((property) => property.name === 'isbn');

		expect(name?.originType).toBe('Thing');
		expect(author?.originType).toBe('CreativeWork');
		expect(isbn?.originType).toBe('Book');
	});

	it('wires MusicRecording metadata predicates only after predicate promotion', () => {
		expect(getMetadataPredicatesFor('music-recording')).toEqual([
			'byArtist',
			'inAlbum',
			'inPlaylist',
			'hasCategory',
			'sameAs',
		]);
	});

	it('recommends sameAs for schema.org-backed entities while preserving explicit exclusions', () => {
		expect(getClassification('music-recording')?.fields.map((field) => field.key)).toContain(
			'sameAs'
		);
		expect(getClassification('music-album')?.metadataPredicates).toContain('sameAs');
		expect(getClassification('person')?.fields.map((field) => field.key)).toContain('sameAs');

		for (const slug of [
			'aggregate-rating',
			'ethereum-account',
			'ethereum-erc20',
			'ethereum-smart-contract',
			'social-media-account',
			'social-media-posting',
		]) {
			expect(getClassification(slug)?.metadataPredicates).not.toContain('sameAs');
		}
	});

	it('keeps social media account on an Intuition-owned schema context', () => {
		const socialMediaAccount = getClassification('social-media-account');

		expect(socialMediaAccount?.schema).toEqual({
			context: 'https://schema.intuition.systems/v1/social-media-account.jsonld',
			type: 'SocialMediaAccount',
		});
		expect(socialMediaAccount?.fields.every((field) => !field.schemaProperty)).toBe(true);
		expect(socialMediaAccount?.metadataPredicates).toContain('linkedAccount');
	});
});
