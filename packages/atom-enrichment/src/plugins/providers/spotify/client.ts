import type { ProviderReason } from '@0xintuition/pipeline-runtime/provider-observer';
import {
	beginObservedRequest,
	isEngineDeadline,
	type ObservedRequest,
	type ObservedRequestContext,
	type RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import { z } from 'zod/v4';
import {
	type FetchLike,
	fetchJsonWithSchema,
	isPinAwareFetch,
	type PinAwareFetch,
	ProviderHttpError,
} from '../__shared__/http';
import { fetchProviderJson } from '../__shared__/provider-fetch';
import { classifyProviderRequestError } from '../__shared__/provider-request-observer';
import { spotifyOEmbedResponseSchema, spotifyTokenResponseSchema } from './external';

/**
 * The one Spotify Web API client (ENG-16978). Classification (domain-api stage) and enrichment
 * both go through it, so they share:
 *
 * - the client-credentials token, cached per transport and refreshed once for concurrent callers;
 * - the single 401 refresh-and-retry;
 * - the pinned transport, the caller's `signal` and the body cap of the shared provider HTTP helper;
 * - the request metrics: one `spotify` event per HTTP request (`token`, `item`, `isrc_search`,
 *   `oembed`) with the reason mapping below.
 *
 * Failures are structured `ProviderHttpError`s (status, retryAfterMs, errorCode); callers
 * never parse message text.
 */

export type { FetchLike };
export { ProviderHttpError };

/** Any JSON object. Classification maps the fields it needs and tolerates the rest. */
export const spotifyLooseObjectSchema = z.looseObject({});

export type SpotifyItemType = 'track' | 'album' | 'artist' | 'playlist' | 'show' | 'episode';
/** The lookup operations; the classification stage records its item lookup as `classify_item`. */
export type SpotifyObservedOperation = 'item' | 'classify_item' | 'isrc_search';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';
const OEMBED_URL = 'https://open.spotify.com/oembed';
const TOKEN_EXPIRY_MARGIN_MS = 60_000;
/**
 * How long refused credentials are remembered. Without it every paste would mint (twice, with the
 * 401 retry) against a token endpoint that then answers 429, and `rate_limited` would mask the
 * `auth_failed` that matters.
 */
const REFUSED_CREDENTIALS_TTL_MS = 30_000;
/** A mint carries its own deadline: it is shared, so no single caller's signal may bound it. */
const TOKEN_MINT_TIMEOUT_MS = 10_000;
const DEFAULT_TOKEN_TTL_SECONDS = 3600;

type TokenEntry = { expiresAtMs: number; token: string };
/** One in-flight token mint, shared by every caller that needs the same credentials. */
type Mint = {
	promise: Promise<TokenEntry>;
	/** Aborts the mint once no caller is waiting for it any more. */
	controller: AbortController;
	waiters: number;
	/** The one `token` request event of this mint; recorded only once a waiter is observed. */
	observed: ObservedRequest | undefined;
	armed: boolean;
};
type TransportState = {
	tokens: Map<string, TokenEntry>;
	mints: Map<string, Mint>;
	/** Credentials the token endpoint refused, remembered briefly so a bad config is not hammered. */
	refused: Map<string, { error: unknown; untilMs: number }>;
};

/**
 * Token state per transport. A pin-aware fetcher is its own transport (tests, fixtures); every
 * other fetcher is ignored by the shared hop, which dials through the one pinned Node transport,
 * so they all share a single state. That is what lets classification and enrichment, which both
 * default to `globalThis.fetch`, mint one token for a paste.
 */
const DEFAULT_TRANSPORT = {};
const transportStates = new WeakMap<object, TransportState>();

/** The identity of the transport a fetcher dials through (see above). */
export function spotifyTransportKey(fetcher: FetchLike): object {
	return isPinAwareFetch(fetcher) ? fetcher : DEFAULT_TRANSPORT;
}

/** The helper dials a pin-aware fetcher as is; every other fetcher means the default pinned transport. */
function pinAwareOrUndefined(fetcher: FetchLike): PinAwareFetch | undefined {
	return isPinAwareFetch(fetcher) ? fetcher : undefined;
}

function transportState(fetcher: FetchLike): TransportState {
	const key = spotifyTransportKey(fetcher);
	let state = transportStates.get(key);
	if (!state) {
		state = { tokens: new Map(), mints: new Map(), refused: new Map() };
		transportStates.set(key, state);
	}
	return state;
}

/**
 * The map key of one credential pair: a SHA-256 of both, so the client secret is never a key that
 * a debugger, heap dump or `Map` print could show.
 */
async function credentialKey(clientId: string, clientSecret: string): Promise<string> {
	const { createHash } = await import('node:crypto');
	return createHash('sha256').update(clientId).update('\u0000').update(clientSecret).digest('hex');
}

export type SpotifyObservation = ObservedRequestContext;

export type ReadSpotifyAccessTokenOptions = {
	/** Mint a new token even when a cached one is still valid. */
	forceRefresh?: boolean;
	/**
	 * The token the API just rejected (a 401). A newer cached token, refreshed by another caller
	 * meanwhile, is reused; a mint happens only when the cached token is still the rejected one.
	 */
	rejectedToken?: string;
	/** Record the `token` request metric. Omit for callers outside a request (the seed script). */
	observation?: SpotifyObservation;
};

/**
 * A client-credentials access token: cached, and minted at most once at a time per credential.
 * This is the accessor other Spotify callers (the trpc provider search) should use instead of
 * keeping a token flow of their own.
 *
 * The mint is shared and carries its own timeout, so a caller's `signal` bounds only that
 * caller's wait: when it aborts, the others still get their token, and the mint itself is
 * aborted only when nobody is waiting for it.
 */
export async function readSpotifyAccessToken(
	fetcher: FetchLike,
	clientId: string,
	clientSecret: string,
	signal?: AbortSignal,
	options: ReadSpotifyAccessTokenOptions = {}
): Promise<string> {
	const state = transportState(fetcher);
	const key = await credentialKey(clientId, clientSecret);
	const cached = state.tokens.get(key);
	const stillRejected = cached !== undefined && cached.token === options.rejectedToken;
	if (cached && !options.forceRefresh && !stillRejected && cached.expiresAtMs > Date.now()) {
		return cached.token;
	}
	if (stillRejected) state.tokens.delete(key);

	signal?.throwIfAborted();
	let mint = state.mints.get(key);
	if (!mint || mint.controller.signal.aborted) {
		const refused = state.refused.get(key);
		if (refused && refused.untilMs > Date.now()) throw refused.error;
		mint = startMint(state, key, fetcher, clientId, clientSecret);
	}
	return (await awaitMint(state, key, mint, signal, options.observation)).token;
}

function startMint(
	state: TransportState,
	key: string,
	fetcher: FetchLike,
	clientId: string,
	clientSecret: string
): Mint {
	const controller = new AbortController();
	const mintSignal = AbortSignal.any([
		controller.signal,
		AbortSignal.timeout(TOKEN_MINT_TIMEOUT_MS),
	]);
	const mint: Mint = {
		controller,
		waiters: 0,
		// The mint outlives any one caller, so it is observed without any caller's signal.
		observed: beginObservedRequest({ provider: 'spotify', operation: 'token', context: {} }),
		armed: false,
		promise: mintToken(fetcher, clientId, clientSecret, mintSignal, () => mint)
			.then(
				(entry) => {
					state.tokens.set(key, entry);
					state.refused.delete(key);
					return entry;
				},
				(error: unknown) => {
					rememberTokenFailure(state, key, error);
					throw error;
				}
			)
			.finally(() => {
				if (state.mints.get(key) === mint) state.mints.delete(key);
			}),
	};
	// Every waiter sees the rejection through its own race; this only keeps it from being
	// reported as unhandled when all of them left.
	mint.promise.catch(() => undefined);
	state.mints.set(key, mint);
	return mint;
}

const tokenFailures = new WeakSet<object>();

/** True for an error thrown by the token endpoint, even when it surfaces behind an API request. */
export function isSpotifyTokenFailure(error: unknown): boolean {
	return typeof error === 'object' && error !== null && tokenFailures.has(error);
}

function rememberTokenFailure(state: TransportState, key: string, error: unknown): void {
	if (typeof error !== 'object' || error === null) return;
	tokenFailures.add(error);
	const outcome = classifyTokenError(error);
	if (outcome.outcome === 'error' && outcome.reason === 'auth_failed') {
		state.refused.set(key, { error, untilMs: Date.now() + REFUSED_CREDENTIALS_TTL_MS });
	}
}

/**
 * Wait for a shared mint with the caller's own signal: a caller that leaves gets its own abort
 * and nobody else is affected. The mint is aborted only when the last waiter is gone.
 */
async function awaitMint(
	state: TransportState,
	key: string,
	mint: Mint,
	signal: AbortSignal | undefined,
	observation: SpotifyObservation | undefined
): Promise<TokenEntry> {
	mint.waiters += 1;
	// The mint is recorded when any of its waiters is observed (a seed batch may have started it),
	// and when an observed waiter reaches the engine deadline while it is still pending, even if
	// the fetch ignores the abort. A waiter whose signal is already aborted never started.
	const stopWatching =
		observation && !signal?.aborted ? watchDeadline(mint, signal, observation) : undefined;
	try {
		return await raceSignal(mint.promise, signal);
	} finally {
		stopWatching?.();
		mint.waiters -= 1;
		if (mint.waiters === 0 && state.mints.get(key) === mint) {
			mint.controller.abort(new DOMException('No caller is waiting for the token', 'AbortError'));
		}
	}
}

function watchDeadline(
	mint: Mint,
	signal: AbortSignal | undefined,
	observation: SpotifyObservation
): () => void {
	mint.armed = true;
	const onAbort = () => {
		if (isEngineDeadline(observation))
			mint.observed?.settle({ outcome: 'error', reason: 'timeout' });
	};
	signal?.addEventListener('abort', onAbort, { once: true });
	return () => signal?.removeEventListener('abort', onAbort);
}

function raceSignal<T>(promise: Promise<T>, signal: AbortSignal | undefined): Promise<T> {
	if (!signal) return promise;
	if (signal.aborted) return Promise.reject(signal.reason);
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(signal.reason);
		signal.addEventListener('abort', onAbort, { once: true });
		promise.then(
			(value) => {
				signal.removeEventListener('abort', onAbort);
				resolve(value);
			},
			(error: unknown) => {
				signal.removeEventListener('abort', onAbort);
				reject(error);
			}
		);
	});
}

async function mintToken(
	fetcher: FetchLike,
	clientId: string,
	clientSecret: string,
	signal: AbortSignal,
	mintOf: () => Mint
): Promise<TokenEntry> {
	try {
		const payload = await fetchJsonWithSchema(
			fetcher,
			TOKEN_URL,
			spotifyTokenResponseSchema,
			{
				method: 'POST',
				headers: {
					authorization: `Basic ${base64Encode(`${clientId}:${clientSecret}`)}`,
					'content-type': 'application/x-www-form-urlencoded',
				},
				body: 'grant_type=client_credentials',
				// Spotify never redirects the token endpoint; following would carry Basic credentials
				// to another host.
				redirect: 'error',
				signal,
			},
			{ captureErrorCode: true }
		);
		if (!payload.access_token) {
			throw new ProviderHttpError({ status: 502, errorClass: 'invalid_json' });
		}
		settleMint(mintOf(), { outcome: 'hit', reason: 'none' });
		const ttlMs = (payload.expires_in ?? DEFAULT_TOKEN_TTL_SECONDS) * 1000;
		return {
			// A short-lived token is cached for half its life rather than never.
			expiresAtMs: Date.now() + ttlMs - Math.min(TOKEN_EXPIRY_MARGIN_MS, ttlMs / 2),
			token: payload.access_token,
		};
	} catch (error) {
		const mint = mintOf();
		// Every waiter leaving is a caller cancel, which never counts.
		if (mint.controller.signal.aborted) mint.observed?.drop();
		else if (mint.armed) mint.observed?.fail(error, classifyTokenError);
		else mint.observed?.drop();
		throw error;
	}
}

function settleMint(mint: Mint, outcome: RequestOutcome): void {
	if (mint.armed) mint.observed?.settle(outcome);
	else mint.observed?.drop();
}

/**
 * Token endpoint: 401 and 403 refuse the credentials, and so does a 400 whose OAuth `error` says
 * the client or grant is invalid. Any other 400 (`unsupported_grant_type`, `invalid_request`) is
 * a request we built wrongly, an `http_4xx`.
 */
export function classifyTokenError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, {
		statusOutcomes: {
			401: 'auth_failed',
			403: 'auth_failed',
			400: {
				byErrorCode: { invalid_client: 'auth_failed', invalid_grant: 'auth_failed' },
				default: 'http_4xx',
			},
		},
	});
}

/** Item and search: 404 is a miss, 401 and 403 refuse our token. */
export function classifySpotifyApiError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, {
		statusOutcomes: { 404: 'miss', 401: 'auth_failed', 403: 'auth_failed' },
	});
}

/** oEmbed takes no credentials: 404 is a miss and nothing is `auth_failed`. */
function classifySpotifyOEmbedError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, { statusOutcomes: { 404: 'miss' } });
}

/** The structured, label-safe facts of a failed request, for logs. Never the message or ids. */
export function describeSpotifyFailure(error: unknown): {
	reason: ProviderReason;
	status?: number;
	retryAfterMs?: number;
} {
	const outcome = isSpotifyTokenFailure(error)
		? classifyTokenError(error)
		: classifySpotifyApiError(error);
	return {
		reason: outcome.outcome === 'miss' ? 'none' : outcome.reason,
		...(error instanceof ProviderHttpError
			? {
					status: error.status,
					...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
				}
			: {}),
	};
}

export type SpotifyApiRequest<TSchema extends z.ZodTypeAny> = {
	fetch: FetchLike;
	clientId: string;
	clientSecret: string;
	url: string;
	schema: TSchema;
	/** The metric operation; omit to run the request unobserved (the seed script's batches). */
	operation?: SpotifyObservedOperation;
	signal?: AbortSignal;
	/** Epoch ms at which the enrichment engine aborts; only the deadline counts as `timeout`. */
	deadlineAtMs?: number;
	/** Called once, when a 401 makes the client refresh the token and retry. */
	onAuthRetry?: () => void;
	/** `miss` when a successful response holds nothing (an empty ISRC search). */
	outcomeOf?: (value: z.infer<TSchema>) => 'hit' | 'miss';
};

/**
 * An authenticated GET: token (cached), request, and on HTTP 401 one forced token refresh and one
 * retry. Every HTTP request is observed on its own, so a refresh shows as two `token` and two
 * `item` events.
 */
export async function spotifyApiGetJson<TSchema extends z.ZodTypeAny>(
	input: SpotifyApiRequest<TSchema>
): Promise<z.infer<TSchema>> {
	const observing = input.operation
		? {
				operation: input.operation,
				context: { signal: input.signal, deadlineAtMs: input.deadlineAtMs },
			}
		: undefined;

	let rejectedToken: string | undefined;
	const attempt = async (rejected?: string) => {
		const token = await readSpotifyAccessToken(
			input.fetch,
			input.clientId,
			input.clientSecret,
			input.signal,
			{
				...(rejected ? { rejectedToken: rejected } : {}),
				...(observing ? { observation: observing.context } : {}),
			}
		);
		try {
			return await fetchProviderJson<z.infer<TSchema>>({
				fetch: pinAwareOrUndefined(input.fetch),
				url: input.url,
				schema: input.schema as z.ZodType<z.infer<TSchema>>,
				headers: { authorization: `Bearer ${token}` },
				// Spotify never redirects the API; refuse instead of following with the token.
				redirect: 'error',
				signal: input.signal,
				deadlineAtMs: input.deadlineAtMs,
				...(observing
					? {
							observe: {
								provider: 'spotify' as const,
								operation: observing.operation,
								classifyError: classifySpotifyApiError,
								...(input.outcomeOf ? { classifyResult: input.outcomeOf } : {}),
							},
						}
					: {}),
			});
		} catch (error) {
			rejectedToken = token;
			throw error;
		}
	};

	try {
		return await attempt();
	} catch (error) {
		// Only a 401 from the API request itself (which set `rejectedToken`) refreshes the
		// token; a 401 from the token endpoint means the credentials are wrong, and a retry
		// would only repeat it.
		if (
			rejectedToken === undefined ||
			!(error instanceof ProviderHttpError) ||
			error.status !== 401
		) {
			throw error;
		}
		input.onAuthRetry?.();
		return await attempt(rejectedToken);
	}
}

/** Spotify's client-credentials flow needs a market for show and episode lookups (else 404). */
export function resolveSpotifyMarket(
	type: SpotifyItemType | 'search',
	market: string | undefined
): string | undefined {
	const configured = market?.trim();
	if (configured) return configured;
	return type === 'show' || type === 'episode' ? 'US' : undefined;
}

export function buildSpotifyItemUrl(input: {
	type: SpotifyItemType;
	id: string;
	market?: string | undefined;
}): string {
	const url = new URL(
		`${API_BASE}/${encodeURIComponent(input.type)}s/${encodeURIComponent(input.id)}`
	);
	const market = resolveSpotifyMarket(input.type, input.market);
	if (market) url.searchParams.set('market', market);
	return url.toString();
}

export function buildSpotifyIsrcSearchUrl(isrc: string, market?: string): string {
	const url = new URL(`${API_BASE}/search`);
	url.searchParams.set('type', 'track');
	url.searchParams.set('q', `isrc:${isrc}`);
	const resolved = resolveSpotifyMarket('search', market);
	if (resolved) url.searchParams.set('market', resolved);
	return url.toString();
}

export function buildSpotifyBatchUrl(input: {
	type: Exclude<SpotifyItemType, 'playlist'>;
	ids: readonly string[];
	market?: string | undefined;
}): string {
	const url = new URL(`${API_BASE}/${input.type}s`);
	url.searchParams.set('ids', input.ids.join(','));
	const market = resolveSpotifyMarket(input.type, input.market);
	if (market) url.searchParams.set('market', market);
	return url.toString();
}

/** The public oEmbed lookup (no credentials): a title and a thumbnail for a Spotify URL. */
export async function fetchSpotifyOEmbed(input: {
	fetch: FetchLike;
	url: string;
	signal?: AbortSignal;
	deadlineAtMs?: number;
}): Promise<z.infer<typeof spotifyOEmbedResponseSchema>> {
	return await fetchProviderJson({
		fetch: pinAwareOrUndefined(input.fetch),
		url: `${OEMBED_URL}?url=${encodeURIComponent(input.url)}`,
		schema: spotifyOEmbedResponseSchema,
		signal: input.signal,
		deadlineAtMs: input.deadlineAtMs,
		observe: {
			provider: 'spotify',
			operation: 'oembed',
			classifyError: classifySpotifyOEmbedError,
		},
	});
}

function base64Encode(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64');
}
