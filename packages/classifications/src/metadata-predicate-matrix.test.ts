import { PREDICATE_DEFS } from '@0xintuition/predicates';
import { getPropertiesFor, getType } from '@0xintuition/schema-org';
import { describe, expect, it } from 'vitest';

import {
	CLASSIFICATION_SPECS,
	getClassification,
	getMetadataPredicateMatrixFor,
	getMetadataPredicateRelation,
	METADATA_PREDICATE_MATRIX,
} from './index.js';

const SCHEMA_ORG_CONTEXT = 'https://schema.org/';
const VALID_SCHEMA_MAPPING_MATCHES = new Set(['exact', 'semantic', 'broader', 'narrower']);
const VALID_PRIMITIVE_TYPES = new Set([
	'string',
	'url',
	'number',
	'integer',
	'boolean',
	'iso-date',
	'iso-datetime',
	'duration',
]);

describe('metadata predicate matrix', () => {
	it('models the MusicRecording predicate/object examples', () => {
		expect(
			getMetadataPredicateMatrixFor('music-recording').map((entry) => entry.predicate)
		).toEqual(['byArtist', 'inAlbum', 'inPlaylist', 'hasCategory', 'sameAs']);

		expect(getMetadataPredicateRelation('music-recording', 'byArtist')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'music-group' },
			{ kind: 'classification', slug: 'person' },
		]);

		expect(getMetadataPredicateRelation('music-recording', 'inAlbum')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'music-album' },
		]);

		expect(getMetadataPredicateRelation('music-recording', 'inPlaylist')?.expectedObjects).toEqual([
			{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'MusicPlaylist' },
		]);

		expect(getMetadataPredicateRelation('music-recording', 'hasCategory')?.schemaMappings).toEqual([
			expect.objectContaining({
				context: SCHEMA_ORG_CONTEXT,
				property: 'genre',
				match: 'broader',
			}),
		]);

		expect(getMetadataPredicateRelation('music-recording', 'sameAs')?.expectedObjects).toEqual([
			{ kind: 'same-classification' },
		]);
		expect(getMetadataPredicateRelation('music-recording', 'sameAs')?.schemaMappings).toEqual([
			expect.objectContaining({
				context: SCHEMA_ORG_CONTEXT,
				property: 'sameAs',
				match: 'exact',
			}),
		]);
	});

	it('keeps matrix entries resolvable and anchored to promoted metadata predicates', () => {
		const classificationSlugs = new Set(CLASSIFICATION_SPECS.map((spec) => spec.slug));
		const predicateKeys = new Set(Object.keys(PREDICATE_DEFS));
		const seen = new Set<string>();
		const issues: string[] = [];

		for (const entry of METADATA_PREDICATE_MATRIX) {
			const key = `${entry.subjectClassification}:${entry.predicate}`;

			if (seen.has(key)) {
				issues.push(`${key}: duplicate matrix entry`);
			}
			seen.add(key);

			const subject = getClassification(entry.subjectClassification);
			if (!subject) {
				issues.push(`${key}: unknown subject classification`);
				continue;
			}

			if (!predicateKeys.has(entry.predicate)) {
				issues.push(`${key}: unknown predicate key`);
			}

			if (!subject.metadataPredicates.includes(entry.predicate)) {
				issues.push(`${key}: predicate is not promoted by subject metadataPredicates`);
			}

			if (entry.expectedObjects.length === 0) {
				issues.push(`${key}: expectedObjects must not be empty`);
			}

			for (const expectedObject of entry.expectedObjects) {
				switch (expectedObject.kind) {
					case 'classification':
						if (!classificationSlugs.has(expectedObject.slug)) {
							issues.push(`${key}: unknown expected classification "${expectedObject.slug}"`);
						}
						break;
					case 'schema':
						if (expectedObject.context === SCHEMA_ORG_CONTEXT && !getType(expectedObject.type)) {
							issues.push(`${key}: unknown schema.org expected type "${expectedObject.type}"`);
						}
						break;
					case 'primitive':
						if (!VALID_PRIMITIVE_TYPES.has(expectedObject.valueType)) {
							issues.push(`${key}: unknown primitive value type "${expectedObject.valueType}"`);
						}
						break;
					case 'same-classification':
						break;
					case 'any':
						if (expectedObject.reason.trim().length === 0) {
							issues.push(`${key}: any expected object must explain why`);
						}
						break;
					default:
						expectedObject satisfies never;
				}
			}

			for (const mapping of entry.schemaMappings ?? []) {
				if (!VALID_SCHEMA_MAPPING_MATCHES.has(mapping.match)) {
					issues.push(`${key}: unknown schema mapping match "${mapping.match}"`);
				}

				if (mapping.context === SCHEMA_ORG_CONTEXT) {
					if (subject.schema?.context !== SCHEMA_ORG_CONTEXT) {
						issues.push(`${key}: schema.org mapping on non-schema.org subject`);
						continue;
					}

					const propertyNames = new Set(
						getPropertiesFor(subject.schema.type).map((property) => property.name)
					);

					if (!propertyNames.has(mapping.property)) {
						issues.push(
							`${key}: unknown schema.org property "${mapping.property}" for ${subject.schema.type}`
						);
					}
				}
			}
		}

		expect(issues).toEqual([]);
	});

	it('models sameAs as strict same-classification identity for all promoted classifications', () => {
		const sameAsSubjects = CLASSIFICATION_SPECS.filter((spec) =>
			spec.metadataPredicates.includes('sameAs')
		).map((spec) => spec.slug);
		const matrixSameAsSubjects = METADATA_PREDICATE_MATRIX.filter(
			(entry) => entry.predicate === 'sameAs'
		).map((entry) => entry.subjectClassification);

		expect(new Set(matrixSameAsSubjects)).toEqual(new Set(sameAsSubjects));

		for (const subjectClassification of sameAsSubjects) {
			const entry = getMetadataPredicateRelation(subjectClassification, 'sameAs');

			expect(entry?.expectedObjects).toEqual([{ kind: 'same-classification' }]);
			expect(entry?.schemaMappings).toEqual([
				expect.objectContaining({
					context: SCHEMA_ORG_CONTEXT,
					property: 'sameAs',
					match: 'exact',
				}),
			]);
		}
	});

	it('does not add sameAs matrix entries for explicitly excluded classifications', () => {
		const excludedSubjects = CLASSIFICATION_SPECS.filter(
			(spec) => !spec.metadataPredicates.includes('sameAs')
		).map((spec) => spec.slug);

		for (const subjectClassification of excludedSubjects) {
			expect(getMetadataPredicateRelation(subjectClassification, 'sameAs')).toBeUndefined();
		}
	});

	it('models curated non-sameAs relationship examples for generated UI', () => {
		expect(getMetadataPredicateRelation('book', 'authoredBy')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'person' },
		]);
		expect(getMetadataPredicateRelation('book', 'publisher')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'company' },
		]);
		expect(getMetadataPredicateRelation('book', 'reference')?.expectedObjects).toEqual([
			{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'CreativeWork' },
		]);

		expect(getMetadataPredicateRelation('person', 'url')?.expectedObjects).toEqual([
			{ kind: 'primitive', valueType: 'url' },
		]);
		expect(getMetadataPredicateRelation('person', 'alumniOf')?.expectedObjects).toEqual([
			{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'EducationalOrganization' },
		]);

		expect(getMetadataPredicateRelation('movie', 'director')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'person' },
		]);
		expect(getMetadataPredicateRelation('movie', 'musicBy')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'music-group' },
			{ kind: 'classification', slug: 'person' },
		]);
		expect(getMetadataPredicateRelation('movie', 'trailer')?.expectedObjects).toEqual([
			{ kind: 'classification', slug: 'video-object' },
		]);

		expect(
			getMetadataPredicateRelation('software-application', 'compatibleWith')?.expectedObjects
		).toEqual([{ kind: 'schema', context: SCHEMA_ORG_CONTEXT, type: 'SoftwareApplication' }]);
		expect(
			getMetadataPredicateRelation('software-application', 'softwareAddOn')?.expectedObjects
		).toEqual([{ kind: 'classification', slug: 'software-application' }]);
	});

	it('leaves still-unmodeled object targets unresolved until later matrix passes', () => {
		expect(getMetadataPredicateRelation('article', 'authoredBy')).toBeUndefined();
	});
});
