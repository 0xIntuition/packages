/**
 * Classification types that Intuition's own write paths mint with authority:
 * social projections (posts, comments, reactions), container writers (stacks,
 * communities), auth/wallet flows (accounts, auth identities), and
 * taxonomy/protocol seeds (categories, defined terms, predicates, resources).
 *
 * When one of these types is already set on a node before the classification
 * pipeline runs, the write-time type is the source of truth. The runtime
 * classification engine only sees the node's opaque data (URNs, bare UUIDs,
 * addresses) and would misclassify it — observed in production as native
 * posts being overwritten to `Thing` by the plain-text plugin.
 *
 * This is a pipeline-authority concept, deliberately separate from the
 * `primary-item-catalogue` visibility preset (product policy): the lists
 * currently coincide but must be allowed to evolve independently.
 */
export const NATIVE_ATOM_CLASSIFICATION_TYPES = Object.freeze([
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
] as const) as readonly string[];

export function isNativeAtomClassificationType(classificationType: string): boolean {
	return NATIVE_ATOM_CLASSIFICATION_TYPES.includes(classificationType);
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * Native content atoms are minted through two doors with two data encodings:
 * the user's on-chain atom (`post:<uuid>`) and backend-ensured graph anchors
 * (`intuition:post:post:<uuid>` — the double segment is the legacy URN builder
 * prepending its own prefix). Both are matched here, anchored to a UUID so an
 * arbitrary user string like `post:hello` can never be claimed as native.
 */
const NATIVE_DATA_URN_PATTERN = new RegExp(
	`^(?:intuition:)?(post|comment|reaction|stack):(?:(?:post|comment|reaction|stack):)?${UUID}$`,
	'i'
);

const NATIVE_URN_KIND_TO_TYPE: Readonly<Record<string, string>> = Object.freeze({
	comment: 'Comment',
	post: 'Post',
	reaction: 'Reaction',
	stack: 'Stack',
});

/**
 * Resolve the authoritative classification type for a node whose raw data is
 * a native Intuition content URN, or null when the data is not confidently
 * native-shaped. Used by the classification pipeline to avoid running the
 * generic engine on opaque native identifiers.
 */
export function nativeAtomClassificationTypeForData(
	data: string | null | undefined
): string | null {
	if (!data) {
		return null;
	}
	const match = NATIVE_DATA_URN_PATTERN.exec(data.trim());
	if (!match?.[1]) {
		return null;
	}
	return NATIVE_URN_KIND_TO_TYPE[match[1].toLowerCase()] ?? null;
}
