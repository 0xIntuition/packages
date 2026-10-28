import type { Address, Hex } from 'viem';

type AtomCreatedLike = { address?: Address; args: { termId: Hex } };
type AtomContextLike = {
	address?: Address;
	args: { termId: Hex; registrant: Address; uris: readonly Hex[] };
};

/**
 * Associates creation context by deterministic `termId`. Receipt log position
 * is intentionally irrelevant because other protocol events may interleave.
 * When an atom has an emitter address, only context from that emitter is linked.
 */
export function associateAtomCreationContext<
	TAtom extends AtomCreatedLike,
	TContext extends AtomContextLike,
>(
	atomEvents: readonly TAtom[],
	contextEvents: readonly TContext[]
): AtomCreationContext<TAtom, TContext>[] {
	const contextsByTermId = new Map<Hex, TContext[]>();
	for (const context of contextEvents) {
		const existing = contextsByTermId.get(context.args.termId) ?? [];
		existing.push(context);
		contextsByTermId.set(context.args.termId, existing);
	}

	return atomEvents.map((atom) => ({
		atom,
		contexts: (contextsByTermId.get(atom.args.termId) ?? []).filter(
			(context) => !atom.address || context.address?.toLowerCase() === atom.address.toLowerCase()
		),
	}));
}

export type AtomCreationContext<TAtom, TContext> = { atom: TAtom; contexts: TContext[] };
