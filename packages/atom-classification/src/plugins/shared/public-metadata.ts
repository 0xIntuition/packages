import type { ResolverAtom } from '../../plugins';
import type {
	ClassificationCanonicalFieldPolicyMap,
	ClassificationSourceFamily,
} from '../../types';
import {
	isPlatformStageMiss,
	PLATFORM_STAGE_MISS,
	type PlatformDomain,
	type PlatformStageAdapter,
	type PlatformStageInput,
	type PlatformStageMiss,
} from './platform';

export type PublicMetadataSourceResult = {
	atom: ResolverAtom;
	fieldPolicies?: ClassificationCanonicalFieldPolicyMap;
};

export type PublicMetadataSource = {
	id: string;
	family: ClassificationSourceFamily;
	resolve:
		| ((
				input: PlatformStageInput
		  ) => PublicMetadataSourceResult | PlatformStageMiss | null | undefined)
		| ((
				input: PlatformStageInput
		  ) => Promise<PublicMetadataSourceResult | PlatformStageMiss | null | undefined>);
};

export type PublicMetadataPlatformAdapterOptions = {
	domains?: PlatformDomain[];
	sources: PublicMetadataSource[];
};

export type PublicMetadataPlatformAdapter = PlatformStageAdapter;

export function createPublicMetadataPlatformAdapter(
	options: PublicMetadataPlatformAdapterOptions
): PublicMetadataPlatformAdapter {
	return async (input) => {
		if (input.runtime !== 'server') {
			return PLATFORM_STAGE_MISS;
		}

		if (options.domains && !options.domains.includes(input.domain)) {
			return PLATFORM_STAGE_MISS;
		}

		for (const source of options.sources) {
			const result = await Promise.resolve(source.resolve(input));
			if (isPlatformStageMiss(result) || !result?.atom) {
				continue;
			}

			return {
				...result.atom,
				metadata: {
					...(result.atom.metadata ?? {}),
					sourceFamily: source.family,
					fieldPolicies: result.fieldPolicies,
					publicSourceId: source.id,
				},
			};
		}

		return PLATFORM_STAGE_MISS;
	};
}
