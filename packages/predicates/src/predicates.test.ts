import { calculateAtomId } from '@0xintuition/ids';
import { describe, expect, it } from 'vitest';
import {
	createPredicateAtomData,
	detectSubjectContext,
	ENTITY_PREDICATE_MAP,
	getEntityTypesForPredicate,
	getPredicateAtomData,
	getPredicateByKey,
	getPredicateByName,
	getPredicateDisplayName,
	getPredicateId,
	getPredicateRecord,
	getPredicateRecordByName,
	getPredicateStatus,
	getPredicatesByCategory,
	getPredicatesByMarketPattern,
	getPredicatesByStatus,
	getPredicatesForEntityType,
	LAUNCH_PREDICATE_DEFS,
	LAUNCH_PREDICATE_IDS,
	LAUNCH_PREDICATE_KEYS,
	PREDICATE_DEFS,
	PREDICATE_IDS,
	PREDICATE_RECORDS,
	renderLocalizedPredicate,
	renderPredicate,
} from './index';

describe('@0xintuition/predicates registry', () => {
	it('defines the full 97-predicate registry with the expected category counts', () => {
		expect(PREDICATE_RECORDS).toHaveLength(97);
		expect(getPredicatesByCategory('Identity/Classification')).toHaveLength(4);
		expect(getPredicatesByCategory('Social/Reputation')).toHaveLength(10);
		expect(getPredicatesByCategory('Curation/Containment')).toHaveLength(8);
		expect(getPredicatesByCategory('Authorship/Contribution')).toHaveLength(6);
		expect(getPredicatesByCategory('Metadata/Linking')).toHaveLength(8);
		expect(getPredicatesByCategory('Affiliation/Membership')).toHaveLength(6);
		expect(getPredicatesByCategory('Domain-Specific')).toHaveLength(5);
		expect(getPredicatesByCategory('Sentiment/Opinion')).toHaveLength(8);
		expect(getPredicatesByCategory('Comparison/Ranking')).toHaveLength(8);
		expect(getPredicatesByCategory('Knowledge/Expertise')).toHaveLength(8);
		expect(getPredicatesByCategory('Provenance/Evidence')).toHaveLength(8);
		expect(getPredicatesByCategory('Temporal/Lifecycle')).toHaveLength(6);
		expect(getPredicatesByCategory('Governance/Policy')).toHaveLength(6);
		expect(getPredicatesByCategory('Economic/Market')).toHaveLength(6);
	});

	it('supports lookup helpers across key, name, category, market pattern, and status', () => {
		expect(getPredicateRecord('follow')).toEqual(
			expect.objectContaining({ key: 'follow', status: 'enshrined' })
		);
		expect(getPredicateByKey('follow')).toEqual(PREDICATE_DEFS.follow);
		expect(getPredicateByName('FOLLOW')).toEqual(PREDICATE_DEFS.follow);
		expect(getPredicateRecordByName(' follow ')).toEqual(
			expect.objectContaining({ key: 'follow' })
		);
		expect(getPredicateStatus('follow')).toBe('enshrined');
		expect(getPredicatesByStatus('deprecated')).toHaveLength(0);
		expect(getPredicatesByStatus('enshrined')).toHaveLength(LAUNCH_PREDICATE_KEYS.length);
		expect(getPredicatesByMarketPattern('depositional')).toContainEqual(
			expect.objectContaining({ key: 'follow' })
		);
		expect(getPredicatesByMarketPattern('comparative')).toContainEqual(
			expect.objectContaining({ key: 'betterThan' })
		);
	});

	it('keeps registry invariants stable', () => {
		const keys = new Set<string>();
		const names = new Set<string>();
		const ids = new Set<string>();

		for (const record of PREDICATE_RECORDS) {
			expect(keys.has(record.key)).toBe(false);
			expect(names.has(record.name.toLowerCase())).toBe(false);

			keys.add(record.key);
			names.add(record.name.toLowerCase());

			const atomData = getPredicateAtomData(record.key);
			const atomId = getPredicateId(record.key);

			expect(atomId).toBe(calculateAtomId(atomData));
			expect(ids.has(atomId)).toBe(false);
			ids.add(atomId);

			if (record.conjugates) {
				expect(record.thirdPerson).toBeTruthy();
			}
		}
	});

	it('populates the three semantic flags as booleans on every record', () => {
		for (const record of PREDICATE_RECORDS) {
			expect(typeof record.isTransitive).toBe('boolean');
			expect(typeof record.isSymmetric).toBe('boolean');
			expect(typeof record.isHierarchical).toBe('boolean');
		}
	});

	it('records expected semantic flags for anchor predicates', () => {
		const sameAs = getPredicateRecord('sameAs');
		expect(sameAs?.isTransitive).toBe(true);
		expect(sameAs?.isSymmetric).toBe(true);
		expect(sameAs?.inversePredicate).toBe('same as');

		const contain = getPredicateRecord('contain');
		expect(contain?.isHierarchical).toBe(true);
		expect(contain?.inversePredicate).toBe('listed in');

		const listedIn = getPredicateRecord('listedIn');
		expect(listedIn?.isHierarchical).toBe(true);
		expect(listedIn?.inversePredicate).toBe('contain');

		const follow = getPredicateRecord('follow');
		expect(follow?.isTransitive).toBe(false);
		expect(follow?.isSymmetric).toBe(false);
		expect(follow?.isHierarchical).toBe(false);
		expect(follow?.inversePredicate).toBeUndefined();

		const precededBy = getPredicateRecord('precededBy');
		expect(precededBy?.isTransitive).toBe(true);
		expect(precededBy?.inversePredicate).toBe('followed by');

		const followedBy = getPredicateRecord('followedBy');
		expect(followedBy?.isTransitive).toBe(true);
		expect(followedBy?.inversePredicate).toBe('preceded by');
	});

	it('includes concrete usage examples for every Identity/Classification predicate', () => {
		const identityPredicates = PREDICATE_RECORDS.filter(
			(predicate) => predicate.category === 'Identity/Classification'
		);

		expect(identityPredicates).toHaveLength(4);

		for (const predicate of identityPredicates) {
			expect(predicate.examples?.length ?? 0).toBeGreaterThan(0);
		}
	});

	it('creates canonical predicate atom data and deterministic ids', () => {
		const atomData = createPredicateAtomData('follow', 'Directional subscription');

		expect(atomData).toBe(
			'{"@context":"https://schema.org/","@type":"DefinedTerm","name":"follow","description":"Directional subscription"}'
		);
		expect(PREDICATE_IDS.follow).toBe(
			calculateAtomId(
				createPredicateAtomData(PREDICATE_DEFS.follow.name, PREDICATE_DEFS.follow.description)
			)
		);
	});

	it('exports the 25 enshrined launch predicates and keeps launch helpers aligned', () => {
		expect(LAUNCH_PREDICATE_KEYS).toHaveLength(25);
		expect(LAUNCH_PREDICATE_KEYS).toContain('follow');
		expect(LAUNCH_PREDICATE_KEYS).toContain('betterThan');
		expect(LAUNCH_PREDICATE_KEYS).toContain('listedIn');

		for (const key of LAUNCH_PREDICATE_KEYS) {
			expect(LAUNCH_PREDICATE_DEFS[key]).toEqual(PREDICATE_DEFS[key]);
			expect(LAUNCH_PREDICATE_IDS[key]).toBe(PREDICATE_IDS[key]);
			expect(getPredicateStatus(key)).toBe('enshrined');
		}
	});
});

describe('@0xintuition/predicates display', () => {
	it('renders conjugated and localized predicate forms', () => {
		expect(renderPredicate('follow', 'singular')).toBe('follows');
		expect(renderPredicate('follow', 'first-person')).toBe('follow');
		expect(renderPredicate('bullish on', 'singular')).toBe('bullish on');

		expect(
			renderLocalizedPredicate('follow', {
				subjectContext: 'singular',
				localeBundle: {
					displayName: 'Suivre',
					forms: {
						base: 'suivre',
						thirdPerson: 'suit',
						pastParticiple: 'suivi',
					},
					meta: {
						conjugates: true,
					},
				},
			})
		).toBe('suit');
		expect(
			renderLocalizedPredicate('follow', {
				form: 'displayName',
				localeBundle: {
					displayName: 'Follow',
				},
			})
		).toBe('Follow');
		expect(renderLocalizedPredicate('follow', { form: 'displayName' })).toBe('Follow');
		expect(renderLocalizedPredicate('follow', { form: 'pastParticiple' })).toBe('follow');
		expect(getPredicateDisplayName('follow')).toBe('Follow');
		expect(detectSubjectContext('I')).toBe('first-person');
		expect(detectSubjectContext('Alice')).toBe('singular');
	});
});

describe('@0xintuition/predicates entity mappings', () => {
	it('covers the documented totals and keeps universal lookups deduplicated', () => {
		expect(ENTITY_PREDICATE_MAP.Person).toHaveLength(46);
		expect(ENTITY_PREDICATE_MAP.Organization).toHaveLength(24);
		expect(ENTITY_PREDICATE_MAP.Software).toHaveLength(31);
		expect(ENTITY_PREDICATE_MAP.ERC20Token).toHaveLength(18);

		const personCore = getPredicatesForEntityType('Person', 'core');
		const personAll = getPredicatesForEntityType('Person');
		const predicateKeys = personAll.map((entry) => entry.predicateKey);

		expect(personCore.every((entry) => entry.priority === 'core')).toBe(true);
		expect(personCore).toContainEqual(expect.objectContaining({ predicateKey: 'follow' }));
		expect(predicateKeys.length).toBe(new Set(predicateKeys).size);
		expect(getEntityTypesForPredicate('sameAs')).toHaveLength(12);
		expect(getEntityTypesForPredicate('follow')).toContain('Person');
	});
});
