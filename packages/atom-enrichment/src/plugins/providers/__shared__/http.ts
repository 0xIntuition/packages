import type { Readable as NodeReadable } from 'node:stream';
import { parseRetryAfterMs } from '@0xintuition/pipeline-runtime/retry-after';
import type { z } from 'zod/v4';
import { isPublicHttpUrlWithDns, type ResolvePublicHostname } from '../../../image-policy';
import { type EnrichmentNetworkOptions, isLoopbackFixtureUrl } from '../../../network';

export type ValidatedConnection = { hostname: string; address: string; family: number };
export type PinnedRequestInit = RequestInit & { connection?: ValidatedConnection };

export type FetchLike = (input: string, init?: PinnedRequestInit) => Promise<Response>;

const PIN_AWARE_FETCH = Symbol.for('intuition.enrichment.pinAwareFetch');
/** A fetcher the shared hop dials as its transport; the only kind a caller-supplied `fetch` can be. */
export type PinAwareFetch = FetchLike & { [PIN_AWARE_FETCH]: true };

/**
 * Explicit trusted transport seam for fixtures or pin-aware instrumentation.
 * An adapter that dials MUST use init.connection.address without resolving again.
 * Ordinary, bound and wrapped fetch functions are ignored by the shared hop.
 */
export function createPinAwareFetch<TAdapter extends FetchLike>(
	adapter: TAdapter
): TAdapter & PinAwareFetch {
	return Object.assign(adapter, { [PIN_AWARE_FETCH]: true as const });
}

/**
 * Wraps the pinned dial (a pin-aware `inner`, or the default pinned Node transport) so a caller
 * can pace, trace or retry around it without losing the pin: `wrap` receives the real `dial`
 * and MUST call it with the `init` it was given (that carries the validated `connection`).
 *
 *   wrapPinAwareFetch(undefined, async (dial, url, init) => {
 *     await pace(init?.signal); // your own spacing step: (signal) => Promise<void>
 *     return dial(url, init);
 *   })
 *
 * `wrap` runs once per HOP, redirects included: a request that follows two redirects is paced
 * three times. `pace` must therefore be a bare delay, not something with its own redirect loop
 * (the identity bridge's `rateLimitedFetch(input, init, allowRedirects)` is such a function, so
 * its spacing has to be extracted into a `pace(signal)` before it can be used here).
 */
export function wrapPinAwareFetch(
	inner: PinAwareFetch | undefined,
	wrap: (dial: FetchLike, url: string, init?: PinnedRequestInit) => Promise<Response>
): PinAwareFetch {
	const dial: FetchLike = inner ?? ((url, init) => fetchWithPinnedNodeTransport(url, init));
	return createPinAwareFetch((url, init) => wrap(dial, url, init));
}

export function isPinAwareFetch(fetcher: FetchLike): fetcher is PinAwareFetch {
	return (fetcher as Partial<PinAwareFetch>)[PIN_AWARE_FETCH] === true;
}

// Retained for existing package exports; diagnostics are no longer returned.
export const PROVIDER_HTTP_BODY_EXCERPT_MAX_CHARS = 512;
export const MAX_PROVIDER_HTTP_RESPONSE_BYTES = 1_048_576;
const MAX_PROVIDER_HTTP_REDIRECTS = 5;
const PROVIDER_HTTP_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/**
 * Optional observer of the hops of one logical fetch. The hop reports only the
 * status and headers of each response it received; it knows nothing of who listens.
 */
export type ProviderHopSink = {
	record(hop: { status: number; headers: Headers; url: string }): void;
	/** The fetch waits for its turn in the per-host pacing queue (our own wait, nothing dialled yet). */
	queued?(): void;
	/** The turn came: the first hop is being dialled. */
	dialing?(): void;
};

export type ProviderHttpOptions = EnrichmentNetworkOptions & {
	hopSink?: ProviderHopSink;
	resolve?: ResolvePublicHostname;
	// The licensed TMDB provider alone opts into its exact API host.
	allowTmdbApi?: boolean;
	maxResponseBytes?: number;
	/**
	 * Gives a response status its own error class, so the `ProviderHttpError` is born with it (no
	 * catch-and-rethrow). A provider whose throttle is not a 429 uses `{ 503: RATE_LIMITED_KIND }`; the
	 * engine and the metrics then treat it as a retriable rate limit. Other providers are unaffected.
	 */
	statusClasses?: Readonly<Record<number, string>>;
	/**
	 * On a non-2xx response, read a small bounded JSON body and keep its OAuth-style `error` code
	 * (`invalid_client`, ...) or Google-envelope reason (`API_KEY_INVALID`, ...) on the thrown
	 * `ProviderHttpError`. Nothing else of the body is kept.
	 */
	captureErrorCode?: boolean;
	/**
	 * Turns a 2xx that is really an error into a structured failure, before the body is read. The
	 * body is cancelled and the returned error thrown. Wikimedia answers `maxlag` as HTTP 200 with
	 * `retry-after` and `mediawiki-api-error: maxlag`; see `rejectWikimediaMaxlag`.
	 */
	rejectOk?: (response: { status: number; headers: Headers }) => ProviderHttpError | undefined;
	/**
	 * Extra header names (beyond authorization, cookie, proxy-authorization) removed when a redirect
	 * leaves the original origin, for example a provider key in `x-api-key`.
	 */
	credentialHeaders?: readonly string[];
};

type ProviderHttpErrorInput = {
	/** The underlying fault (a resolver error); read by diagnostics only, never its message. */
	cause?: unknown;
	errorClass?: string;
	status: number;
	retryAfterMs?: number;
	errorCode?: string;
	// Legacy producer inputs are deliberately discarded, never projected or logged.
	url?: string;
	bodyExcerpt?: string;
};

export class ProviderHttpError extends Error {
	readonly status: number;
	readonly retryAfterMs: number | undefined;
	readonly errorClass: string;
	/**
	 * A fixed-shape code of the response body, when the request asked for it (`captureErrorCode`):
	 * the OAuth-style `error` (`invalid_client`) or a Google-envelope reason / status
	 * (`API_KEY_INVALID`, `quotaExceeded`). Never free text or an id.
	 */
	readonly errorCode: string | undefined;

	constructor(input: ProviderHttpErrorInput) {
		const errorClass = input.errorClass ?? 'provider_http_error';
		super(
			errorClass === 'provider_http_error' ? `HTTP ${input.status} from provider` : errorClass,
			input.cause === undefined ? undefined : { cause: input.cause }
		);
		this.name = 'ProviderHttpError';
		this.status = input.status;
		this.errorClass = errorClass;
		this.retryAfterMs = input.retryAfterMs;
		this.errorCode = input.errorCode;
	}
}

export { parseRetryAfterMs };

/** The one JSON parse of a provider body: a body that is not JSON is a 502 `invalid_json`. */
export function parseProviderJson<TData = unknown>(text: string): TData {
	try {
		return JSON.parse(text) as TData;
	} catch {
		throw new ProviderHttpError({ status: 502, errorClass: 'invalid_json' });
	}
}

export async function fetchJson<TData>(
	fetcher: FetchLike,
	url: string,
	init?: RequestInit,
	options: ProviderHttpOptions = {}
): Promise<TData> {
	return parseProviderJson<TData>(await fetchText(fetcher, url, init, options));
}

export async function fetchJsonWithSchema<TSchema extends z.ZodTypeAny>(
	fetcher: FetchLike,
	url: string,
	schema: TSchema,
	init?: RequestInit,
	options: ProviderHttpOptions = {}
): Promise<z.infer<TSchema>> {
	const payload = await fetchJson<unknown>(fetcher, url, init, options);
	return schema.parse(payload);
}

export async function fetchText(
	fetcher: FetchLike,
	url: string,
	init?: RequestInit,
	options: ProviderHttpOptions = {}
): Promise<string> {
	const response = await fetchProviderHttpResponse(fetcher, url, init, options);
	if (!response.ok) {
		throw await createProviderHttpError(response, options);
	}
	const rejected = options.rejectOk?.({ status: response.status, headers: response.headers });
	if (rejected) {
		await response.body?.cancel().catch(() => undefined);
		throw rejected;
	}

	return await readResponseText(response, options);
}

export async function fetchProviderHttpResponse(
	fetcher: FetchLike,
	url: string,
	init?: RequestInit,
	options: ProviderHttpOptions = {}
): Promise<Response> {
	let currentUrl = url;
	let hopInit = init;
	const originalOrigin = originOf(url);
	for (let redirectCount = 0; redirectCount <= MAX_PROVIDER_HTTP_REDIRECTS; redirectCount += 1) {
		assertNotEmbargoedHost(currentUrl, options);
		const response = await fetchProviderHttpHop(fetcher, currentUrl, hopInit, options);
		if (!response.url) Object.defineProperty(response, 'url', { value: currentUrl });
		if (!PROVIDER_HTTP_REDIRECT_STATUSES.has(response.status)) {
			return response;
		}

		const location = response.headers.get('location');
		let nextUrl: string | undefined;
		try {
			nextUrl = location ? new URL(location, currentUrl).href : undefined;
			if (nextUrl) {
				assertNotEmbargoedHost(nextUrl, options);
				await assertPublicTarget(nextUrl, options);
			}
		} catch (error) {
			await response.body?.cancel().catch(() => undefined);
			if (error instanceof ProviderHttpError) throw error;
			throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
		}
		if (init?.redirect === 'manual') {
			return response;
		}
		await response.body?.cancel().catch(() => undefined);
		if (!location || init?.redirect === 'error') {
			throw new ProviderHttpError({
				bodyExcerpt: '',
				errorClass: 'redirect_rejected',
				status: response.status,
				url: currentUrl,
			});
		}
		if (redirectCount === MAX_PROVIDER_HTTP_REDIRECTS) {
			throw new ProviderHttpError({
				bodyExcerpt: '',
				errorClass: 'redirect_exhausted',
				status: response.status,
				url: currentUrl,
			});
		}
		currentUrl = nextUrl as string;
		// Like native fetch: credentials never follow a redirect to another origin, and once
		// dropped they are not restored if a later hop comes back to the original origin.
		if (originOf(currentUrl) !== originalOrigin)
			hopInit = withoutCredentialHeaders(hopInit, options.credentialHeaders);
	}

	throw new ProviderHttpError({
		bodyExcerpt: '',
		errorClass: 'redirect_exhausted',
		status: 310,
		url: currentUrl,
	});
}

const CREDENTIAL_HEADERS = ['authorization', 'cookie', 'proxy-authorization'] as const;

function originOf(url: string): string | undefined {
	try {
		return new URL(url).origin;
	} catch {
		return undefined;
	}
}

function withoutCredentialHeaders(
	init: RequestInit | undefined,
	extra: readonly string[] = []
): RequestInit | undefined {
	if (!init?.headers) return init;
	const headers = new Headers(init.headers);
	for (const name of [...CREDENTIAL_HEADERS, ...extra]) headers.delete(name);
	return { ...init, headers };
}

/** One pinned hop for providers that own their redirect and page-source policy. */
export async function fetchProviderHttpHop(
	fetcher: FetchLike,
	url: string,
	init?: RequestInit,
	options: ProviderHttpOptions & { allowPrivateNetwork?: boolean } = {}
): Promise<Response> {
	const connection = await assertPublicTarget(url, options, options.allowPrivateNetwork);
	const transport = isPinAwareFetch(fetcher) ? fetcher : fetchWithPinnedNodeTransport;
	const response = await transport(url, { ...init, redirect: 'manual', connection });
	// A target rejected above never reaches the network and is not reported.
	try {
		options.hopSink?.record({ status: response.status, headers: response.headers, url });
	} catch {
		// A sink can never alter the request.
	}
	return response;
}

/**
 * Normalize a URL hostname for embargo comparison: lowercase, strip IPv6
 * brackets, and strip DNS root dots so a trailing-dot spelling of an embargoed
 * host cannot escape the label-anchored suffix match (adv-R4 F4-1).
 */
function normalizeRequestHostname(hostname: string): string {
	return hostname
		.toLowerCase()
		.replace(/^\[|\]$/g, '')
		.replace(/\.+$/, '');
}

/**
 * Whether `value` is a host this service never fetches (IMDb; TMDB's website and image hosts).
 * Exported so a fetch that shares another consumer's request can apply the same embargo.
 */
export function isEmbargoedHost(value: string, options: ProviderHttpOptions = {}): boolean {
	let hostname: string;
	try {
		hostname = normalizeRequestHostname(new URL(value).hostname);
	} catch {
		return false;
	}
	if (hostname === 'imdb.com' || hostname.endsWith('.imdb.com')) return true;
	return (
		hostname === 'themoviedb.org' ||
		(hostname.endsWith('.themoviedb.org') &&
			!(options.allowTmdbApi === true && hostname === 'api.themoviedb.org')) ||
		hostname === 'tmdb.org' ||
		hostname.endsWith('.tmdb.org')
	);
}

function assertNotEmbargoedHost(value: string, options: ProviderHttpOptions): void {
	if (isEmbargoedHost(value, options)) {
		throw new ProviderHttpError({
			bodyExcerpt: '',
			errorClass: 'embargoed_host',
			status: 451,
			url: value,
		});
	}
}

// Browser-like headers for page-scraping fetches (opengraph, microdata).
// Many publishers serve challenge pages or empty shells to non-browser user
// agents; identifying as a browser recovers the real markup (verified live:
// Letterboxd serves Movie JSON-LD only with a browser UA).
export const BROWSER_FETCH_HEADERS: Record<string, string> = {
	'User-Agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Language': 'en-US,en;q=0.9',
};

const ERROR_CODE_SHAPE = /^[a-z][a-z_]{0,63}$/;
// Google-shaped reasons are upper snake (`API_KEY_INVALID`) or lower camel (`keyInvalid`).
// Upper SNAKE_CASE (`API_KEY_INVALID`, `PERMISSION_DENIED`) or lowerCamel (`quotaExceeded`), no
// digits: an id-like `reason` (`user12345`) must never reach diagnostics as an "error code".
const GOOGLE_ERROR_CODE_SHAPE = /^(?:[A-Z][A-Z_]{0,63}|[a-z][A-Za-z]{0,63})$/;
const ERROR_CODE_BODY_MAX_BYTES = 4096;

function firstReason(list: unknown): string | undefined {
	if (!Array.isArray(list)) return undefined;
	for (const entry of list) {
		const reason = (entry as { reason?: unknown } | null)?.reason;
		if (typeof reason === 'string' && GOOGLE_ERROR_CODE_SHAPE.test(reason)) return reason;
	}
	return undefined;
}

/**
 * The fixed-shape error code of a JSON error body: the OAuth-style `error` string, or for the
 * Google error envelope `{ error: { details: [{ reason }], errors: [{ reason }], status } }` the
 * first `details[].reason` (`API_KEY_INVALID`), else `errors[].reason`, else `status`. Never text.
 */
function extractErrorCode(body: { error?: unknown }): string | undefined {
	const { error } = body;
	if (typeof error === 'string') return ERROR_CODE_SHAPE.test(error) ? error : undefined;
	if (typeof error !== 'object' || error === null) return undefined;
	const envelope = error as { details?: unknown; errors?: unknown; status?: unknown };
	return (
		firstReason(envelope.details) ??
		firstReason(envelope.errors) ??
		(typeof envelope.status === 'string' && GOOGLE_ERROR_CODE_SHAPE.test(envelope.status)
			? envelope.status
			: undefined)
	);
}

async function createProviderHttpError(
	response: Response,
	options: ProviderHttpOptions
): Promise<ProviderHttpError> {
	let errorCode: string | undefined;
	if (options.captureErrorCode) {
		try {
			const body = JSON.parse(
				await readResponseText(response, { maxResponseBytes: ERROR_CODE_BODY_MAX_BYTES })
			) as { error?: unknown };
			errorCode = extractErrorCode(body);
		} catch {
			// An unreadable or oversized error body just has no code.
		}
	}
	await response.body?.cancel().catch(() => undefined);
	return new ProviderHttpError({
		status: response.status,
		...(options.statusClasses?.[response.status]
			? { errorClass: options.statusClasses[response.status] }
			: {}),
		retryAfterMs: parseRetryAfterMs(response.headers.get('retry-after')),
		...(errorCode ? { errorCode } : {}),
	});
}

async function assertPublicTarget(
	url: string,
	options: ProviderHttpOptions,
	allowPrivateNetwork = false
): Promise<ValidatedConnection> {
	let addresses: Awaited<ReturnType<ResolvePublicHostname>> = [];
	let resolverFault: { error: unknown } | undefined;
	const resolve: ResolvePublicHostname = async (hostname) => {
		try {
			addresses = options.resolve
				? await options.resolve(hostname)
				: (
						await (
							await import('node:dns/promises')
						).lookup(hostname, {
							all: true,
							verbatim: true,
						})
					).map((entry) => ({ address: entry.address, family: entry.family as 4 | 6 }));
		} catch (error) {
			resolverFault = { error };
			throw error;
		}
		return addresses;
	};
	const { isIP } = await import('node:net');
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
	}
	const hostname = normalizeRequestHostname(parsed.hostname);
	const family = isIP(hostname);
	if (allowPrivateNetwork) {
		// Explicit offline/seed policy override still pins the selected dial.
		if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
			throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
		if (!family) await resolve(hostname);
		if (addresses.some((entry) => isIP(entry.address) !== entry.family))
			throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
	} else if (
		!(options.allowLoopbackFixtures === true && isLoopbackFixtureUrl(url)) &&
		!(await isPublicHttpUrlWithDns(url, resolve))
	) {
		// Same class, status and metric as any refusal; the resolver error rides as `cause` so the
		// diagnostic can tell a host that stopped resolving from a private answer.
		throw new ProviderHttpError({
			status: 400,
			errorClass: 'target_rejected',
			...(resolverFault ? { cause: resolverFault.error } : {}),
		});
	}
	const address = family
		? { address: hostname, family }
		: (addresses.find((entry) => entry.family === 4) ?? addresses[0]);
	if (!address) throw new ProviderHttpError({ status: 400, errorClass: 'target_rejected' });
	return { hostname, ...address };
}

/** Pin DNS lookup while retaining the original Host and HTTPS SNI/certificate name. */
export async function fetchWithPinnedNodeTransport(
	input: string,
	init?: PinnedRequestInit
): Promise<Response> {
	const parsed = new URL(input);
	const connection = init?.connection;
	const hostname = normalizeRequestHostname(parsed.hostname);
	if (!connection || normalizeRequestHostname(connection.hostname) !== hostname) {
		throw new Error('Provider transport requires a validated connection');
	}
	if (init?.body != null && typeof init.body !== 'string') {
		throw new Error('Pinned provider transport does not support this request body');
	}
	const headers = new Headers(init?.headers);
	headers.set('host', parsed.host);
	const { request: httpRequest } = await import('node:http');
	const { request: httpsRequest } = await import('node:https');
	const { isIP } = await import('node:net');
	const { pipeline, Readable } = await import('node:stream');
	const { createBrotliDecompress, createGunzip, createInflate } = await import('node:zlib');
	const request = parsed.protocol === 'https:' ? httpsRequest : httpRequest;
	const signal = init?.signal;
	signal?.throwIfAborted();
	if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
		throw new Error('Pinned provider transport requires HTTP');
	}
	return await new Promise<Response>((resolve, reject) => {
		const req = request(
			parsed,
			{
				agent: false,
				...(parsed.protocol === 'https:' && !isIP(hostname) ? { servername: hostname } : {}),
				method: init?.method ?? 'GET',
				headers: Object.fromEntries(headers),
				lookup: (host, options, callback) => {
					if (normalizeRequestHostname(host) !== hostname) {
						callback(new Error('Unvalidated connection hostname'), '', 0);
						return;
					}
					if (options.all) {
						callback(null, [{ address: connection.address, family: connection.family }]);
					} else {
						callback(null, connection.address, connection.family);
					}
				},
			},
			(incoming) => {
				const responseHeaders = new Headers();
				for (let index = 0; index < incoming.rawHeaders.length; index += 2) {
					responseHeaders.append(incoming.rawHeaders[index]!, incoming.rawHeaders[index + 1]!);
				}
				const status = incoming.statusCode ?? 502;
				let readable: NodeReadable = incoming;
				const hasBody = init?.method !== 'HEAD' && ![204, 205, 304].includes(status);
				const encoding = responseHeaders.get('content-encoding')?.trim().toLowerCase();
				if (hasBody && encoding && encoding !== 'identity') {
					const decoder =
						encoding === 'gzip'
							? createGunzip()
							: encoding === 'deflate'
								? createInflate()
								: encoding === 'br'
									? createBrotliDecompress()
									: undefined;
					if (!decoder) {
						incoming.destroy();
						reject(new Error('Unsupported response content encoding'));
						return;
					}
					pipeline(incoming, decoder, () => undefined);
					readable = decoder;
					responseHeaders.delete('content-encoding');
					responseHeaders.delete('content-length');
				}
				const body = hasBody
					? (Readable.toWeb(readable) as unknown as ReadableStream<Uint8Array>)
					: null;
				if (!body) incoming.resume();
				const response = new Response(body, { status, headers: responseHeaders });
				Object.defineProperty(response, 'url', { value: parsed.href });
				resolve(response);
			}
		);
		req.on('error', reject);
		// Bun can close an aborted ClientRequest without emitting an error. Settle
		// explicitly as well as closing the pinned dial, including before headers.
		const abort = () => {
			reject(signal?.reason ?? new DOMException('Provider request aborted', 'AbortError'));
			req.destroy();
		};
		signal?.addEventListener('abort', abort, { once: true });
		req.on('close', () => signal?.removeEventListener('abort', abort));
		if (signal?.aborted) abort();
		else req.end(init?.body ?? undefined);
	});
}

async function readResponseText(response: Response, options: ProviderHttpOptions): Promise<string> {
	const maxBytes = Math.min(
		options.maxResponseBytes ?? MAX_PROVIDER_HTTP_RESPONSE_BYTES,
		MAX_PROVIDER_HTTP_RESPONSE_BYTES
	);
	if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
		await response.body?.cancel().catch(() => undefined);
		throw new RangeError('Response byte limit must be a positive integer');
	}
	if (Number(response.headers.get('content-length')) > maxBytes) {
		await response.body?.cancel().catch(() => undefined);
		throw new ProviderHttpError({ status: 413, errorClass: 'response_too_large' });
	}
	if (!response.body) return '';
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	const chunks: string[] = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.byteLength;
			if (totalBytes > maxBytes) {
				await reader.cancel().catch(() => undefined);
				throw new ProviderHttpError({ status: 413, errorClass: 'response_too_large' });
			}
			chunks.push(decoder.decode(value, { stream: true }));
		}
		chunks.push(decoder.decode());
		return chunks.join('');
	} finally {
		reader.releaseLock();
	}
}
