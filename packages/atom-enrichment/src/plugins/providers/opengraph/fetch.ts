import { parseRetryAfterMs } from '@0xintuition/pipeline-runtime/retry-after';
import {
	authorizeOpenGraphPageSource,
	classifyPublicHttpTarget,
	isDnsNotFoundError,
	type OpenGraphPageAuthorization,
	type PublicTargetVerdict,
	type ResolvePublicHostname,
} from '../../../image-policy';
import { type EnrichmentNetworkOptions, isLoopbackFixtureUrl } from '../../../network';
import { type HostPolicyOptions, runWithHostPolicy } from '../__shared__/host-policy';
import {
	type FetchLike,
	fetchProviderHttpHop,
	type ProviderHopSink,
	ProviderHttpError,
} from '../__shared__/http';
import { OpenGraphFetchError } from '../__shared__/page-fetch-error';
import { BLOCKED_STATUSES, DEAD_URL_STATUSES } from '../__shared__/page-statuses';

export { OpenGraphFetchError };

export type OpenGraphTerminalStatus = 'fetched' | 'no_metadata' | 'blocked' | 'dead_url';

export type OpenGraphMetadata = {
	allTags?: Record<string, string>;
	description: string;
	image: string;
	title: string;
	type: string;
	url: string;
};

export type OpenGraphFetchResult = {
	bytesRead: number;
	finalUrl: string;
	fullBody?:
		| { html: string; status: 'fetched' }
		| { reason: 'body_too_large'; status: 'body_too_large' };
	/**
	 * Only with `retainBodyBytes`: the head was not closed within `maxBytes`, so no
	 * metadata was read. The page was still kept in `fullBody` for other consumers; a
	 * consumer that needs the head reports `createHeadSizeLimitError()` as it always did.
	 */
	headCapExceeded?: true;
	httpStatus: number | null;
	metadata: OpenGraphMetadata;
	pageAuthorization?: OpenGraphPageAuthorization;
	redirects: number;
	reason: string;
	status: OpenGraphTerminalStatus;
	url: string;
};

export type OpenGraphFetchOptions = EnrichmentNetworkOptions &
	HostPolicyOptions & {
		allowPrivateNetwork?: boolean;
		// Only explicitly pin-aware adapters are used; ordinary fetch options use the pinned Node dial.
		fetch?: FetchLike;
		/** Receives the status and headers of every hop that got a response. */
		hopSink?: ProviderHopSink;
		maxBytes?: number;
		/**
		 * Request headers replacing the defaults (accept, user-agent) when set. The
		 * shared page fetch uses browser headers so one request serves every plugin.
		 */
		headers?: Record<string, string>;
		maxRedirects?: number;
		/**
		 * Refuses a URL before it is dialled, the first one and every redirect target:
		 * the fetch stops with a `blocked` result (`refused_host`, `redirect_refused_host`).
		 * For a consumer of a shared request that must never reach a host.
		 */
		refuseUrl?: (url: URL) => boolean;
		pageSourceContext?: { genericUserPasted: boolean };
		readFullBody?: boolean;
		/**
		 * Keep up to this many bytes of the body in `fullBody` for other consumers of
		 * the same fetch, without changing the metadata: it is still parsed from the
		 * head, with the `maxBytes` head cap, exactly as when the body is not kept.
		 */
		retainBodyBytes?: number;
		resolveHostname?: ResolvePublicHostname;
		sameHostOnly?: boolean;
		/** The fetch's own timer; `Number.POSITIVE_INFINITY` leaves it to `signal` alone. */
		timeoutMs?: number;
		userAgent?: string;
		signal?: AbortSignal;
	};

export const DEFAULT_OPENGRAPH_MAX_BYTES = 512 * 1024;
const DEFAULT_MAX_BYTES = DEFAULT_OPENGRAPH_MAX_BYTES;
const DEFAULT_MAX_REDIRECTS = 5;
export const DEFAULT_OPENGRAPH_TIMEOUT_MS = 10_000;
const DEFAULT_TIMEOUT_MS = DEFAULT_OPENGRAPH_TIMEOUT_MS;
const DEFAULT_USER_AGENT =
	'IntuitionSeedControlPlane/1.0 (+https://intuition.systems; OpenGraph metadata verifier)';
const MAX_ALL_TAG_KEYS = 60;
const MAX_ALL_TAG_VALUE_LENGTH = 2000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const ALL_TAG_META_KEY = /^(?:article|book|music|og|profile|twitter|video):/;

export async function fetchOpenGraphMetadata(
	rawUrl: string,
	options: OpenGraphFetchOptions = {}
): Promise<OpenGraphFetchResult> {
	const maxRedirects = Math.min(
		options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
		DEFAULT_MAX_REDIRECTS
	);
	const initialUrl = parseCandidateUrl(rawUrl);
	if (!initialUrl) {
		return blockedResult(rawUrl, rawUrl, null, 'invalid_url', 0, 0);
	}
	const unsafeReason = unsafeUrlReason(initialUrl, options);
	if (unsafeReason) {
		return blockedResult(rawUrl, initialUrl.href, null, unsafeReason, 0, 0);
	}
	const verdict = await targetVerdict(initialUrl.href, options);
	if (verdict !== 'public') {
		return blockedResult(rawUrl, initialUrl.href, null, TARGET_REFUSAL_REASONS[verdict], 0, 0);
	}
	if (
		options.pageSourceContext &&
		!authorizeOpenGraphPageSource(initialUrl.href, options.pageSourceContext)
	) {
		return blockedResult(rawUrl, initialUrl.href, null, 'page_source_denied', 0, 0);
	}

	options.hopSink?.queued?.();
	return runWithHostPolicy(initialUrl.hostname, options, () => {
		options.hopSink?.dialing?.();
		return fetchOpenGraphMetadataUnpaced(rawUrl, initialUrl, {
			...options,
			maxRedirects,
		});
	});
}

/**
 * Reasons of a `blocked` result for a target refused before any dial. `private_address` is our own
 * policy (an internal name, a private literal, a name that resolves to a private address);
 * `lookup_not_found` is a host that does not exist and `lookup_failed` a lookup that failed for
 * another reason: those two say something about the site, the first says nothing.
 */
const TARGET_REFUSAL_REASONS: Record<Exclude<PublicTargetVerdict, 'public'>, string> = {
	private: 'private_address',
	not_found: 'lookup_not_found',
	lookup_failed: 'lookup_failed',
};

/**
 * Why the pinned dial refused a target the pre-check let through. It resolves the host again, and
 * a resolver error rides on the refusal as `cause`: a name that no longer exists or a lookup that
 * failed says something about the site, while a refusal without one (or a private answer, a
 * rebinding) is our own policy.
 */
function dialRefusalReason(error: ProviderHttpError): string {
	if (error.cause === undefined) return TARGET_REFUSAL_REASONS.private;
	return isDnsNotFoundError(error.cause)
		? TARGET_REFUSAL_REASONS.not_found
		: TARGET_REFUSAL_REASONS.lookup_failed;
}

async function targetVerdict(
	href: string,
	options: OpenGraphFetchOptions
): Promise<PublicTargetVerdict> {
	if (options.allowPrivateNetwork) return 'public';
	if (options.allowLoopbackFixtures === true && isLoopbackFixtureUrl(href)) return 'public';
	return classifyPublicHttpTarget(href, options.resolveHostname);
}

function parseCandidateUrl(rawUrl: string) {
	try {
		const url = new URL(rawUrl);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') {
			return null;
		}
		if (url.username || url.password) {
			return null;
		}
		return url;
	} catch {
		return null;
	}
}

async function fetchOpenGraphMetadataUnpaced(
	rawUrl: string,
	initialUrl: URL,
	options: Required<Pick<OpenGraphFetchOptions, 'maxRedirects'>> & OpenGraphFetchOptions
): Promise<OpenGraphFetchResult> {
	const controller = new AbortController();
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const timeout = Number.isFinite(timeoutMs)
		? setTimeout(() => controller.abort(), timeoutMs)
		: undefined;
	let currentUrl = initialUrl;
	let redirects = 0;
	try {
		while (true) {
			const pageAuthorization = options.pageSourceContext
				? authorizeOpenGraphPageSource(currentUrl.href, options.pageSourceContext)
				: undefined;
			if (options.pageSourceContext && !pageAuthorization) {
				return blockedResult(
					rawUrl,
					currentUrl.href,
					null,
					redirects > 0 ? 'redirect_page_source_denied' : 'page_source_denied',
					redirects,
					0
				);
			}
			if (options.refuseUrl?.(currentUrl)) {
				return blockedResult(
					rawUrl,
					currentUrl.href,
					null,
					redirects > 0 ? 'redirect_refused_host' : 'refused_host',
					redirects,
					0
				);
			}
			let response: Response;
			try {
				response = await fetchProviderHttpHop(
					options.fetch ?? globalThis.fetch,
					currentUrl.href,
					{
						headers: options.headers ?? {
							accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
							'user-agent': options.userAgent ?? DEFAULT_USER_AGENT,
						},
						method: 'GET',
						redirect: 'manual',
						signal: options.signal
							? AbortSignal.any([controller.signal, options.signal])
							: controller.signal,
					},
					{
						resolve: options.resolveHostname,
						allowPrivateNetwork: options.allowPrivateNetwork,
						allowLoopbackFixtures: options.allowLoopbackFixtures,
						hopSink: options.hopSink,
					}
				);
			} catch (error) {
				if (error instanceof ProviderHttpError && error.errorClass === 'target_rejected') {
					return blockedResult(
						rawUrl,
						currentUrl.href,
						null,
						dialRefusalReason(error),
						redirects,
						0
					);
				}
				const normalized = normalizeFetchError(error);
				if (normalized.code === 'dns_not_found') {
					return deadUrlResult(rawUrl, currentUrl.href, null, redirects);
				}
				throw normalized;
			}

			if (REDIRECT_STATUSES.has(response.status)) {
				const location = response.headers.get('location');
				if (!location) {
					return blockedResult(
						rawUrl,
						currentUrl.href,
						response.status,
						'redirect_missing_location',
						redirects,
						0
					);
				}
				if (redirects >= options.maxRedirects) {
					throw new OpenGraphFetchError({
						code: 'redirect_limit',
						httpStatus: response.status,
						message: `OpenGraph redirect cap exceeded for ${currentUrl.hostname}.`,
						retryable: true,
					});
				}
				const nextUrl = new URL(location, currentUrl);
				const unsafeReason = unsafeUrlReason(nextUrl, options);
				if (unsafeReason) {
					return blockedResult(
						rawUrl,
						nextUrl.href,
						response.status,
						`redirect_${unsafeReason}`,
						redirects + 1,
						0
					);
				}
				const nextVerdict = await targetVerdict(nextUrl.href, options);
				if (nextVerdict !== 'public') {
					return blockedResult(
						rawUrl,
						nextUrl.href,
						response.status,
						`redirect_${TARGET_REFUSAL_REASONS[nextVerdict]}`,
						redirects + 1,
						0
					);
				}
				if (
					options.pageSourceContext &&
					!authorizeOpenGraphPageSource(nextUrl.href, options.pageSourceContext)
				) {
					return blockedResult(
						rawUrl,
						nextUrl.href,
						response.status,
						'redirect_page_source_denied',
						redirects + 1,
						0
					);
				}
				if (
					options.sameHostOnly &&
					normalizeComparableHostname(nextUrl.hostname) !==
						normalizeComparableHostname(initialUrl.hostname)
				) {
					return blockedResult(
						rawUrl,
						nextUrl.href,
						response.status,
						'redirect_cross_host',
						redirects + 1,
						0
					);
				}
				currentUrl = nextUrl;
				redirects += 1;
				continue;
			}

			if (DEAD_URL_STATUSES.has(response.status)) {
				return deadUrlResult(rawUrl, currentUrl.href, response.status, redirects);
			}
			if (BLOCKED_STATUSES.has(response.status)) {
				return blockedResult(
					rawUrl,
					currentUrl.href,
					response.status,
					'http_blocked',
					redirects,
					0
				);
			}
			if (RETRYABLE_STATUSES.has(response.status)) {
				throw new OpenGraphFetchError({
					code: `http_${response.status}`,
					httpStatus: response.status,
					message: `OpenGraph fetch retryable HTTP ${response.status}.`,
					retryAfterMs: parseRetryAfterMs(response.headers.get('retry-after')),
					retryable: true,
				});
			}
			if (!response.ok) {
				return blockedResult(
					rawUrl,
					currentUrl.href,
					response.status,
					'http_unusable',
					redirects,
					0
				);
			}

			const document = await readHtml(response, {
				maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
				readFullBody: options.readFullBody === true,
				retainBytes: options.retainBodyBytes,
			});
			const metadata = document.headCapExceeded
				? emptyMetadata()
				: parseOpenGraphHead(document.headText ?? document.text, currentUrl.href);
			const fullBody =
				options.readFullBody || options.retainBodyBytes !== undefined
					? document.bodyTooLarge
						? ({ reason: 'body_too_large', status: 'body_too_large' } as const)
						: ({ html: document.text, status: 'fetched' } as const)
					: undefined;
			if (!hasMetadata(metadata)) {
				return {
					bytesRead: document.bytesRead,
					finalUrl: currentUrl.href,
					...(fullBody ? { fullBody } : {}),
					...(document.headCapExceeded ? { headCapExceeded: true as const } : {}),
					httpStatus: response.status,
					metadata,
					...(pageAuthorization ? { pageAuthorization } : {}),
					redirects,
					reason: document.headCapExceeded ? 'head_cap_exceeded' : 'no_metadata',
					status: 'no_metadata',
					url: rawUrl,
				};
			}
			return {
				bytesRead: document.bytesRead,
				finalUrl: currentUrl.href,
				...(fullBody ? { fullBody } : {}),
				httpStatus: response.status,
				metadata,
				...(pageAuthorization ? { pageAuthorization } : {}),
				redirects,
				reason: 'fetched',
				status: 'fetched',
				url: rawUrl,
			};
		}
	} catch (error) {
		if (error instanceof OpenGraphFetchError) {
			throw error;
		}
		throw normalizeFetchError(error);
	} finally {
		if (timeout) clearTimeout(timeout);
	}
}

export function createHeadSizeLimitError(maxBytes = DEFAULT_MAX_BYTES): OpenGraphFetchError {
	return new OpenGraphFetchError({
		code: 'size_limit',
		message: `OpenGraph response exceeded ${maxBytes} bytes before </head>.`,
		retryable: true,
	});
}

type ReadHtmlOptions = {
	/** Head cap, or the whole-body cap with `readFullBody`. */
	maxBytes: number;
	readFullBody: boolean;
	/**
	 * Keep reading past `</head>` up to this many bytes so the page can be shared; the head
	 * is then kept apart (`headText`) and a head longer than `maxBytes` is reported as
	 * `headCapExceeded` instead of failing the read.
	 */
	retainBytes?: number | undefined;
};

/** Index just past `</head>` (the tag itself, not trailing whitespace), searching only text added since `previousLength`. */
function findHeadEnd(text: string, previousLength: number): number {
	// A `</head   ` cut off by the end of the previous text starts at its last `<`, which has no `>` after it.
	const lastOpen = text.lastIndexOf('<', previousLength - 1);
	const from =
		lastOpen >= 0 && !text.slice(lastOpen, previousLength).includes('>')
			? lastOpen
			: previousLength;
	const match = /<\/head\s*>/i.exec(text.slice(from));
	return match ? from + match.index + '</head>'.length : -1;
}

async function readHtml(response: Response, options: ReadHtmlOptions) {
	const { maxBytes, readFullBody, retainBytes } = options;
	const retaining = retainBytes !== undefined;
	const reader = response.body?.getReader();
	if (!reader) {
		return {
			bodyTooLarge: false,
			bytesRead: 0,
			text: '',
			headText: undefined,
			headCapExceeded: false,
		};
	}
	const decoder = new TextDecoder();
	let bytesRead = 0;
	let text = '';
	let headText: string | undefined;
	let headCapExceeded = false;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			const previousBytesRead = bytesRead;
			bytesRead += value.byteLength;
			if (retaining && headText === undefined && bytesRead > maxBytes) {
				headCapExceeded = true;
			}
			const bodyCap = retaining ? retainBytes : maxBytes;
			if (bytesRead > bodyCap && (retaining || readFullBody)) {
				const remainingBytes = Math.max(0, bodyCap - previousBytesRead);
				if (remainingBytes > 0) {
					text += decoder.decode(value.subarray(0, remainingBytes), { stream: true });
				}
				text += decoder.decode();
				try {
					await reader.cancel(new Error('Response exceeded full-body size limit'));
				} catch {
					// The body limit is already established even if transport cleanup rejects.
				}
				if (retaining && headText === undefined && !headCapExceeded) {
					const headEnd = findHeadEnd(text, 0);
					if (headEnd >= 0) headText = text.slice(0, headEnd);
				}
				return { bodyTooLarge: true, bytesRead, text, headText, headCapExceeded };
			}
			if (!retaining && !readFullBody && bytesRead > maxBytes) {
				throw createHeadSizeLimitError(maxBytes);
			}
			const previousLength = text.length;
			text += decoder.decode(value, { stream: true });
			if (readFullBody && !retaining) continue;
			if (headText !== undefined || headCapExceeded) continue;
			const headEnd = findHeadEnd(text, previousLength);
			if (headEnd < 0) continue;
			if (retaining) {
				headText = text.slice(0, headEnd);
				continue;
			}
			text = text.slice(0, headEnd);
			await reader.cancel();
			break;
		}
		text += decoder.decode();
		if (retaining && headText === undefined && !headCapExceeded) {
			const headEnd = findHeadEnd(text, 0);
			if (headEnd >= 0) headText = text.slice(0, headEnd);
		}
		return { bodyTooLarge: false, bytesRead, text, headText, headCapExceeded };
	} finally {
		reader.releaseLock();
	}
}

export function parseOpenGraphHead(headHtml: string, finalUrl: string): OpenGraphMetadata {
	const meta = new Map<string, string>();
	for (const tag of headHtml.match(/<meta\b[^>]*>/gi) ?? []) {
		const attrs = parseTagAttributes(tag);
		const key = (attrs.get('property') ?? attrs.get('name') ?? '').toLowerCase();
		const content = attrs.get('content') ?? '';
		if (key && content) {
			meta.set(key, decodeHtmlEntities(content.trim()));
		}
	}
	const title = decodeHtmlEntities(
		(headHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim()
	);
	return {
		...readAllTags(headHtml),
		description:
			meta.get('og:description') ??
			meta.get('twitter:description') ??
			meta.get('description') ??
			'',
		image: absolutizeUrl(meta.get('og:image') ?? meta.get('twitter:image') ?? '', finalUrl),
		title: meta.get('og:title') ?? meta.get('twitter:title') ?? title,
		type: meta.get('og:type') ?? '',
		url: absolutizeUrl(meta.get('og:url') ?? '', finalUrl),
	};
}

function readAllTags(headHtml: string): Pick<OpenGraphMetadata, 'allTags'> {
	const allTags = new Map<string, string>();
	const headTags =
		headHtml.match(/<meta\b[^>]*>|<link\b[^>]*>|<title\b[^>]*>[\s\S]*?<\/title\s*>/gi) ?? [];
	for (const tag of headTags) {
		if (/^<meta\b/i.test(tag)) {
			const attrs = parseTagAttributes(tag);
			const key = [attrs.get('property'), attrs.get('name')]
				.filter((value): value is string => Boolean(value))
				.map((value) => value.trim().toLowerCase())
				.find((value) => value === 'description' || ALL_TAG_META_KEY.test(value));
			addAllTag(allTags, key, attrs.get('content'));
			continue;
		}
		if (/^<link\b/i.test(tag)) {
			const attrs = parseTagAttributes(tag);
			const rel = attrs.get('rel')?.toLowerCase().split(/\s+/) ?? [];
			if (rel.includes('canonical')) {
				addAllTag(allTags, 'canonical', attrs.get('href'));
			}
			continue;
		}
		const title = tag
			.replace(/^<title\b[^>]*>/i, '')
			.replace(/<\/title\s*>$/i, '')
			.replace(/\s+/g, ' ')
			.trim();
		addAllTag(allTags, 'title', title);
	}
	if (allTags.size === 0) {
		return {};
	}
	return { allTags: Object.fromEntries(allTags) };
}

function addAllTag(
	allTags: Map<string, string>,
	key: string | undefined,
	rawValue: string | undefined
) {
	if (!(key && rawValue) || allTags.has(key) || allTags.size >= MAX_ALL_TAG_KEYS) {
		return;
	}
	const value = decodeHtmlEntities(rawValue.trim());
	if (!value) {
		return;
	}
	allTags.set(key, value.slice(0, MAX_ALL_TAG_VALUE_LENGTH));
}

function parseTagAttributes(tag: string) {
	const attrs = new Map<string, string>();
	const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;
	for (const match of tag.matchAll(attrRegex)) {
		attrs.set(match[1]?.toLowerCase() ?? '', match[2] ?? match[3] ?? match[4] ?? '');
	}
	return attrs;
}

function hasMetadata(metadata: OpenGraphMetadata) {
	return Boolean(
		metadata.title || metadata.description || metadata.image || metadata.type || metadata.url
	);
}

function absolutizeUrl(value: string, baseUrl: string) {
	if (!value) {
		return '';
	}
	try {
		const absolute = new URL(value);
		if (absolute.protocol === 'http:' || absolute.protocol === 'https:') {
			return value;
		}
	} catch {
		// Relative URL; resolve it against the fetched page below.
	}
	try {
		return new URL(value, baseUrl).href;
	} catch {
		return value;
	}
}

function blockedResult(
	rawUrl: string,
	finalUrl: string,
	httpStatus: number | null,
	reason: string,
	redirects: number,
	bytesRead: number
): OpenGraphFetchResult {
	return {
		bytesRead,
		finalUrl,
		httpStatus,
		metadata: emptyMetadata(),
		redirects,
		reason,
		status: 'blocked',
		url: rawUrl,
	};
}

function deadUrlResult(
	rawUrl: string,
	finalUrl: string,
	httpStatus: number | null,
	redirects: number
): OpenGraphFetchResult {
	return {
		bytesRead: 0,
		finalUrl,
		httpStatus,
		metadata: emptyMetadata(),
		redirects,
		reason: 'dead_url',
		status: 'dead_url',
		url: rawUrl,
	};
}

function emptyMetadata(): OpenGraphMetadata {
	return {
		description: '',
		image: '',
		title: '',
		type: '',
		url: '',
	};
}

function unsafeUrlReason(url: URL, options: OpenGraphFetchOptions) {
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return 'invalid_scheme';
	}
	const hostname = stripIpv6Brackets(url.hostname.toLowerCase());
	if (
		options.allowPrivateNetwork ||
		(options.allowLoopbackFixtures === true && isLoopbackFixtureUrl(url.href))
	) {
		return '';
	}
	if (isInternalHostname(hostname) || isPrivateIpLiteral(hostname)) {
		return 'private_address';
	}
	return '';
}

function isInternalHostname(hostname: string) {
	return (
		hostname === 'localhost' ||
		hostname.endsWith('.localhost') ||
		hostname.endsWith('.local') ||
		hostname.endsWith('.internal') ||
		hostname.endsWith('.home') ||
		hostname.endsWith('.lan') ||
		!hostname.includes('.')
	);
}

function isPrivateIpLiteral(hostname: string) {
	const ipVersion = ipVersionOf(hostname);
	if (ipVersion === 4) {
		const parts = hostname.split('.').map((part) => Number(part));
		const [a = 0, b = 0] = parts;
		return (
			a === 0 ||
			a === 10 ||
			a === 127 ||
			(a === 169 && b === 254) ||
			(a === 172 && b >= 16 && b <= 31) ||
			(a === 192 && b === 168) ||
			(a === 100 && b >= 64 && b <= 127)
		);
	}
	if (ipVersion === 6) {
		const normalized = hostname.toLowerCase();
		return (
			normalized === '::' ||
			normalized === '::1' ||
			normalized.startsWith('fc') ||
			normalized.startsWith('fd') ||
			normalized.startsWith('fe8') ||
			normalized.startsWith('fe9') ||
			normalized.startsWith('fea') ||
			normalized.startsWith('feb')
		);
	}
	return false;
}

function ipVersionOf(hostname: string): 0 | 4 | 6 {
	if (hostname.includes(':')) return 6;
	const parts = hostname.split('.');
	if (
		parts.length === 4 &&
		parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
	) {
		return 4;
	}
	return 0;
}

function stripIpv6Brackets(hostname: string) {
	return hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
}

function normalizeComparableHostname(hostname: string) {
	const normalized = stripIpv6Brackets(hostname.toLowerCase());
	return normalized.startsWith('www.') ? normalized.slice('www.'.length) : normalized;
}

export function normalizeFetchError(error: unknown): OpenGraphFetchError {
	if (error instanceof OpenGraphFetchError) {
		return error;
	}
	if (isDnsNotFoundError(error)) {
		return new OpenGraphFetchError({
			code: 'dns_not_found',
			message: 'OpenGraph DNS lookup found no public address.',
			originalError: error,
			retryable: false,
		});
	}
	if (error instanceof Error) {
		const message = error.message.toLowerCase();
		if (error.name === 'AbortError' || message.includes('aborted')) {
			return new OpenGraphFetchError({
				code: 'timeout',
				message: 'OpenGraph fetch timed out.',
				originalError: error,
				retryable: true,
			});
		}
		return new OpenGraphFetchError({
			code: 'network',
			message: error.message,
			originalError: error,
			retryable: true,
		});
	}
	return new OpenGraphFetchError({
		code: 'network',
		message: String(error),
		originalError: error,
		retryable: true,
	});
}

function decodeHtmlEntities(value: string) {
	return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, raw: string) => {
		const lower = raw.toLowerCase();
		if (lower.startsWith('#x')) {
			const codePoint = Number.parseInt(lower.slice(2), 16);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
		}
		if (lower.startsWith('#')) {
			const codePoint = Number.parseInt(lower.slice(1), 10);
			return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
		}
		return (
			{
				amp: '&',
				apos: "'",
				gt: '>',
				lt: '<',
				nbsp: ' ',
				quot: '"',
			}[lower] ?? entity
		);
	});
}
