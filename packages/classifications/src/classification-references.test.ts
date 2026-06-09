import { PREDICATE_DEFS } from '@0xintuition/predicates';
import { getPropertiesFor, getType } from '@0xintuition/schema-org';
import { describe, expect, it } from 'vitest';

import { CLASSIFICATION_SPECS, getClassification, getMetadataPredicatesFor } from './index.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';
const LOCAL_SCHEMA_ORG_LIKE_SLUGS = new Set(['social-media-account']);

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
				if (!LOCAL_SCHEMA_ORG_LIKE_SLUGS.has(spec.slug)) {
					issues.push(`${spec.slug}: unknown schema.org type "${spec.schema.type}"`);
				}

				for (const field of spec.fields) {
					if (field.schemaProperty) {
						issues.push(
							`${spec.slug}.${field.key}: cannot reference schema.org property without a resolved schema.org type`
						);
					}
				}

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
		]);
	});

	it('keeps the legacy social media account type outside schema.org field validation', () => {
		const socialMediaAccount = getClassification('social-media-account');

		expect(socialMediaAccount?.schema).toEqual({
			context: SCHEMA_ORG_CONTEXT,
			type: 'SocialMediaAccount',
		});
		expect(getType('SocialMediaAccount')).toBeUndefined();
		expect(socialMediaAccount?.fields.every((field) => !field.schemaProperty)).toBe(true);
		expect(socialMediaAccount?.metadataPredicates).toContain('linkedAccount');
	});
});
