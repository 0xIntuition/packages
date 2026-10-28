import type { PipelineErrorKind } from '@0xintuition/pipeline-runtime/errors';
import type {
	ProviderName,
	ProviderOperationOf,
} from '@0xintuition/pipeline-runtime/provider-registry';
import {
	isEngineDeadline,
	type ObservedRequestContext,
	observeProviderRequest,
	observeSlottedProviderRequest,
	type RequestOutcome,
} from '@0xintuition/pipeline-runtime/provider-request-observation';
import {
	getProcessRequestSlot,
	type RequestSlot,
} from '@0xintuition/pipeline-runtime/request-slot';
import { z } from 'zod/v4';
import {
	type FetchLike,
	fetchText,
	MAX_PROVIDER_HTTP_RESPONSE_BYTES,
	type PinAwareFetch,
	ProviderHttpError,
	type ProviderHttpOptions,
	parseProviderJson,
	parseRetryAfterMs,
} from './http';
import {
	type ClassifyProviderRequestOptions,
	classifyProviderRequestError,
} from './provider-request-observer';

/**
 * The one provider fetch for classification-side (and api-side) calls (ENG-17014).
 *
 * Every call goes through the guarded pinned transport of `http.ts` (public-target and DNS pin,
 * embargoed hosts, credential stripping on cross-origin redirects), honours the caller's stage
 * `signal` plus an optional `timeoutMs`, caps the body, fails with a structured
 * `ProviderHttpError` (status, `retryAfterMs`, `errorCode`, `errorClass`; never message text) and
 * can record exactly one provider request metric with the shared observation rules.
 *
 * It replaces hand-rolled `globalThis.fetch(...)` + `response.json()` in the adapters. Spotify's
 * `classify_item` and `oembed` use it, as do the Wikidata and Wikipedia enrichment and
 * classification calls (ENG-17015); the identity bridge and the YouTube oEmbed adapter are meant
 * to follow.
 */

/**
 * A descriptive User-Agent with a contact, as the Wikimedia User-Agent policy requires
 * (https://meta.wikimedia.org/wiki/User-Agent_policy). One constant for Wikidata and Wikipedia
 * calls from enrichment, classification and the api identity bridge.
 */
export const WIKIMEDIA_USER_AGENT =
	'IntuitionCreate/0.1 (https://intuition.systems; data@intuition.systems)';

export { ProviderHttpError };
export type { FetchLike, PinAwareFetch };

/**
 * `rejectOk` for Wikimedia APIs: `maxlag` is answered as HTTP 200 with `retry-after` and
 * `mediawiki-api-error: maxlag`. It becomes a 429 `ProviderHttpError` carrying `retryAfterMs`, so
 * `statusOutcomes: { 429: 'rate_limited' }` records `rate_limited` and the engine can back off.
 */
export const rejectWikimediaMaxlag: NonNullable<ProviderHttpOptions['rejectOk']> = ({ headers }) =>
	headers.get('mediawiki-api-error') === 'maxlag'
		? mediaWikiApiError('maxlag', headers.get('retry-after'))
		: undefined;

/**
 * What a MediaWiki action API error code means. Every action-API error is HTTP 200 with the code in
 * the `mediawiki-api-error` header (and `error.code` in the body), so the code is the only signal:
 * - `maxlag` and `ratelimited` are throttles: 429 (`rate_limited`), with the server's `Retry-After`
 *   when it sends one, so the engine backs off (a throttled search ends the run);
 * - `readonly` (maintenance) and `internal_api_error_*` (an uncaught server exception) are
 *   upstream faults that clear on their own: 503 (`upstream_5xx`);
 * - every other code (`badvalue`, `missingparam`, `toomanyvalues`, a body without a code) says our
 *   request was malformed or the schema drifted: `api_error`, recorded as `invalid_response`.
 */
export function mediaWikiApiError(
	code: string | undefined,
	retryAfter: string | null = null
): ProviderHttpError {
	if (code === 'maxlag' || code === 'ratelimited') {
		const retryAfterMs = parseRetryAfterMs(retryAfter);
		return new ProviderHttpError({
			status: 429,
			errorCode: code,
			...(retryAfterMs === undefined ? {} : { retryAfterMs }),
		});
	}
	if (code === 'readonly' || code?.startsWith('internal_api_error')) {
		return new ProviderHttpError({ status: 503, errorCode: code });
	}
	return new ProviderHttpError({ status: 502, errorClass: 'api_error' });
}

/**
 * `rejectOk` for the MediaWiki action API (`api.php`), which reports every error as HTTP 200 with
 * a `mediawiki-api-error` header: {@link mediaWikiApiError} gives each code its meaning, never an
 * empty result. Pair it with {@link withoutMediaWikiApiError} for an error body that arrives
 * without the header.
 */
export const rejectMediaWikiActionApiError: NonNullable<ProviderHttpOptions['rejectOk']> = ({
	headers,
}) => {
	const code = headers.get('mediawiki-api-error');
	return code ? mediaWikiApiError(code, headers.get('retry-after')) : undefined;
};

/**
 * Refuses a body that is an API error object (`{ error: ... }`) the way
 * {@link rejectMediaWikiActionApiError} refuses the header: by its `error.code`
 * ({@link mediaWikiApiError}), never an empty result.
 */
export function withoutMediaWikiApiError<T>(schema: z.ZodType<T>): z.ZodType<T> {
	// Guard the RAW body, before the caller's schema: a plain `z.object` strips the unknown
	// `error` key, so a check on the parsed value would turn an error body into an empty result.
	return z
		.unknown()
		.transform((value) => {
			if (typeof value === 'object' && value !== null && 'error' in value) {
				const code = (value as { error?: { code?: unknown } | null }).error?.code;
				throw mediaWikiApiError(typeof code === 'string' ? code : undefined);
			}
			return value;
		})
		.pipe(schema) as z.ZodType<T>;
}

/** Seconds of replication lag Wikimedia tolerates before refusing a read (`maxlag`). */
export const WIKIMEDIA_MAXLAG_SECONDS = 5;

/**
 * Meaning of a Wikimedia status: a 404 is a miss (no such entity or page); a 403 is Wikimedia
 * refusing our User-Agent (recorded as `auth_failed`; alerts should say "UA refused/blocked", not
 * "credential"); 429 is rate limiting.
 */
export const WIKIMEDIA_STATUS_OUTCOMES = {
	404: 'miss',
	403: 'auth_failed',
	429: 'rate_limited',
} as const;

/** The outcome of a failed Wikimedia request under {@link WIKIMEDIA_STATUS_OUTCOMES}. */
export function classifyWikimediaError(error: unknown): RequestOutcome {
	return classifyProviderRequestError(error, { statusOutcomes: WIKIMEDIA_STATUS_OUTCOMES });
}

/** A 404 (the entity or page does not exist) as the thrown error a caller turns into "no result". */
export function isWikimediaMiss(error: unknown): boolean {
	return classifyWikimediaError(error).outcome === 'miss';
}

/**
 * The one pacing for requests to a Wikimedia host (Wikidata API and EntityData, the Wikipedia
 * REST summary): a process slot with key `wikidata`, 250 ms between requests, at most
 * {@link WIKIMEDIA_SLOT_MAX_QUEUE} waiting. `getProcessRequestSlot` throws on ANY pacing
 * difference for a key, so every caller (the enrichment plugins today; the classification identity
 * bridge, which must take its spacing from here when it moves onto this lane) takes the slot from
 * here and never spells the pacing itself.
 *
 * Every caller (enrichment, the classification identity bridge) passes this slot as `slot` to
 * `fetchProviderJson`, and the slotted observation does the rest (ENG-17085): a refusal
 * (`RequestSlotRejectedError`) and a deadline reached while the request still waits are
 * `budget_exhausted` (nothing dialled, no duration; local backpressure whichever timer fires
 * first), a caller abort while queued records nothing, a request that was dialled and then overran
 * is a `timeout`, and only a real upstream 429 / maxlag is `rate_limited`.
 *
 * `maxQueue` is 128, shared by every caller (a bridge that wants its own cap of 32 keeps an
 * in-flight counter in front of the slot); enrichment adds its lookups and candidate fetches; 128 x 250 ms bounds the wait at about 32 s, well past what
 * the engine deadline allows anyway (a request that cannot start before its deadline is refused
 * at once). A refusal is a `RequestSlotRejectedError` (`queue_full` or `deadline`).
 */
export const WIKIMEDIA_SLOT_KEY = 'wikidata';
export const WIKIMEDIA_REQUEST_SPACING_MS = 250;
export const WIKIMEDIA_SLOT_MAX_QUEUE = 128;

export function getWikimediaRequestSlot(): RequestSlot {
	return getProcessRequestSlot(WIKIMEDIA_SLOT_KEY, {
		minSpacingMs: WIKIMEDIA_REQUEST_SPACING_MS,
		maxQueue: WIKIMEDIA_SLOT_MAX_QUEUE,
	});
}

/** How a request is recorded. `provider` fixes which `operation` names the registry accepts. */
export type ProviderFetchObservation<P extends ProviderName, T> = {
	provider: P;
	operation: ProviderOperationOf<P>;
	/**
	 * Meaning of a failure. Pass `classifyError` for a custom mapping, or `statusOutcomes`
	 * (the `classifyProviderRequestError` option) for the common case: 404 as a miss, 429 as
	 * `rate_limited`, and so on. Default: the generic mapping (no status overrides).
	 */
	classifyError?: (error: unknown) => RequestOutcome;
	statusOutcomes?: ClassifyProviderRequestOptions['statusOutcomes'];
	/** A resolved value that holds nothing (an empty search) is a `miss`. Default: `hit`. */
	classifyResult?: (value: T) => 'hit' | 'miss';
	/**
	 * @deprecated Use the top-level `slot` of {@link ProviderFetchInput}. Still honoured (the
	 * top-level one wins when both are set).
	 */
	slot?: RequestSlot;
};

export type ProviderFetchInput<T = unknown, P extends ProviderName = ProviderName> = {
	url: string;
	/**
	 * Transport seam: a pin-aware fetch (`createPinAwareFetch`), typed so a plain fetcher, which
	 * would be silently ignored, is a compile error. Omit it for the default pinned transport. To
	 * pace or wrap the dial, use `wrapPinAwareFetch` from `./http`.
	 */
	fetch?: PinAwareFetch | undefined;
	/** Anything but GET refuses redirects (`redirect_rejected`): a body is never replayed. */
	method?: string;
	headers?: ConstructorParameters<typeof Headers>[0];
	body?: string;
	/** Sets the `user-agent` header (for example {@link WIKIMEDIA_USER_AGENT}). */
	userAgent?: string;
	/**
	 * `follow` (default) follows up to 5 guarded hops; `error` refuses any redirect. A cross-origin
	 * hop drops `authorization`, `cookie`, `proxy-authorization` and {@link credentialHeaders}; a
	 * call that keeps its key anywhere else (the query string of a URL it also sends elsewhere)
	 * should pass `error`.
	 */
	redirect?: 'follow' | 'error';
	/** More header names to drop on a cross-origin redirect (for example `x-api-key`). */
	credentialHeaders?: readonly string[];
	/** Fail a 2xx that is really an error before the body is read; see {@link rejectWikimediaMaxlag}. */
	rejectOk?: ProviderHttpOptions['rejectOk'];
	/** Pace the request through a process slot, observed or not; its refusals are `budget_exhausted` when observed (ENG-17085). */
	slot?: RequestSlot;
	/** The stage / caller signal. A caller cancel is recorded as nothing. */
	signal?: AbortSignal | undefined;
	/** Epoch ms at which the engine aborts `signal`; only that abort counts as `timeout`. */
	deadlineAtMs?: number | undefined;
	/** A per-call timer on top of `signal`; firing it is a provider `timeout`. */
	timeoutMs?: number;
	/** Body cap in bytes (default and ceiling 1 MiB). Over it: `ProviderHttpError` `response_too_large`. */
	maxResponseBytes?: number;
	/** Guard options passed to the shared hop (`statusClasses`, `captureErrorCode`, `resolve`, ...). */
	http?: Pick<
		ProviderHttpOptions,
		'allowLoopbackFixtures' | 'allowTmdbApi' | 'captureErrorCode' | 'resolve' | 'statusClasses'
	>;
	/** Validates and types a JSON body (JSON only). A failure is an `invalid_response`. */
	schema?: z.ZodType<T>;
	/** Record the request as one provider metric. Omit to run unobserved. */
	observe?: ProviderFetchObservation<P, T>;
};

function requestSignal(
	signal: AbortSignal | undefined,
	timeoutMs: number | undefined
): AbortSignal | undefined {
	if (timeoutMs === undefined) return signal;
	const timer = AbortSignal.timeout(timeoutMs);
	return signal ? AbortSignal.any([signal, timer]) : timer;
}

async function readBody<T, P extends ProviderName>(
	input: ProviderFetchInput<T, P>,
	signal: AbortSignal | undefined
): Promise<string> {
	const options: ProviderHttpOptions = {
		...input.http,
		...(input.rejectOk ? { rejectOk: input.rejectOk } : {}),
		...(input.credentialHeaders ? { credentialHeaders: input.credentialHeaders } : {}),
		maxResponseBytes: Math.min(
			input.maxResponseBytes ?? MAX_PROVIDER_HTTP_RESPONSE_BYTES,
			MAX_PROVIDER_HTTP_RESPONSE_BYTES
		),
	};
	signal?.throwIfAborted();
	const headers = new Headers(input.headers);
	if (input.userAgent) headers.set('user-agent', input.userAgent);
	const method = input.method ?? 'GET';
	const isGet = method.toUpperCase() === 'GET';
	const init: RequestInit = {
		method,
		headers,
		...(input.body === undefined ? {} : { body: input.body }),
		redirect: input.redirect === 'error' || !isGet ? 'error' : 'follow',
		...(signal ? { signal } : {}),
	};
	// A non-pin-aware default is the pinned Node transport itself, which the hop dials anyway.
	return await fetchText(input.fetch ?? (globalThis.fetch as FetchLike), input.url, init, options);
}

async function observed<T, P extends ProviderName>(
	input: ProviderFetchInput<T, P>,
	run: (signal: AbortSignal | undefined) => Promise<T>
): Promise<T> {
	const { observe } = input;
	const slot = input.slot ?? observe?.slot;
	const timed = (signal: AbortSignal | undefined) => requestSignal(signal, input.timeoutMs);
	if (!observe) {
		if (!slot) return await run(timed(input.signal));
		return await slot.run((slotSignal) => run(timed(slotSignal)), {
			signal: input.signal,
			deadlineAtMs: input.deadlineAtMs,
		});
	}
	const context: ObservedRequestContext = {
		signal: input.signal,
		deadlineAtMs: input.deadlineAtMs,
	};
	const observation = {
		provider: observe.provider,
		operation: observe.operation,
		context,
		classifyError:
			observe.classifyError ??
			((error: unknown) =>
				classifyProviderRequestError(error, { statusOutcomes: observe.statusOutcomes ?? {} })),
		classifyResult: observe.classifyResult,
	};
	if (slot) {
		return await observeSlottedProviderRequest(observation, slot, (slotSignal) =>
			run(timed(slotSignal))
		);
	}
	return await observeProviderRequest(observation, () => run(timed(input.signal)));
}

function parseResult<T>(payload: unknown, schema: z.ZodType<T> | undefined): T {
	return schema ? schema.parse(payload) : (payload as T);
}

/** GET (or POST) a JSON body through the guarded pinned transport. See the module doc. */
export async function fetchProviderJson<T = unknown, P extends ProviderName = ProviderName>(
	input: ProviderFetchInput<T, P>
): Promise<T> {
	return await observed(input, async (signal) =>
		parseResult(parseProviderJson(await readBody(input, signal)), input.schema)
	);
}

/** Like {@link fetchProviderJson} for a text body (`schema` is ignored). */
export async function fetchProviderText<P extends ProviderName = ProviderName>(
	input: ProviderFetchInput<string, P>
): Promise<string> {
	return await observed(input, (signal) => readBody(input, signal));
}

/**
 * The kinds a provider fetch failure can be described as: a subset of `PipelineErrorKind`, plus
 * `cancelled` (the caller went away; not a `PipelineErrorKind`, each stage maps it to its own).
 */
export type ProviderFetchFailureKind =
	| Extract<
			PipelineErrorKind,
			| 'non_ok_status'
			| 'redirect_rejected'
			| 'redirect_exhausted'
			| 'ssrf_rejected'
			| 'embargoed_host'
			| 'body_limit'
			| 'dns_failure'
			| 'parse_failure'
			| 'timeout'
			| 'http_error'
	  >
	| 'cancelled';

/**
 * The label-safe facts of a failed provider fetch, for stage diagnostics and logs: a stable
 * kind and the structured status. Never the upstream text or ids.
 */
export type ProviderFetchFailure = {
	kind: ProviderFetchFailureKind;
	status?: number;
	retryAfterMs?: number;
	errorCode?: string;
};

const DNS_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'EAI_NODATA', 'EAI_FAIL']);

function isDnsFault(error: unknown): boolean {
	const code = (candidate: unknown) =>
		typeof candidate === 'object' && candidate !== null
			? (candidate as { code?: unknown }).code
			: undefined;
	const cause = error instanceof Error ? error.cause : undefined;
	return [code(error), code(cause)].some(
		(value) => typeof value === 'string' && DNS_ERROR_CODES.has(value)
	);
}

function describeHttpError(error: ProviderHttpError): ProviderFetchFailure {
	const structured = {
		status: error.status,
		...(error.retryAfterMs === undefined ? {} : { retryAfterMs: error.retryAfterMs }),
		...(error.errorCode === undefined ? {} : { errorCode: error.errorCode }),
	};
	switch (error.errorClass) {
		case 'invalid_json':
		case 'api_error':
			return { kind: 'parse_failure', ...structured };
		case 'response_too_large':
			return { kind: 'body_limit', ...structured };
		case 'embargoed_host':
			return { kind: 'embargoed_host', ...structured };
		case 'target_rejected':
			// A resolver failure (NXDOMAIN, EAI_AGAIN) carries the resolver error as `cause`; a private
			// or loopback answer has none. The error class, status and metric are the same for both.
			return { kind: isDnsFault(error) ? 'dns_failure' : 'ssrf_rejected', ...structured };
		case 'redirect_rejected':
		case 'redirect_exhausted':
			return { kind: error.errorClass, ...structured };
		default:
			// `provider_http_error`, and any `statusClasses` class ('rate_limited', ...) on a status.
			return { kind: error.status >= 400 ? 'non_ok_status' : 'http_error', ...structured };
	}
}

/** The caller's own cancel context for the call being described (its signal and engine deadline). */
export type ProviderFetchFailureContext = {
	signal?: AbortSignal | undefined;
	deadlineAtMs?: number | undefined;
};

/** Describes a failed `fetchProviderJson`/`fetchProviderText`; see {@link ProviderFetchFailureKind}. */
export function describeProviderFetchFailure(
	error: unknown,
	context?: ProviderFetchFailureContext
): ProviderFetchFailure {
	if (error instanceof ProviderHttpError) return describeHttpError(error);
	if (error instanceof z.ZodError || error instanceof SyntaxError) return { kind: 'parse_failure' };
	const name = error instanceof Error ? error.name : '';
	// Decided here, from the call's own context (never from the error object, which several calls
	// on one signal share): an `AbortError` is a caller cancel only when that signal is aborted
	// and it is not the engine deadline. `TimeoutError` (`timeoutMs`, a slot wait) is a timeout, and
	// an abort without such a context keeps the old `timeout` answer.
	if (name === 'AbortError' && context?.signal?.aborted && !isEngineDeadline(context)) {
		return { kind: 'cancelled' };
	}
	if (name === 'AbortError' || name === 'TimeoutError') return { kind: 'timeout' };
	if (isDnsFault(error)) return { kind: 'dns_failure' };
	return { kind: 'http_error' };
}
