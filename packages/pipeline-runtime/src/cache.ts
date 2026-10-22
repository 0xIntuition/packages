export type CacheOperationOptions = {
	signal?: AbortSignal;
};

/**
 * Cache contract for Tracks B/C. Implementations must observe signal for the
 * underlying I/O, not merely stop awaiting an otherwise detached request.
 */
export interface CancellableCacheAdapter<Entry, Key extends string = string> {
	get(key: Key, options?: CacheOperationOptions): Promise<Entry | null>;
	set(key: Key, entry: Entry, ttlMs: number, options?: CacheOperationOptions): Promise<void>;
	remove(key: Key, options?: CacheOperationOptions): Promise<void>;
}

export type MemoryCancellableCacheOptions = {
	now?: () => number;
};

type StoredEntry<Entry> = {
	entry: Entry;
	expiresAt: number;
};

/** Small TTL-aware reference adapter intended for tests and local composition. */
export function createMemoryCancellableCache<Entry, Key extends string = string>(
	options: MemoryCancellableCacheOptions = {}
): CancellableCacheAdapter<Entry, Key> {
	const storage = new Map<Key, StoredEntry<Entry>>();
	const now = options.now ?? Date.now;

	return {
		async get(key, operationOptions) {
			throwIfAborted(operationOptions?.signal);
			const stored = storage.get(key);
			if (!stored) {
				return null;
			}
			if (stored.expiresAt <= now()) {
				storage.delete(key);
				return null;
			}
			return stored.entry;
		},
		async set(key, entry, ttlMs, operationOptions) {
			throwIfAborted(operationOptions?.signal);
			storage.set(key, {
				entry,
				expiresAt: now() + Math.max(0, ttlMs),
			});
		},
		async remove(key, operationOptions) {
			throwIfAborted(operationOptions?.signal);
			storage.delete(key);
		},
	};
}

function throwIfAborted(signal?: AbortSignal): void {
	if (!signal?.aborted) {
		return;
	}
	if (signal.reason !== undefined) {
		throw signal.reason;
	}
	const error = new Error('Cache operation aborted.');
	error.name = 'AbortError';
	throw error;
}
