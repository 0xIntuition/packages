import { PREDICATE_DEFINED_TERM_TYPE, PREDICATE_SCHEMA_CONTEXT } from '@0xintuition/ids';
import type { ParsedPredicateAtomData, PredicateAtomDocument } from './types';

const IPFS_URI_PREFIX = 'ipfs://';

export { PREDICATE_SCHEMA_CONTEXT, PREDICATE_DEFINED_TERM_TYPE };

export function isIpfsUri(value: string): value is `ipfs://${string}` {
	return value.startsWith(IPFS_URI_PREFIX) && value.length > IPFS_URI_PREFIX.length;
}

export function createIpfsUri(cidOrUri: string): `ipfs://${string}` {
	const normalized = cidOrUri.trim().replace(/^ipfs:\/\//, '');

	if (!normalized) {
		throw new Error('CID required to build an ipfs:// URI');
	}

	return `${IPFS_URI_PREFIX}${normalized}`;
}

export function isPredicateAtomDocument(value: unknown): value is PredicateAtomDocument {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<PredicateAtomDocument>;

	return (
		candidate['@context'] === PREDICATE_SCHEMA_CONTEXT &&
		candidate['@type'] === PREDICATE_DEFINED_TERM_TYPE &&
		typeof candidate.name === 'string' &&
		typeof candidate.description === 'string'
	);
}

export function parsePredicateAtomData(atomData: string): ParsedPredicateAtomData {
	const trimmed = atomData.trim();

	if (isIpfsUri(trimmed)) {
		return {
			kind: 'ipfs',
			value: trimmed,
		};
	}

	try {
		const parsed = JSON.parse(trimmed) as unknown;

		if (isPredicateAtomDocument(parsed)) {
			return {
				kind: 'inline',
				value: parsed,
			};
		}
	} catch {
		// Invalid JSON falls through to the canonical-format error below.
	}

	throw new Error(
		'Unsupported predicate atom data. Expected canonical DefinedTerm JSON or an ipfs:// URI.'
	);
}

export function getPredicateNameFromAtomData(atomData: string) {
	try {
		const parsed = parsePredicateAtomData(atomData);

		if (parsed.kind === 'inline') {
			return parsed.value.name;
		}

		return undefined;
	} catch {
		return undefined;
	}
}
