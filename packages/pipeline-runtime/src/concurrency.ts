import { type Outcome, runWithSignal } from './outcome';

export type BoundedConcurrencyOptions = { concurrency: number };
export type BoundedConcurrencyPromiseOptions = BoundedConcurrencyOptions & { signal?: AbortSignal };

/**
 * Runs items in bounded parallel workers, preserving input order. Callback
 * construction throws are defects; Promise rejections are failures. Parent
 * cancellation rejects with its exact reason and stops admitting queued items.
 */
export async function forEachBounded<Item, A>(
	items: Iterable<Item>,
	f: (item: Item, signal: AbortSignal) => Promise<A>,
	options: BoundedConcurrencyPromiseOptions
): Promise<ReadonlyArray<Outcome<A, unknown>>> {
	const outcome = await runWithSignal(
		async (signal) => {
			const values = Array.from(items);
			const outcomes: Outcome<A>[] = new Array(values.length);
			let next = 0;
			const concurrency = Number.isFinite(options.concurrency)
				? Math.max(1, Math.floor(options.concurrency))
				: 1;
			await Promise.all(
				Array.from({ length: Math.min(concurrency, values.length) }, async () => {
					while (!signal.aborted && next < values.length) {
						const index = next++;
						outcomes[index] = await runWithSignal((itemSignal) => f(values[index]!, itemSignal), {
							signal,
						});
					}
				})
			);
			return outcomes;
		},
		{ signal: options.signal, rejectOnFailure: true }
	);
	return outcome.value;
}
