import { PREDICATE_DEFS, PREDICATE_IDS, type PredicateKey } from './predicates';

export const LAUNCH_PREDICATE_KEYS = [
	'contain',
	'listedIn',
	'curatedBy',
	'hasTag',
	'hasType',
	'follow',
	'like',
	'hasDescription',
	'url',
	'imgUrl',
	'trust',
	'distrust',
	'endorse',
	'recommend',
	'vouchFor',
	'agreeWith',
	'disagreeWith',
	'bullishOn',
	'bearishOn',
	'createdBy',
	'sameAs',
	'linkedAccount',
	'hasCategory',
	'betterThan',
	'alternativeTo',
] as const satisfies readonly PredicateKey[];

export type LaunchPredicateKey = (typeof LAUNCH_PREDICATE_KEYS)[number];

const LAUNCH_PREDICATE_SET = new Set<string>(LAUNCH_PREDICATE_KEYS);

export const CONTAIN_ID = PREDICATE_IDS.contain;
export const LISTED_IN_ID = PREDICATE_IDS.listedIn;
export const CURATED_BY_ID = PREDICATE_IDS.curatedBy;
export const HAS_TAG_ID = PREDICATE_IDS.hasTag;
export const HAS_TYPE_ID = PREDICATE_IDS.hasType;
export const FOLLOW_ID = PREDICATE_IDS.follow;
export const LIKE_ID = PREDICATE_IDS.like;
export const HAS_DESCRIPTION_ID = PREDICATE_IDS.hasDescription;
export const URL_ID = PREDICATE_IDS.url;
export const IMG_URL_ID = PREDICATE_IDS.imgUrl;
export const TRUST_ID = PREDICATE_IDS.trust;
export const DISTRUST_ID = PREDICATE_IDS.distrust;
export const ENDORSE_ID = PREDICATE_IDS.endorse;
export const RECOMMEND_ID = PREDICATE_IDS.recommend;
export const VOUCH_FOR_ID = PREDICATE_IDS.vouchFor;
export const AGREE_WITH_ID = PREDICATE_IDS.agreeWith;
export const DISAGREE_WITH_ID = PREDICATE_IDS.disagreeWith;
export const BULLISH_ON_ID = PREDICATE_IDS.bullishOn;
export const BEARISH_ON_ID = PREDICATE_IDS.bearishOn;
export const CREATED_BY_ID = PREDICATE_IDS.createdBy;
export const SAME_AS_ID = PREDICATE_IDS.sameAs;
export const LINKED_ACCOUNT_ID = PREDICATE_IDS.linkedAccount;
export const HAS_CATEGORY_ID = PREDICATE_IDS.hasCategory;
export const BETTER_THAN_ID = PREDICATE_IDS.betterThan;
export const ALTERNATIVE_TO_ID = PREDICATE_IDS.alternativeTo;

export const LAUNCH_PREDICATE_DEFS = Object.fromEntries(
	LAUNCH_PREDICATE_KEYS.map((key) => [key, PREDICATE_DEFS[key]])
) as Record<LaunchPredicateKey, (typeof PREDICATE_DEFS)[LaunchPredicateKey]>;

export const LAUNCH_PREDICATE_IDS = Object.fromEntries(
	LAUNCH_PREDICATE_KEYS.map((key) => [key, PREDICATE_IDS[key]])
) as Record<LaunchPredicateKey, (typeof PREDICATE_IDS)[LaunchPredicateKey]>;

export function isLaunchPredicate(key: string): key is LaunchPredicateKey {
	return LAUNCH_PREDICATE_SET.has(key);
}
