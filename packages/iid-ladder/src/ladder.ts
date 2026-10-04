import {
	formatIntuitionId,
	isActiveWdEntitySchemaSlug,
	parseIntuitionId,
	SCHEME_NAMES,
	SCHEMES,
	type SchemeName,
	validateIntuitionId,
} from '@0xintuition/iid';
import { PROVIDER_PREFIX_MAPPINGS } from './provider-prefixes.js';

export type LadderInput = {
	/** Music and podcast policy uses plain QIDs; active typed bindings remain opt-in. */
	allowPlainWd?: boolean;
	strongIdentifiers?: Readonly<Record<string, string>>;
	/** Optional strongest-first scheme order for a classification-specific ladder. */
	strongIdentifierOrder?: readonly string[];
	providerCanonicalId?: string;
	canonicalUrl?: string;
};

export type LadderResult =
	| { iid: string; rung: 'strong' | 'handle' | 'url' }
	| {
			iid: null;
			fallback: 'envelope';
			reason:
				| 'invalid-handle'
				| 'url-over-cap'
				| 'no-identifier'
				| 'unmapped-provider'
				| 'unregistered-provider';
	  };

export const IID_VALUE_MAX_LENGTH = 220;

const STRONG_SCHEMES = SCHEME_NAMES.filter(
	(scheme): scheme is Exclude<SchemeName, 'gen1' | 'url'> => scheme !== 'gen1' && scheme !== 'url'
);
const STRONG_SCHEME_SET = new Set<string>(STRONG_SCHEMES);
const WIKIDATA_IDENTIFIER_KEYS = new Set([
	'identifier',
	'qid',
	'wd',
	'wikibaseItem',
	'wikidata',
	'wikidataId',
	'wikidata_id',
]);

type HandleProjection =
	| { status: 'mapped'; iid: string }
	| { status: 'invalid' }
	| { status: 'unmapped' }
	| { status: 'unregistered' };

export function projectIdentifierLadder(input: LadderInput): LadderResult {
	const providerStrong =
		input.strongIdentifierOrder && input.providerCanonicalId
			? strongProviderCandidate(input.providerCanonicalId, input.allowPlainWd)
			: undefined;
	const directStrongIid = selectStrongIdentifier(
		input.strongIdentifiers,
		input.strongIdentifierOrder,
		input.allowPlainWd
	);
	const strongIid = providerStrong
		? selectStrongIdentifier(
				{
					...(input.strongIdentifiers ?? {}),
					[providerStrong.scheme]: providerStrong.value,
				},
				input.strongIdentifierOrder,
				input.allowPlainWd
			)
		: directStrongIid;
	if (strongIid) {
		return {
			iid: strongIid,
			rung:
				providerStrong?.iid === strongIid && directStrongIid !== strongIid
					? providerStrong.rung
					: 'strong',
		};
	}

	let canonicalUrl = input.canonicalUrl;
	const providerCanonicalId = input.providerCanonicalId;
	if (providerCanonicalId?.startsWith('int:')) {
		return validateIntuitionId(providerCanonicalId) &&
			isMintableWdIid(providerCanonicalId, input.allowPlainWd)
			? { iid: providerCanonicalId, rung: 'strong' }
			: { fallback: 'envelope', iid: null, reason: 'invalid-handle' };
	}
	if (providerCanonicalId && isHttpUrl(providerCanonicalId)) {
		canonicalUrl ||= providerCanonicalId;
	} else if (providerCanonicalId) {
		const handle = projectProviderHandle(providerCanonicalId);
		if (handle.status === 'mapped') {
			return { iid: handle.iid, rung: 'handle' };
		}
		if (handle.status === 'invalid') {
			return { fallback: 'envelope', iid: null, reason: 'invalid-handle' };
		}
		return {
			fallback: 'envelope',
			iid: null,
			reason: handle.status === 'unregistered' ? 'unregistered-provider' : 'unmapped-provider',
		};
	}

	if (!canonicalUrl) {
		return { fallback: 'envelope', iid: null, reason: 'no-identifier' };
	}
	if (canonicalUrl.length > IID_VALUE_MAX_LENGTH) {
		return { fallback: 'envelope', iid: null, reason: 'url-over-cap' };
	}

	const iid = formatIntuitionId('url', canonicalUrl);
	return validateIntuitionId(iid)
		? { iid, rung: 'url' }
		: { fallback: 'envelope', iid: null, reason: 'no-identifier' };
}

function strongProviderCandidate(
	providerCanonicalId: string,
	allowPlainWd?: boolean
): { iid: string; rung: 'handle' | 'strong'; scheme: SchemeName; value: string } | undefined {
	const projection = providerCanonicalId.startsWith('int:')
		? validateIntuitionId(providerCanonicalId) && isMintableWdIid(providerCanonicalId, allowPlainWd)
			? { iid: providerCanonicalId, status: 'mapped' as const }
			: { status: 'invalid' as const }
		: projectProviderHandle(providerCanonicalId);
	if (projection.status !== 'mapped') {
		return undefined;
	}
	const parsed = parseIntuitionId(projection.iid);
	return parsed && parsed.scheme !== 'gen1' && parsed.scheme !== 'url'
		? {
				iid: projection.iid,
				rung: providerCanonicalId.startsWith('int:') ? 'strong' : 'handle',
				scheme: parsed.scheme,
				value: parsed.value,
			}
		: undefined;
}

function selectStrongIdentifier(
	strongIdentifiers: LadderInput['strongIdentifiers'],
	strongIdentifierOrder: LadderInput['strongIdentifierOrder'],
	allowPlainWd?: boolean
): string | undefined {
	if (!strongIdentifiers) {
		return undefined;
	}

	const rawWdSlug = strongIdentifiers.wdSlug;
	const wdSlug = rawWdSlug && isActiveWdEntitySchemaSlug(rawWdSlug) ? rawWdSlug : undefined;
	const wdSlugConflict =
		(Object.hasOwn(strongIdentifiers, 'wdSlug') && !wdSlug) ||
		hasWdSlugConflict(strongIdentifiers, wdSlug);
	const candidates = new Map<SchemeName, string[]>();
	for (const [key, value] of Object.entries(strongIdentifiers)) {
		const scheme = strongSchemeForEntry(key, value);
		if (!scheme || (scheme === 'wd' && wdSlugConflict)) {
			continue;
		}

		const canonical = SCHEMES[scheme].canonicalize(value);
		if (!canonical) continue;
		const canonicalValue =
			scheme === 'wd' && !canonical.includes(':') && wdSlug ? `${wdSlug}:${canonical}` : canonical;
		const iid = formatIntuitionId(scheme, canonicalValue);
		if (!validateIntuitionId(iid)) {
			continue;
		}
		if (!isMintableWdIid(iid, allowPlainWd)) {
			continue;
		}
		const schemeCandidates = candidates.get(scheme) ?? [];
		schemeCandidates.push(iid);
		candidates.set(scheme, schemeCandidates);
	}

	const orderedSchemes = strongSchemeOrder(strongIdentifierOrder);
	for (const scheme of orderedSchemes) {
		const schemeCandidates = candidates.get(scheme);
		if (schemeCandidates && schemeCandidates.length > 0) {
			return schemeCandidates.sort(compareCodepoints)[0];
		}
	}
	return undefined;
}

function hasWdSlugConflict(
	strongIdentifiers: Readonly<Record<string, string>>,
	wdSlug: string | undefined
) {
	const qids = new Set<string>();
	const typedValues = new Set<string>();
	for (const [key, value] of Object.entries(strongIdentifiers)) {
		if (!WIKIDATA_IDENTIFIER_KEYS.has(key)) {
			continue;
		}
		const canonical = SCHEMES.wd.canonicalize(value);
		if (!canonical) {
			continue;
		}
		const separator = canonical.indexOf(':');
		const qid = separator === -1 ? canonical : canonical.slice(separator + 1);
		qids.add(qid);
		if (separator === -1) {
			continue;
		}
		typedValues.add(canonical);
		if (wdSlug && canonical.slice(0, separator) !== wdSlug) {
			return true;
		}
	}
	return qids.size > 1 || typedValues.size > 1;
}

function isMintableWdIid(iid: string, allowPlainWd = false): boolean {
	const parsed = parseIntuitionId(iid);

	if (parsed?.scheme !== 'wd') {
		return true;
	}

	const separator = parsed.value.indexOf(':');
	if (separator === -1) return allowPlainWd && /^Q[1-9]\d*$/u.test(parsed.value);
	return separator > 0 && isActiveWdEntitySchemaSlug(parsed.value.slice(0, separator));
}

function strongSchemeOrder(order: readonly string[] | undefined): readonly SchemeName[] {
	if (!order) return STRONG_SCHEMES;
	return [
		...new Set(order.filter((scheme): scheme is SchemeName => STRONG_SCHEME_SET.has(scheme))),
	];
}

function strongSchemeForEntry(key: string, value: string): SchemeName | undefined {
	if (STRONG_SCHEME_SET.has(key)) return key as SchemeName;
	if (WIKIDATA_IDENTIFIER_KEYS.has(key) && /^Q[1-9]\d*$/.test(value)) return 'wd';
	return undefined;
}

function projectProviderHandle(providerCanonicalId: string): HandleProjection {
	for (const mapping of PROVIDER_PREFIX_MAPPINGS) {
		if (!providerCanonicalId.startsWith(mapping.providerPrefix)) continue;

		const value = providerCanonicalId.slice(mapping.providerPrefix.length);
		if (!value) return { status: 'invalid' };

		if (mapping.kind === 'provider-local') {
			return value.trim() === value && !/\s/.test(value) && mapping.valuePattern.test(value)
				? { status: 'unregistered' }
				: { status: 'invalid' };
		}

		const providerValue =
			'stripLeadingAt' in mapping && mapping.stripLeadingAt ? value.replace(/^@/, '') : value;
		const canonicalValue = SCHEMES[mapping.scheme].canonicalize(
			`${mapping.schemeValuePrefix}${providerValue}`
		);
		if (!canonicalValue) return { status: 'invalid' };

		const iid = formatIntuitionId(mapping.scheme, canonicalValue);
		return validateIntuitionId(iid) && isMintableWdIid(iid)
			? { iid, status: 'mapped' }
			: { status: 'invalid' };
	}
	return { status: 'unmapped' };
}

function compareCodepoints(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function isHttpUrl(value: string): boolean {
	return value.startsWith('https://') || value.startsWith('http://');
}
