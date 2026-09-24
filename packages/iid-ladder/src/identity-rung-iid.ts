import { getScheme, isCanonicalNodeIid } from '@0xintuition/iid';
import { IDENTITY_CATEGORY_RUNG_POLICY, type IdentityRungToken } from './category-rungs.js';
import { projectIdentifierLadder } from './ladder.js';
import { PROVIDER_PREFIX_MAPPINGS } from './provider-prefixes.js';

const TOKENS = new Set<string>(Object.values(IDENTITY_CATEGORY_RUNG_POLICY).flat());

/** Converts descriptive aliases for matching only; does not select a primary IID. */
export function iidForIdentityRung(rung: IdentityRungToken, value: string): string | undefined {
	if (!TOKENS.has(rung) || typeof value !== 'string') return undefined;
	const [schemeName, subtype] = rung.split(':');
	if (!schemeName) return undefined;
	const mapping = PROVIDER_PREFIX_MAPPINGS.find((row) => row.providerPrefix === `${rung}:`);
	if (mapping?.kind === 'provider-local') {
		const result = projectIdentifierLadder({
			providerCanonicalId: `${mapping.providerPrefix}${value}`,
		});
		return result.iid && isCanonicalNodeIid(result.iid) ? result.iid : undefined;
	}
	const scheme = getScheme(schemeName);
	if (!scheme) return undefined;
	const prepared = mapping?.kind === 'registered' ? `${mapping.schemeValuePrefix}${value}` : value;
	const canonical = scheme.canonicalize(prepared);
	if (!canonical) return undefined;
	if (rung === 'imdb:title' && !canonical.startsWith('tt')) return undefined;
	if (rung === 'olid' && !/^OL\d+[MW]$/u.test(canonical)) return undefined;
	const result = projectIdentifierLadder({
		strongIdentifiers: {
			[schemeName]: canonical,
			...(schemeName === 'wd' && subtype ? { wdSlug: subtype } : {}),
		},
		strongIdentifierOrder: [schemeName],
	});
	return result.iid && isCanonicalNodeIid(result.iid) ? result.iid : undefined;
}
