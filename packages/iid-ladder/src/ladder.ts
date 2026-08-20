import {
	formatIntuitionId,
	SCHEME_NAMES,
	SCHEMES,
	type SchemeName,
	validateIntuitionId,
} from '@0xintuition/iid';
import { PROVIDER_PREFIX_MAPPINGS } from './provider-prefixes.js';

export type LadderInput = {
	strongIdentifiers?: Readonly<Record<string, string>>;
	/** Optional strongest-first scheme order. When present it is also an allowlist. */
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
	const strongIid = selectStrongIdentifier(input.strongIdentifiers, input.strongIdentifierOrder);
	if (strongIid) {
		return { iid: strongIid, rung: 'strong' };
	}

	let canonicalUrl = input.canonicalUrl;
	const providerCanonicalId = input.providerCanonicalId;
	if (providerCanonicalId?.startsWith('int:')) {
		return validateIntuitionId(providerCanonicalId)
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

function selectStrongIdentifier(
	strongIdentifiers: LadderInput['strongIdentifiers'],
	strongIdentifierOrder: LadderInput['strongIdentifierOrder']
): string | undefined {
	if (!strongIdentifiers) return undefined;

	const candidates = new Map<SchemeName, string[]>();
	for (const [key, value] of Object.entries(strongIdentifiers)) {
		const scheme = strongSchemeForEntry(key, value);
		if (!scheme) continue;

		const iid = formatIntuitionId(scheme, value);
		if (!validateIntuitionId(iid)) continue;
		const schemeCandidates = candidates.get(scheme) ?? [];
		schemeCandidates.push(iid);
		candidates.set(scheme, schemeCandidates);
	}

	for (const scheme of strongSchemeOrder(strongIdentifierOrder)) {
		const schemeCandidates = candidates.get(scheme);
		if (schemeCandidates?.length) return schemeCandidates.sort(compareCodepoints)[0];
	}
	return undefined;
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
		return validateIntuitionId(iid) ? { iid, status: 'mapped' } : { status: 'invalid' };
	}
	return { status: 'unmapped' };
}

function compareCodepoints(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function isHttpUrl(value: string): boolean {
	return value.startsWith('https://') || value.startsWith('http://');
}
