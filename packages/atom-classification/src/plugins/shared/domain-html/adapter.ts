import type { ResolverAtom } from '../../../plugins';
import type { ClassificationRuntime } from '../../../types';
import { toStringMaybe } from '../helpers';
import {
	createPlatformStageOutcome,
	isPlatformStageMiss,
	PLATFORM_STAGE_MISS,
	type PlatformDomain,
	type PlatformStageAdapter,
	type PlatformStageMiss,
} from '../platform';
import { type DomainHtmlFetchLike, resolveDomainHtmlFetch } from './fetch';

export type SequencedDomainHtmlSource = {
	id: string;
	resolve(input: {
		runtime: ClassificationRuntime;
		domain: PlatformDomain;
		subtype: string;
		classificationMeta: Record<string, unknown>;
		canonicalUrl: string;
		requestInput: string;
		fetcher: DomainHtmlFetchLike;
	}):
		| Promise<ResolverAtom | PlatformStageMiss | null | undefined>
		| ResolverAtom
		| PlatformStageMiss
		| null
		| undefined;
};

export function createSequencedDomainHtmlAdapter(input: {
	domain: PlatformDomain;
	subtypes: string[];
	fetch?: DomainHtmlFetchLike;
	sources: SequencedDomainHtmlSource[];
}): PlatformStageAdapter {
	return async ({ runtime, domain, classification, canonicalUrl, requestInput }) => {
		if (runtime !== 'server' || domain !== input.domain) {
			return PLATFORM_STAGE_MISS;
		}

		const subtype = toStringMaybe(classification.subtype);
		if (!subtype || !input.subtypes.includes(subtype)) {
			return PLATFORM_STAGE_MISS;
		}

		const fetcher = resolveDomainHtmlFetch(input.fetch);
		const diagnostics: unknown[] = [];

		// Sources are tried in a fixed order so domain-html remains deterministic.
		// The first source that can build an identity-safe atom wins.
		for (const source of input.sources) {
			try {
				const atom = await source.resolve({
					runtime,
					domain,
					subtype,
					classificationMeta: classification.meta,
					canonicalUrl,
					requestInput,
					fetcher,
				});
				if (isPlatformStageMiss(atom) || !atom) {
					continue;
				}

				return diagnostics.length > 0 ? createPlatformStageOutcome(atom, diagnostics) : atom;
			} catch (error) {
				diagnostics.push(error);
			}
		}

		return diagnostics.length > 0
			? createPlatformStageOutcome(null, diagnostics)
			: PLATFORM_STAGE_MISS;
	};
}
