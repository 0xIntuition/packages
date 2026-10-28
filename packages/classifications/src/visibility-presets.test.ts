import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_SPECS, getClassification } from './classifications.js';
import {
	isNativeAtomClassificationType,
	NATIVE_ATOM_CLASSIFICATION_TYPES,
	nativeAtomClassificationTypeForData,
} from './native-atom-types.js';
import {
	ALL_ATOMS_VISIBILITY,
	ATOM_VISIBILITY_MODES,
	filterClassificationSpecsForPrimaryCatalogue,
	isClassificationTypeInPrimaryCatalogue,
	PRIMARY_ITEM_CATALOGUE_PRESET,
	PRIMARY_ITEM_CATALOGUE_VISIBILITY,
	resolveAtomVisibilityFilters,
} from './visibility-presets.js';

describe('primary item catalogue preset', () => {
	it('exposes the expected visibility mode ids', () => {
		expect(PRIMARY_ITEM_CATALOGUE_VISIBILITY).toBe('primary-item-catalogue');
		expect(ALL_ATOMS_VISIBILITY).toBe('all');
		expect(ATOM_VISIBILITY_MODES).toEqual(['primary-item-catalogue', 'all']);
	});

	it('hides exactly the confirmed machinery classification types', () => {
		expect([...PRIMARY_ITEM_CATALOGUE_PRESET.hiddenClassificationTypes].sort()).toEqual(
			[
				'Account',
				'AuthIdentity',
				'Category',
				'Comment',
				'Community',
				'DefinedTerm',
				'EnshrinedPredicate',
				'IntuitionAuthUser',
				'IntuitionOAuthAtom',
				'Post',
				'Reaction',
				'Resource',
				'Stack',
			].sort()
		);
	});

	it('hides EthereumAccount only via the self-created row rule', () => {
		expect(PRIMARY_ITEM_CATALOGUE_PRESET.hiddenSelfCreatedClassificationTypes).toEqual([
			'EthereumAccount',
		]);
		expect(PRIMARY_ITEM_CATALOGUE_PRESET.hiddenClassificationTypes).not.toContain(
			'EthereumAccount'
		);
		expect(isClassificationTypeInPrimaryCatalogue('EthereumAccount')).toBe(true);
	});

	it('keeps uncertain and external-content types visible', () => {
		for (const visible of [
			'Unknown',
			'Thing',
			'SocialMediaAccount',
			'SocialMediaPosting',
			'Person',
			'Review',
			'Note',
		]) {
			expect(isClassificationTypeInPrimaryCatalogue(visible)).toBe(true);
		}
	});

	it('does not delete hidden classes from the canonical spec registry', () => {
		expect(getClassification('comment')).toBeDefined();
		expect(getClassification('defined-term')).toBeDefined();
	});

	it('filters spec option lists to catalogue-visible classes', () => {
		const filtered = filterClassificationSpecsForPrimaryCatalogue(CLASSIFICATION_SPECS);
		const types = filtered.map((spec) => spec.type);
		expect(types).not.toContain('Comment');
		expect(types).not.toContain('DefinedTerm');
		expect(types).toContain('Movie');
		expect(types).toContain('EthereumAccount');
		expect(filtered.length).toBe(CLASSIFICATION_SPECS.length - 2);
	});
});

describe('resolveAtomVisibilityFilters', () => {
	it('defaults to the primary item catalogue', () => {
		const resolved = resolveAtomVisibilityFilters({});
		expect(resolved.excludeClassifications).toEqual(
			expect.arrayContaining(['Post', 'Comment', 'Stack', 'Account', 'AuthIdentity'])
		);
		expect(resolved.excludeSelfCreatedClassifications).toEqual(['EthereumAccount']);
	});

	it('merges and dedupes caller exclusions with the preset', () => {
		const resolved = resolveAtomVisibilityFilters({
			excludeClassifications: ['Thing', 'Post', ' ', ''],
		});
		expect(resolved.excludeClassifications).toContain('Thing');
		expect(resolved.excludeClassifications?.filter((value) => value === 'Post')).toHaveLength(1);
		expect(resolved.excludeClassifications).not.toContain(' ');
	});

	it('caller exclusions cannot re-include preset-hidden classes', () => {
		const resolved = resolveAtomVisibilityFilters({ excludeClassifications: [] });
		expect(resolved.excludeClassifications).toContain('Post');
	});

	it('visibility "all" applies only caller exclusions and no self-created rule', () => {
		expect(resolveAtomVisibilityFilters({ visibility: 'all' })).toEqual({
			excludeClassifications: undefined,
			excludeSelfCreatedClassifications: undefined,
		});
		expect(
			resolveAtomVisibilityFilters({ visibility: 'all', excludeClassifications: ['Stack'] })
		).toEqual({
			excludeClassifications: ['Stack'],
			excludeSelfCreatedClassifications: undefined,
		});
	});
});

describe('native atom classification types', () => {
	it('covers every writer-minted machinery type observed in the KG', () => {
		for (const nativeType of [
			'Post',
			'Comment',
			'Reaction',
			'Stack',
			'Community',
			'Account',
			'AuthIdentity',
			'IntuitionOAuthAtom',
			'IntuitionAuthUser',
			'Category',
			'DefinedTerm',
			'EnshrinedPredicate',
			'Resource',
		]) {
			expect(isNativeAtomClassificationType(nativeType)).toBe(true);
		}
	});

	it('never claims engine-producible content types as native', () => {
		for (const contentType of [
			'Thing',
			'Unknown',
			'Movie',
			'MusicRecording',
			'WebSite',
			'SocialMediaPosting',
			'EthereumAccount',
			'Person',
		]) {
			expect(isNativeAtomClassificationType(contentType)).toBe(false);
		}
	});

	it('coincides with the catalogue hidden list today, by design review — not by derivation', () => {
		// Pipeline authority (native types) and product visibility (preset) are
		// separate concepts that currently agree. If this test fails after you
		// changed one list, decide deliberately whether the other should follow.
		expect([...NATIVE_ATOM_CLASSIFICATION_TYPES].sort()).toEqual(
			[...PRIMARY_ITEM_CATALOGUE_PRESET.hiddenClassificationTypes].sort()
		);
	});
});

describe('nativeAtomClassificationTypeForData', () => {
	const uuid = '3ff0f02e-e809-48db-a37f-8316b1fc1b20';

	it('recognizes both native post data encodings', () => {
		expect(nativeAtomClassificationTypeForData(`post:${uuid}`)).toBe('Post');
		expect(nativeAtomClassificationTypeForData(`intuition:post:post:${uuid}`)).toBe('Post');
		expect(nativeAtomClassificationTypeForData(`intuition:post:${uuid}`)).toBe('Post');
	});

	it('recognizes stack, comment, and reaction URNs', () => {
		expect(nativeAtomClassificationTypeForData(`stack:${uuid}`)).toBe('Stack');
		expect(nativeAtomClassificationTypeForData(`intuition:stack:${uuid}`)).toBe('Stack');
		expect(nativeAtomClassificationTypeForData(`comment:${uuid}`)).toBe('Comment');
		expect(nativeAtomClassificationTypeForData(`reaction:${uuid}`)).toBe('Reaction');
	});

	it('never claims user content that merely resembles a URN', () => {
		expect(nativeAtomClassificationTypeForData('post:hello world')).toBeNull();
		expect(nativeAtomClassificationTypeForData('post:123')).toBeNull();
		expect(nativeAtomClassificationTypeForData('https://example.com/post:abc')).toBeNull();
		expect(nativeAtomClassificationTypeForData(`note:${uuid}`)).toBeNull();
		expect(nativeAtomClassificationTypeForData(uuid)).toBeNull();
		expect(nativeAtomClassificationTypeForData('')).toBeNull();
		expect(nativeAtomClassificationTypeForData(null)).toBeNull();
	});
});
