import {
	isAllowedLetterboxdPageUrl,
	parseLetterboxdPage,
} from '@0xintuition/pipeline-runtime/letterboxd-page';
import {
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
import { createLetterboxdTerminalFetchOutcome } from './domain-html-adapter';

export type LetterboxdOpenGraphAdapterOptions = {
	fetch?: DomainHtmlFetchLike;
	headers?: Record<string, string>;
	resolveHostname?: DomainHtmlResolveHostname;
};

export type LetterboxdOpenGraphAdapter = PlatformStageAdapter;

export function createLetterboxdOpenGraphAdapter(
	options: LetterboxdOpenGraphAdapterOptions = {}
): LetterboxdOpenGraphAdapter {
	const fetcher = resolveDomainHtmlFetch(options.fetch);
	return async ({ runtime, domain, classification, canonicalUrl }) => {
		if (runtime !== 'server' || domain !== 'letterboxd' || classification.subtype !== 'film') {
			return PLATFORM_STAGE_MISS;
		}
		const result = await fetchHtmlDocumentResult(fetcher, {
			url: canonicalUrl,
			acceptFinalUrl: isAllowedLetterboxdPageUrl,
			bodyLimitReason: 'body_limit',
			deadlineAtMs: Date.now() + 5_000,
			rejectedRedirectReason: 'redirect_rejected',
			headers: options.headers,
			resolveHostname: options.resolveHostname,
		});
		if (result.ok === false) {
			return createLetterboxdTerminalFetchOutcome(result.failure, canonicalUrl);
		}
		const page = parseLetterboxdPage(result.value, canonicalUrl);
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
		return buildLetterboxdResolverAtom(page) ?? PLATFORM_STAGE_MISS;
	};
}
