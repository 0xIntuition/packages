import { readBoundedResponseText } from '@0xintuition/pipeline-runtime/bounded-text';
import {
	executeLetterboxdHostRequest,
	letterboxdRetryAfterMs,
} from '@0xintuition/pipeline-runtime/letterboxd';
import {
	isAllowedLetterboxdPageUrl,
	type ParsedLetterboxdPage,
	parseLetterboxdPage,
	parseLetterboxdUrl,
} from '@0xintuition/pipeline-runtime/letterboxd-page';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import {
	BROWSER_FETCH_HEADERS,
	type FetchLike,
	fetchProviderHttpResponse,
	ProviderHttpError,
	parseRetryAfterMs,
} from '../__shared__/http';
import { getRequestUrl } from '../__shared__/request';
import { letterboxdDataSchema } from './schema';

type CreateLetterboxdPluginOptions = {
	fetch?: FetchLike;
	now?: () => number;
	priority?: number;
	TTL?: number;
};

const MAX_REDIRECTS = 3;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const REQUEST_DEADLINE_MS = 5_000;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function createLetterboxdPlugin(
	options: CreateLetterboxdPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return defineEnrichmentPlugin({
		id: 'letterboxd',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['letterboxd'],
		priority: options.priority ?? 54,
		TTL: options.TTL ?? 43_200,

		supports(request: EnrichmentRequest) {
			return !!resolveLetterboxdTarget(request);
		},

		async enrich(request, ctx) {
			const target = resolveLetterboxdTarget(request);
			if (!target) {
				return [];
			}

			const { finalUrl, html } = await fetchLetterboxdHtml(
				fetcher,
				target.canonicalUrl,
				ctx.signal,
				options.now
			);
			const page = parseLetterboxdPage(html, target.canonicalUrl);
			if (page.identity.status === 'identity_conflict') {
				throw acquisitionError('identity_conflict', 409, target.canonicalUrl);
			}
			if (!page.title) {
				return [];
			}
			const sourceUrl = parseLetterboxdUrl(page.canonicalUrl)?.canonicalUrl;
			if (!sourceUrl || !isAllowedLetterboxdPageUrl(finalUrl)) {
				throw acquisitionError('redirect_rejected', 310, finalUrl);
			}
			const ratingValue = numberValue(page.aggregateRating?.ratingValue);
			const ratingCount = numberValue(page.aggregateRating?.ratingCount);
			const tmdbId = page.identity.status === 'resolved' ? page.identity.tmdbId : undefined;

			return [
				{
					artifact_type: 'letterboxd',
					data: letterboxdDataSchema.parse({
						title: page.title,
						...(page.description ? { description: page.description } : {}),
						...(page.image ? { image: page.image } : {}),
						...(page.year ? { year: page.year } : {}),
						...(page.directors.length > 0 ? { directors: page.directors } : {}),
						...(ratingValue !== undefined ? { rating: ratingValue, bestRating: 5 } : {}),
						...(ratingCount !== undefined ? { ratingCount: Math.trunc(ratingCount) } : {}),
						...(tmdbId ? { tmdbId } : {}),
					}),
					meta: {
						pluginId: 'letterboxd',
						provider: 'letterboxd',
						fetchedAt: ctx.now(),
						sourceUrl,
					},
				},
			];
		},
	});
}

function resolveLetterboxdTarget(request: EnrichmentRequest) {
	const url = getRequestUrl(request);
	return url ? parseLetterboxdUrl(url) : undefined;
}

async function fetchLetterboxdHtml(
	fetcher: FetchLike,
	initialUrl: string,
	externalSignal: AbortSignal,
	now: () => number = Date.now
): Promise<{ finalUrl: string; html: string }> {
	const deadline = createDeadlineSignal(externalSignal, REQUEST_DEADLINE_MS, now);
	const visited = new Set<string>();
	let currentUrl = initialUrl;
	try {
		for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
			throwIfDeadlineExpired(deadline, currentUrl);
			if (visited.has(currentUrl)) {
				throw acquisitionError('redirect_exhausted', 310, currentUrl);
			}
			visited.add(currentUrl);
			if (!isAllowedLetterboxdPageUrl(currentUrl)) {
				throw acquisitionError('redirect_rejected', 310, currentUrl);
			}

			const hostname = new URL(currentUrl).hostname;
			const result = await executeLetterboxdHostRequest(
				hostname,
				async () => {
					throwIfDeadlineExpired(deadline, currentUrl);
					const response = await fetchProviderHttpResponse(fetcher, currentUrl, {
						headers: BROWSER_FETCH_HEADERS,
						redirect: 'manual',
						signal: deadline.signal,
					});
					throwIfDeadlineExpired(deadline, currentUrl);
					if (REDIRECT_STATUSES.has(response.status)) {
						return { kind: 'redirect' as const, response };
					}
					if (!response.ok) {
						throwIfDeadlineExpired(deadline, currentUrl);
						const body = await readBoundedResponseText(response, {
							maxBytes: MAX_RESPONSE_BYTES,
							signal: deadline.signal,
						});
						throw new ProviderHttpError({
							status: response.status,
							retryAfterMs: letterboxdRetryAfterMs(
								response.status,
								parseRetryAfterMs(response.headers.get('retry-after'))
							),
							url: currentUrl,
							bodyExcerpt: body.ok === false ? body.reason : body.value,
						});
					}
					throwIfDeadlineExpired(deadline, currentUrl);
					const body = await readBoundedResponseText(response, {
						maxBytes: MAX_RESPONSE_BYTES,
						signal: deadline.signal,
					});
					if (body.ok === false) {
						throw acquisitionError(body.reason, 200, currentUrl);
					}
					return { kind: 'complete' as const, html: body.value };
				},
				{ now: deadline.now, signal: deadline.signal }
			);

			if (result.kind === 'complete') {
				return { finalUrl: currentUrl, html: result.html };
			}
			const location = result.response.headers.get('location');
			throwIfDeadlineExpired(deadline, currentUrl);
			await result.response.body?.cancel();
			if (!location || redirectCount === MAX_REDIRECTS) {
				throw acquisitionError('redirect_exhausted', 310, currentUrl);
			}
			const destination = new URL(location, currentUrl).toString();
			if (!isAllowedLetterboxdPageUrl(destination)) {
				throw acquisitionError('redirect_rejected', 310, destination);
			}
			currentUrl = destination;
		}
		throw acquisitionError('redirect_exhausted', 310, currentUrl);
	} finally {
		deadline.cleanup();
	}
}

function createDeadlineSignal(externalSignal: AbortSignal, timeoutMs: number, now: () => number) {
	const controller = new AbortController();
	const deadlineAtMs = now() + timeoutMs;
	let timedOut = false;
	const markTimedOut = () => {
		timedOut = true;
		controller.abort(new Error('timeout'));
	};
	const onExternalAbort = () => controller.abort(externalSignal.reason);
	if (externalSignal.aborted) {
		onExternalAbort();
	} else {
		externalSignal.addEventListener('abort', onExternalAbort, { once: true });
	}
	const timeout = setTimeout(markTimedOut, timeoutMs);
	return {
		deadlineAtMs,
		didTimeout: () => timedOut,
		markTimedOut,
		now,
		signal: controller.signal,
		cleanup: () => {
			clearTimeout(timeout);
			externalSignal.removeEventListener('abort', onExternalAbort);
		},
	};
}

function throwIfDeadlineExpired(
	deadline: ReturnType<typeof createDeadlineSignal>,
	url: string
): void {
	if (deadline.deadlineAtMs - deadline.now() > 0) {
		return;
	}
	deadline.markTimedOut();
	throw acquisitionError('timeout', 408, url);
}

function acquisitionError(errorClass: string, status: number, url: string): ProviderHttpError {
	return new ProviderHttpError({
		errorClass,
		status,
		url,
		bodyExcerpt: '',
	});
}

function numberValue(value: unknown): number | undefined {
	const parsed =
		typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
	return Number.isFinite(parsed) ? parsed : undefined;
}

export { letterboxdDataSchema } from './schema';
export { parseLetterboxdPage };
export type { ParsedLetterboxdPage };
