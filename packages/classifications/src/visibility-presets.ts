import type { ClassificationSpec } from './types.js';

/**
 * Primary item catalogue visibility.
 *
 * Product-facing item discovery surfaces (Explore, global search, profile item
 * lists, item pickers) show only knowledge items. Atoms that exist as app
 * machinery stay valid graph nodes — addressable by id, usable in triples,
 * visible in admin tools — but are hidden from catalogue-style browsing.
 *
 * Policy: hide only what we are POSITIVE is machinery. Uncertainty is not
 * grounds for hiding — `Unknown` (pre-classification default) and `Thing`
 * (generic content) stay visible so fresh user items appear immediately.
 */

export const PRIMARY_ITEM_CATALOGUE_VISIBILITY = 'primary-item-catalogue' as const;

/** Raw graph access — no catalogue filtering. For admin/debug/lookup callers. */
export const ALL_ATOMS_VISIBILITY = 'all' as const;

export const ATOM_VISIBILITY_MODES = [
	PRIMARY_ITEM_CATALOGUE_VISIBILITY,
	ALL_ATOMS_VISIBILITY,
] as const;

export type AtomVisibilityMode = (typeof ATOM_VISIBILITY_MODES)[number];

/**
 * Classification types hidden from the primary item catalogue. Every entry is
 * here because a known Intuition write path mints it as machinery:
 *
 * - Native social content (own surfaces): Post, Comment, Reaction
 * - Containers with own surfaces: Stack, Community
 * - Auth/wallet identity artifacts: Account, AuthIdentity, IntuitionOAuthAtom,
 *   IntuitionAuthUser
 * - Protocol/taxonomy vocabulary: Category, DefinedTerm, EnshrinedPredicate,
 *   Resource
 *
 * Deliberately NOT hidden: SocialMediaAccount / SocialMediaPosting (external
 * web content users post as items), Person, Thing, Unknown, and `Note` (no
 * known writer mints it; add it only when one exists).
 */
const PRIMARY_ITEM_CATALOGUE_HIDDEN_CLASSIFICATION_TYPES = [
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
] as const;

/**
 * Classification types hidden only when the atom is the creator's own wallet
 * (`lower(data) = lower(created_by)`). Signup mints a wallet atom for every
 * user; those are machinery. An address someone ELSE posted as an item is
 * knowledge content and stays visible.
 */
const PRIMARY_ITEM_CATALOGUE_HIDDEN_SELF_CREATED_TYPES = ['EthereumAccount'] as const;

export const PRIMARY_ITEM_CATALOGUE_PRESET = Object.freeze({
	id: PRIMARY_ITEM_CATALOGUE_VISIBILITY,
	hiddenClassificationTypes: Object.freeze([
		...PRIMARY_ITEM_CATALOGUE_HIDDEN_CLASSIFICATION_TYPES,
	]) as readonly string[],
	hiddenSelfCreatedClassificationTypes: Object.freeze([
		...PRIMARY_ITEM_CATALOGUE_HIDDEN_SELF_CREATED_TYPES,
	]) as readonly string[],
});

export type ClassificationVisibilityPreset = typeof PRIMARY_ITEM_CATALOGUE_PRESET;

export function isClassificationTypeInPrimaryCatalogue(classificationType: string): boolean {
	return !PRIMARY_ITEM_CATALOGUE_PRESET.hiddenClassificationTypes.includes(classificationType);
}

/**
 * Narrow spec-derived option lists (filter tabs, pickers) to catalogue-visible
 * classes so the UI never offers a class that always returns zero rows.
 */
export function filterClassificationSpecsForPrimaryCatalogue(
	classifications: readonly ClassificationSpec[]
): ClassificationSpec[] {
	return classifications.filter((classification) =>
		isClassificationTypeInPrimaryCatalogue(classification.type)
	);
}

export type ResolvedAtomVisibilityFilters = {
	excludeClassifications: string[] | undefined;
	excludeSelfCreatedClassifications: string[] | undefined;
};

/**
 * Expand a visibility mode into concrete exclusion filters, merging any
 * caller-provided exclusions. Callers below this boundary (KG service, DB
 * clients) never see visibility modes — only exclusion lists.
 */
export function resolveAtomVisibilityFilters(input: {
	visibility?: AtomVisibilityMode | undefined;
	excludeClassifications?: readonly string[] | undefined;
}): ResolvedAtomVisibilityFilters {
	const visibility = input.visibility ?? PRIMARY_ITEM_CATALOGUE_VISIBILITY;
	const callerExclusions = (input.excludeClassifications ?? []).filter(
		(value) => value.trim().length > 0
	);

	if (visibility === ALL_ATOMS_VISIBILITY) {
		return {
			excludeClassifications:
				callerExclusions.length > 0 ? [...new Set(callerExclusions)] : undefined,
			excludeSelfCreatedClassifications: undefined,
		};
	}

	return {
		excludeClassifications: [
			...new Set([...PRIMARY_ITEM_CATALOGUE_PRESET.hiddenClassificationTypes, ...callerExclusions]),
		],
		excludeSelfCreatedClassifications: [
			...PRIMARY_ITEM_CATALOGUE_PRESET.hiddenSelfCreatedClassificationTypes,
		],
	};
}
