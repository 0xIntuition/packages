import type { Address, Hex } from 'viem';

type AtomCreatedLike = { args: { termId: Hex } };
type AtomContextLike = { args: { termId: Hex; registrant: Address; uris: readonly Hex[] } };

/**
 * Associates creation context by deterministic `termId`. Receipt log position
 * is intentionally irrelevant because other protocol events may interleave.
 */
export function associateAtomCreationContext<
	TAtom extends AtomCreatedLike,
	TContext extends AtomContextLike,
>(atomEvents: readonly TAtom[], contextEvents: readonly TContext[]) {
	const contextsByTermId = new Map<Hex, TContext[]>();
	for (const context of contextEvents) {
		const existing = contextsByTermId.get(context.args.termId) ?? [];
		existing.push(context);
		contextsByTermId.set(context.args.termId, existing);
	}

	return atomEvents.map((atom) => ({
		atom,
		contexts: contextsByTermId.get(atom.args.termId) ?? [],
	}));
}
