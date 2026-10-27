/**
 * A cache that lives for one enrichment run (ENG-16980).
 *
 * The engine creates one per run and hands it to every plugin through
 * `EnrichmentPluginContext.pages`; it is dropped with the run, so it cannot
 * cross runs or users. It deduplicates the settled outcome of an expensive
 * keyed load (an HTML page fetch) between plugins of the same run: the first
 * caller runs the loader, concurrent and later callers share its promise.
 *
 * A loader reports a failure as part of its outcome rather than by throwing,
 * so a failed load is also shared (a WAF challenge is fetched once, not once
 * per plugin).
 *
 * The request behind a load belongs to all of its consumers, not to the one that
 * happened to start it. The loader gets a shared signal that aborts only when
 * every consumer has aborted (or the loader's own work fails); each consumer
 * races the shared promise against its own signal, so a consumer that gives up
 * (its own timeout, a cancel) fails alone while the others keep waiting, and the
 * request lives as long as the most patient consumer.
 */
export type RunPageCache = {
	/** Ids of the plugins that can consume this run's pages (the run's applicable plugins). */
	readonly consumers: ReadonlySet<string>;
	/**
	 * Returns the outcome stored under `key`, running `load` when there is none.
	 * `source` is `live` for the caller that ran the loader and `cache` for the
	 * others. `signal` is this consumer's own; when it aborts, this call rejects
	 * with its reason and the shared request is aborted only if no consumer is left.
	 */
	getOrLoad<T>(
		key: string,
		consumer: { signal?: AbortSignal | undefined },
		load: (shared: { signal: AbortSignal }) => Promise<T>
	): Promise<{ outcome: T; source: 'live' | 'cache' }>;
};

type Entry = {
	controller: AbortController;
	promise: Promise<unknown>;
	/** Consumers still waiting on the entry. */
	waiting: number;
	settled: boolean;
};

export function createRunPageCache(options: { consumers?: Iterable<string> } = {}): RunPageCache {
	const entries = new Map<string, Entry>();

	const start = <T>(key: string, load: (shared: { signal: AbortSignal }) => Promise<T>): Entry => {
		const controller = new AbortController();
		const entry: Entry = { controller, promise: Promise.resolve(), waiting: 0, settled: false };
		const settle = (failed: boolean) => {
			entry.settled = true;
			// A load that was aborted or threw is never reused by a later consumer.
			if ((failed || controller.signal.aborted) && entries.get(key) === entry) entries.delete(key);
		};
		entry.promise = load({ signal: controller.signal }).then(
			(outcome) => {
				settle(false);
				return outcome;
			},
			(error: unknown) => {
				settle(true);
				throw error;
			}
		);
		// Waiters observe the rejection; this keeps an abandoned entry from being unhandled.
		entry.promise.catch(() => undefined);
		entries.set(key, entry);
		return entry;
	};

	const wait = <T>(entry: Entry, signal: AbortSignal | undefined): Promise<T> =>
		new Promise<T>((resolve, reject) => {
			entry.waiting += 1;
			let done = false;
			const finish = () => {
				done = true;
				signal?.removeEventListener('abort', onAbort);
				entry.waiting -= 1;
			};
			const onAbort = () => {
				if (done) return;
				finish();
				// The last consumer to give up takes the request with it.
				if (entry.waiting === 0 && !entry.settled) entry.controller.abort(signal?.reason);
				reject(signal?.reason);
			};
			signal?.addEventListener('abort', onAbort, { once: true });
			if (signal?.aborted) {
				onAbort();
				return;
			}
			(entry.promise as Promise<T>).then(
				(value) => {
					if (done) return;
					finish();
					resolve(value);
				},
				(error: unknown) => {
					if (done) return;
					finish();
					reject(error);
				}
			);
		});

	return {
		consumers: new Set(options.consumers ?? []),
		async getOrLoad<T>(
			key: string,
			consumer: { signal?: AbortSignal | undefined },
			load: (shared: { signal: AbortSignal }) => Promise<T>
		) {
			let entry = entries.get(key);
			// A request every consumer gave up on is dead: a newcomer starts its own.
			if (entry?.controller.signal.aborted) {
				entries.delete(key);
				entry = undefined;
			}
			const source = entry ? ('cache' as const) : ('live' as const);
			entry ??= start(key, load);
			return { outcome: await wait<T>(entry, consumer.signal), source };
		},
	};
}
