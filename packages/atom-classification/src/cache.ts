import type { CancellableCacheAdapter } from '@0xintuition/pipeline-runtime/cache';
import type {
	ClassificationClientClassificationHint,
	ClassificationRequest,
	ClassificationResolvedAtom,
	ClassificationResolverError,
	ClassificationRuntime,
} from './types';

export interface ClassificationCacheAdapter {
	get(key: string): Promise<ClassificationResolverCachedEntry | null>;
	set(key: string, entry: ClassificationResolverCachedEntry, ttlMs: number): Promise<void>;
	delete(key: string): Promise<void>;
}

type ClassificationCacheOperationOptions = {
	signal?: AbortSignal;
};

export type SignalAwareClassificationCacheAdapter = {
	readonly signalAware: true;
	get(
		key: string,
		options?: ClassificationCacheOperationOptions
	): Promise<ClassificationResolverCachedEntry | null>;
	set(
		key: string,
		entry: ClassificationResolverCachedEntry,
		ttlMs: number,
		options?: ClassificationCacheOperationOptions
	): Promise<void>;
	delete(key: string, options?: ClassificationCacheOperationOptions): Promise<void>;
};

export interface ClassificationResolverCachedEntry {
	atoms: ClassificationResolvedAtom[];
	fallbackUsed: boolean;
	metadata?: Record<string, unknown>;
	errors?: ClassificationResolverError[];
	cachedAt: string;
	ttlMs: number;
}

type CreateMemoryClassificationCacheAdapterOptions = {
	maxEntries?: number;
	now?: () => number;
};

type StoredEntry = {
	entry: ClassificationResolverCachedEntry;
	expiresAt: number;
	lastAccessedAt: number;
};

type CreateUpstashClassificationCacheAdapterOptions = {
	baseUrl: string;
	token: string;
	fetcher?: typeof fetch;
	httpTimeoutMs?: number;
};

type CreateUpstashClassificationCacheAdapterFromEnvOptions = {
	env?: Record<string, string | undefined>;
	fetcher?: typeof fetch;
	httpTimeoutMs?: number;
};

type CreateUpstashClassificationCacheAdapterFromInjectedEnvOptions = Omit<
	CreateUpstashClassificationCacheAdapterFromEnvOptions,
	'env'
>;

const DEFAULT_UPSTASH_HTTP_TIMEOUT_MS = 1_500;

export function createMemoryClassificationCacheAdapter(
	options: CreateMemoryClassificationCacheAdapterOptions = {}
): ClassificationCacheAdapter {
	const storage = new Map<string, StoredEntry>();
	const getNow = options.now ?? (() => Date.now());

	const adapter = {
		signalAware: true as const,
		async get(key: string, operationOptions?: ClassificationCacheOperationOptions) {
			throwIfAborted(operationOptions?.signal);
			const stored = storage.get(key);
			if (!stored) {
				return null;
			}

			if (stored.expiresAt <= getNow()) {
				storage.delete(key);
				return null;
			}

			stored.lastAccessedAt = getNow();
			storage.set(key, stored);
			return cloneCachedEntry(stored.entry);
		},

		async set(
			key: string,
			entry: ClassificationResolverCachedEntry,
			ttlMs: number,
			operationOptions?: ClassificationCacheOperationOptions
		) {
			throwIfAborted(operationOptions?.signal);
			const now = getNow();
			storage.set(key, {
				entry: cloneCachedEntry(entry),
				expiresAt: now + ttlMs,
				lastAccessedAt: now,
			});

			if (options.maxEntries && options.maxEntries > 0 && storage.size > options.maxEntries) {
				evictLeastRecentlyUsed(storage);
			}
		},

		async delete(key: string, operationOptions?: ClassificationCacheOperationOptions) {
			throwIfAborted(operationOptions?.signal);
			storage.delete(key);
		},
	} satisfies SignalAwareClassificationCacheAdapter;

	return adapter;
}

export function createUpstashClassificationCacheAdapterFromEnv(
	env?: Record<string, string | undefined>,
	options?: CreateUpstashClassificationCacheAdapterFromInjectedEnvOptions
): ClassificationCacheAdapter | undefined;
export function createUpstashClassificationCacheAdapterFromEnv(
	options?: CreateUpstashClassificationCacheAdapterFromEnvOptions
): ClassificationCacheAdapter | undefined;
export function createUpstashClassificationCacheAdapterFromEnv(
	env:
		| Record<string, string | undefined>
		| CreateUpstashClassificationCacheAdapterFromEnvOptions = process.env,
	injectedOptions: CreateUpstashClassificationCacheAdapterFromInjectedEnvOptions = {}
): ClassificationCacheAdapter | undefined {
	const legacyOptions = isFromEnvOptions(env) ? env : undefined;
	const injectedEnv: Record<string, string | undefined> = legacyOptions
		? (legacyOptions.env ?? process.env)
		: isEnvRecord(env)
			? env
			: process.env;
	const options = legacyOptions ?? injectedOptions;
	const baseUrl = injectedEnv.UPSTASH_REDIS_REST_URL?.trim();
	const token = injectedEnv.UPSTASH_REDIS_REST_TOKEN?.trim();

	if (!baseUrl || !token) {
		return undefined;
	}

	return createUpstashClassificationCacheAdapter({
		baseUrl,
		token,
		fetcher: options.fetcher,
		httpTimeoutMs: options.httpTimeoutMs,
	});
}

function isFromEnvOptions(
	value: Record<string, string | undefined> | CreateUpstashClassificationCacheAdapterFromEnvOptions
): value is CreateUpstashClassificationCacheAdapterFromEnvOptions {
	if (!isPlainObject(value)) {
		return false;
	}

	const keys = Object.keys(value);
	return (
		keys.length === 0 ||
		keys.some((key) => key === 'env' || key === 'fetcher' || key === 'httpTimeoutMs')
	);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}

function isEnvRecord(value: unknown): value is Record<string, string | undefined> {
	return (
		isPlainObject(value) &&
		!('env' in value || 'fetcher' in value || 'httpTimeoutMs' in value) &&
		Object.values(value).every((entry) => typeof entry === 'string' || entry === undefined)
	);
}

export function createUpstashClassificationCacheAdapter(
	options: CreateUpstashClassificationCacheAdapterOptions
): ClassificationCacheAdapter {
	const baseUrl = options.baseUrl.endsWith('/') ? options.baseUrl.slice(0, -1) : options.baseUrl;
	const token = options.token;
	const fetcher = options.fetcher ?? fetch;
	const httpTimeoutMs = Math.max(1, options.httpTimeoutMs ?? DEFAULT_UPSTASH_HTTP_TIMEOUT_MS);
	const headers = {
		Authorization: `Bearer ${token}`,
	};

	const adapter = {
		signalAware: true as const,
		async get(key: string, operationOptions?: ClassificationCacheOperationOptions) {
			const payload = await callUpstashCommand({
				baseUrl,
				fetcher,
				command: 'get',
				args: [key],
				headers,
				httpTimeoutMs,
				signal: operationOptions?.signal,
			});
			const result = payload?.result;
			if (typeof result !== 'string') {
				return null;
			}

			try {
				const parsed = JSON.parse(result) as ClassificationResolverCachedEntry;
				return isClassificationResolverCachedEntry(parsed) ? parsed : null;
			} catch {
				return null;
			}
		},

		async set(
			key: string,
			entry: ClassificationResolverCachedEntry,
			ttlMs: number,
			operationOptions?: ClassificationCacheOperationOptions
		) {
			await callUpstashCommand({
				baseUrl,
				fetcher,
				command: 'set',
				args: [key, JSON.stringify(entry)],
				query: {
					px: String(Math.max(1, Math.floor(ttlMs))),
				},
				headers,
				httpTimeoutMs,
				signal: operationOptions?.signal,
			});
		},

		async delete(key: string, operationOptions?: ClassificationCacheOperationOptions) {
			await callUpstashCommand({
				baseUrl,
				fetcher,
				command: 'del',
				args: [key],
				headers,
				httpTimeoutMs,
				signal: operationOptions?.signal,
			});
		},
	} satisfies SignalAwareClassificationCacheAdapter;

	return adapter;
}

/** @internal Passes cancellation to signal-aware adapters without widening the public contract. */
export function getClassificationCacheEntry(
	cache: ClassificationCacheAdapter,
	key: string,
	signal?: AbortSignal
): Promise<ClassificationResolverCachedEntry | null> {
	return toCancellableClassificationCacheAdapter(cache).get(key, { signal });
}

/** @internal Passes cancellation to signal-aware adapters without widening the public contract. */
export function setClassificationCacheEntry(
	cache: ClassificationCacheAdapter,
	key: string,
	entry: ClassificationResolverCachedEntry,
	ttlMs: number,
	signal?: AbortSignal
): Promise<void> {
	return toCancellableClassificationCacheAdapter(cache).set(key, entry, ttlMs, { signal });
}

/** @internal Passes cancellation to signal-aware adapters without widening the public contract. */
export function deleteClassificationCacheEntry(
	cache: ClassificationCacheAdapter,
	key: string,
	signal?: AbortSignal
): Promise<void> {
	return toCancellableClassificationCacheAdapter(cache).remove(key, { signal });
}

export function buildClassificationResolverCacheKey(input: {
	pluginId: string;
	resolverId: string;
	runtime: ClassificationRuntime;
	request: Pick<
		ClassificationRequest,
		'input' | 'mode' | 'inputIntent' | 'pluginIds' | 'policy' | 'clientHints'
	>;
	classification: ClassificationClientClassificationHint;
}): string {
	const fingerprint = stableStringify({
		pluginId: input.pluginId,
		resolverId: input.resolverId,
		runtime: input.runtime,
		request: {
			input: input.request.input.trim(),
			mode: input.request.mode,
			inputIntent: input.request.inputIntent,
			pluginIds: normalizePluginIds(input.request.pluginIds),
			policy: input.request.policy ?? null,
			clientHints: input.request.clientHints ?? null,
		},
		classification: {
			type: input.classification.type,
			domain: input.classification.domain,
			subtype: input.classification.subtype,
			confidence: input.classification.confidence,
			meta: input.classification.meta ?? {},
		},
	});

	return `classification:${input.runtime}:${input.pluginId}:${input.resolverId}:${hashString(fingerprint)}`;
}

export function isClassificationResolverCachedEntryFresh(
	entry: ClassificationResolverCachedEntry,
	now = Date.now()
): boolean {
	const cachedAtMs = Date.parse(entry.cachedAt);
	if (Number.isNaN(cachedAtMs)) {
		return false;
	}

	return cachedAtMs + entry.ttlMs > now;
}

export function isClassificationResolverCachedEntry(
	value: unknown
): value is ClassificationResolverCachedEntry {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const entry = value as Partial<ClassificationResolverCachedEntry>;
	return (
		Array.isArray(entry.atoms) &&
		typeof entry.fallbackUsed === 'boolean' &&
		typeof entry.cachedAt === 'string' &&
		typeof entry.ttlMs === 'number'
	);
}

async function callUpstashCommand(params: {
	baseUrl: string;
	fetcher: typeof fetch;
	command: string;
	args: string[];
	query?: Record<string, string>;
	headers: Record<string, string>;
	httpTimeoutMs: number;
	signal?: AbortSignal;
}): Promise<{ result?: unknown }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), params.httpTimeoutMs);
	const onAbort = () => controller.abort(params.signal?.reason);

	if (params.signal?.aborted) {
		onAbort();
	} else {
		params.signal?.addEventListener('abort', onAbort, { once: true });
	}

	try {
		const response = await params.fetcher(
			buildUpstashCommandUrl(params.baseUrl, params.command, params.args, params.query),
			{
				method: 'POST',
				headers: params.headers,
				signal: controller.signal,
			}
		);

		const payload = (await response.json()) as { error?: string; result?: unknown };
		if (!response.ok) {
			throw new Error(payload.error ?? `Upstash cache command failed (${response.status})`);
		}

		if (payload.error) {
			throw new Error(payload.error);
		}

		return payload;
	} finally {
		clearTimeout(timeout);
		params.signal?.removeEventListener('abort', onAbort);
	}
}

function throwIfAborted(signal?: AbortSignal): void {
	if (!signal?.aborted) {
		return;
	}

	if (signal.reason !== undefined) {
		throw signal.reason;
	}

	const error = new Error('Classification cache operation aborted.');
	error.name = 'AbortError';
	throw error;
}

function buildUpstashCommandUrl(
	baseUrl: string,
	command: string,
	args: string[],
	query?: Record<string, string>
): string {
	const encodedArgs = args.map((value) => encodeURIComponent(value)).join('/');
	const search = query ? new URLSearchParams(query).toString() : '';
	return `${baseUrl}/${command}${encodedArgs ? `/${encodedArgs}` : ''}${search ? `?${search}` : ''}`;
}

function normalizePluginIds(pluginIds: string[] | undefined): string[] {
	if (!pluginIds || pluginIds.length === 0) {
		return [];
	}

	return Array.from(new Set(pluginIds)).sort((left, right) => left.localeCompare(right));
}

function stableStringify(value: unknown): string {
	if (value === null || value === undefined) {
		return JSON.stringify(value);
	}

	if (Array.isArray(value)) {
		return `[${value.map((item) => stableStringify(item)).join(',')}]`;
	}

	if (typeof value === 'object') {
		const entries = Object.entries(value as Record<string, unknown>)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`);

		return `{${entries.join(',')}}`;
	}

	return JSON.stringify(value);
}

function hashString(value: string): string {
	let hash = 5381;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 33) ^ value.charCodeAt(index);
	}

	return (hash >>> 0).toString(16);
}

function cloneCachedEntry(
	entry: ClassificationResolverCachedEntry
): ClassificationResolverCachedEntry {
	return {
		atoms: entry.atoms.map((atom) => cloneAtom(atom)),
		fallbackUsed: entry.fallbackUsed,
		errors: entry.errors?.map((error) => ({ ...error })),
		metadata: entry.metadata ? cloneMetadata(entry.metadata) : undefined,
		cachedAt: entry.cachedAt,
		ttlMs: entry.ttlMs,
	};
}

function cloneAtom(atom: ClassificationResolvedAtom): ClassificationResolvedAtom {
	if (typeof structuredClone === 'function') {
		return structuredClone(atom);
	}

	return JSON.parse(JSON.stringify(atom)) as ClassificationResolvedAtom;
}

function cloneMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
	if (typeof structuredClone === 'function') {
		return structuredClone(metadata);
	}

	return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
}

function evictLeastRecentlyUsed(storage: Map<string, StoredEntry>): void {
	let oldestKey: string | undefined;
	let oldestAccess = Number.POSITIVE_INFINITY;

	for (const [key, value] of storage.entries()) {
		if (value.lastAccessedAt < oldestAccess) {
			oldestAccess = value.lastAccessedAt;
			oldestKey = key;
		}
	}

	if (oldestKey) {
		storage.delete(oldestKey);
	}
}

export type UpstashClassificationCacheAdapterOptions =
	CreateUpstashClassificationCacheAdapterOptions;
export type UpstashClassificationCacheEnvOptions =
	CreateUpstashClassificationCacheAdapterFromEnvOptions;

/** Preserve legacy argument lists unless an adapter explicitly opts into cancellation. */
export function toCancellableClassificationCacheAdapter(
	cache: ClassificationCacheAdapter
): CancellableCacheAdapter<ClassificationResolverCachedEntry> {
	if ((cache as Partial<SignalAwareClassificationCacheAdapter>).signalAware === true) {
		const adapter = cache as SignalAwareClassificationCacheAdapter;
		return {
			get: (key, options) => adapter.get(key, options),
			set: (key, entry, ttlMs, options) => adapter.set(key, entry, ttlMs, options),
			remove: (key, options) => adapter.delete(key, options),
		};
	}
	return {
		get: (key) => cache.get(key),
		set: (key, entry, ttlMs) => cache.set(key, entry, ttlMs),
		remove: (key) => cache.delete(key),
	};
}
