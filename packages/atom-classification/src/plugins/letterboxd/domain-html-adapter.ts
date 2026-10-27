import {
	isAllowedLetterboxdPageUrl,
	parseLetterboxdPage,
	parseLetterboxdUrl,
} from '@0xintuition/pipeline-runtime/letterboxd-page';
import {
	type DomainHtmlFetchFailure,
	type DomainHtmlFetchLike,
	type DomainHtmlResolveHostname,
	fetchHtmlDocumentResult,
	resolveDomainHtmlFetch,
} from '../shared/domain-html/fetch';
import {
	createPlatformStageDiagnostic,
	createPlatformStageOutcome,
	PLATFORM_STAGE_MISS,
	type PlatformStageAdapter,
} from '../shared/platform';
import { buildLetterboxdResolverAtom } from './atom';

export type LetterboxdDomainHtmlAdapterOptions = {
	fetch?: DomainHtmlFetchLike;
	resolveHostname?: DomainHtmlResolveHostname;
};

export type LetterboxdDomainHtmlAdapter = PlatformStageAdapter;

export function createLetterboxdDomainHtmlAdapter(
	options: LetterboxdDomainHtmlAdapterOptions = {}
): LetterboxdDomainHtmlAdapter {
	const fetcher = resolveDomainHtmlFetch(options.fetch);
	return async ({ runtime, domain, classification, canonicalUrl }) => {
		if (runtime !== 'server' || domain !== 'letterboxd' || classification.subtype !== 'film') {
			return PLATFORM_STAGE_MISS;
		}

		const htmlResult = await fetchHtmlDocumentResult(fetcher, {
			url: canonicalUrl,
			acceptFinalUrl: isAllowedLetterboxdPageUrl,
			bodyLimitReason: 'body_limit',
			deadlineAtMs: Date.now() + 5_000,
			rejectedRedirectReason: 'redirect_rejected',
			resolveHostname: options.resolveHostname,
		});
		if (htmlResult.ok === false) {
			return createLetterboxdTerminalFetchOutcome(htmlResult.failure, canonicalUrl);
		}

		const page = parseLetterboxdPage(htmlResult.value, canonicalUrl);
		if (page.identity.status === 'identity_conflict') {
			return createPlatformStageOutcome(
				null,
				[
					createPlatformStageDiagnostic(
						'identity_conflict',
						'unavailable:identity_conflict Letterboxd identity sources disagree'
					),
				],
				{ availability: 'unavailable', reason: 'identity_conflict', terminal: true }
			);
		}
		if (!page.title) {
			return createPlatformStageOutcome(
				null,
				[
					createPlatformStageDiagnostic(
						'parse_failure',
						'degraded:metadata_missing Letterboxd returned no publishable title'
					),
				],
				{ availability: 'degraded', reason: 'parse_failure', terminal: true }
			);
		}

		const parsedCanonical = parseLetterboxdUrl(page.canonicalUrl);
		const slug = parsedCanonical?.slug;
		if (page.identity.status !== 'resolved' && !slug) {
			return createPlatformStageOutcome(
				null,
				[
					createPlatformStageDiagnostic(
						'parse_failure',
						'unavailable:identity_unknown Letterboxd bridge did not expose typed identity or a film canonical URL'
					),
				],
				{ availability: 'unavailable', reason: 'parse_failure', terminal: true }
			);
		}

		return buildLetterboxdResolverAtom(page) ?? PLATFORM_STAGE_MISS;
	};
}

export function createLetterboxdTerminalFetchOutcome(
	failure: DomainHtmlFetchFailure,
	canonicalUrl: string
) {
	const blocked =
		failure.status === 401 ||
		failure.status === 403 ||
		failure.status === 429 ||
		failure.status === 451;
	const bridgeNotFound =
		failure.status === 404 && Boolean(parseLetterboxdUrl(canonicalUrl)?.tmdbId);
	const unavailable = blocked || bridgeNotFound || failure.status === 404;
	const availability = unavailable ? 'unavailable' : 'degraded';
	return createPlatformStageOutcome(
		null,
		[
			createPlatformStageDiagnostic(
				failure.kind,
				`${availability}:${failure.reason}${
					failure.status === undefined ? '' : ` HTTP ${failure.status}`
				}${failure.retryAfterMs === undefined ? '' : ` (retryAfterMs=${failure.retryAfterMs})`}`
			),
		],
		{ availability, reason: failure.kind, terminal: true }
	);
}
