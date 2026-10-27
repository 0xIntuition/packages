import { defineProvider, PAGE_OPERATION_SPEC } from './types';

/**
 * Every http(s) page enrichment fetches for its page plugins (opengraph and microdata) except
 * goodreads.com, which keeps its own `goodreads|page` series (ENG-17017). One shared fetch per run
 * (ENG-16980): the plugin that makes the request records `source=live`, the other `source=cache`.
 * Same spec as `goodreads|page` (`PAGE_OPERATION_SPEC`) plus two live reasons, and deliberately NO
 * host or plugin label: the series count is fixed however many sites are pasted. Outcomes: a fetched
 * page is a hit (`reason=no_metadata` when the plugin read nothing from it: the page was fetched all
 * the same); a 404, 410 or a host that does not exist (NXDOMAIN) is a miss with `reason=dead_url`; a
 * host that did not resolve for another reason, or did not answer, is `network`; 401/403/451 and a
 * WAF challenge are `blocked`. A refusal by our own policy (private address, internal name) is not
 * recorded. The extra reasons are live-only: `source=cache` events carry `none`.
 * Like goodreads, opengraph and microdata declare no engine `observability`: artifact-cache hits
 * record nothing here.
 */
export const webProvider = defineProvider({
	provider: 'web',
	operations: {
		page: {
			...PAGE_OPERATION_SPEC,
			// Visible without a host label: a fetched page the plugin read nothing from, and a dead URL.
			liveOutcomeReasons: { hit: ['no_metadata'], miss: ['dead_url'] },
		},
	},
	circuitHosts: [],
});
