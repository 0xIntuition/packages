import { defineProvider, ERROR_REASONS_WITHOUT_CIRCUIT, type ProviderOperationSpec } from './types';

/**
 * The enrichment `oembed` plugin's public endpoints (ENG-17019): one fixed operation per default
 * endpoint (`youtube`, `vimeo`, `twitter`). The operation is NEVER taken from the plugin's
 * `options.providers` ids, which are caller-supplied: an id outside this set records nothing, so
 * the label set stays fixed. The endpoints are unauthenticated, so there is no `auth_failed`.
 * A video that is private, deleted or not embeddable answers 401/403/404/410 and is a `miss`.
 *
 * Cache series: the engine's artifact cache absorbs a whole run, so a cached run is one `hit` of
 * the operation its URL selects (a failed or empty lookup throws, so it is never cached).
 */
const operation = (overrides: Partial<ProviderOperationSpec> = {}): ProviderOperationSpec => ({
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss'],
	errorReasons: ERROR_REASONS_WITHOUT_CIRCUIT,
	cacheOutcomes: ['hit'],
	...overrides,
});

export const oembedProvider = defineProvider({
	provider: 'oembed',
	operations: {
		youtube: operation(),
		vimeo: operation(),
		twitter: operation(),
	},
	circuitHosts: [],
});
