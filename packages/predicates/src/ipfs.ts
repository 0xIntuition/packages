import { calculateAtomId } from '@0xintuition/ids';
import { createIpfsUri } from './atom-data';
import { getPredicateAtomData, type PredicateKey } from './predicates';
import type {
	PredicateIpfsDocument,
	PredicateIpfsOptions,
	PredicateStorageStrategy,
} from './types';

export function buildPredicateIpfsDocument(
	name: string,
	options: PredicateIpfsOptions
): PredicateIpfsDocument {
	const alternateName = Object.entries(options.i18n)
		.filter(([locale]) => locale !== 'en')
		.map(([locale, forms]) => ({
			'@language': locale,
			'@value': forms.base,
		}));

	const additionalProperty: PredicateIpfsDocument['additionalProperty'] = [
		{
			'@type': 'PropertyValue',
			name: 'marketPattern',
			value: options.marketPattern,
		},
		{
			'@type': 'PropertyValue',
			name: 'conjugates',
			value: options.conjugates,
		},
		{
			'@type': 'PropertyValue',
			name: 'i18n',
			value: options.i18n,
		},
	];

	if (options.isTransitive) {
		additionalProperty.push({
			'@type': 'PropertyValue',
			name: 'isTransitive',
			value: true,
		});
	}

	if (options.isSymmetric) {
		additionalProperty.push({
			'@type': 'PropertyValue',
			name: 'isSymmetric',
			value: true,
		});
	}

	if (options.isHierarchical) {
		additionalProperty.push({
			'@type': 'PropertyValue',
			name: 'isHierarchical',
			value: true,
		});
	}

	if (options.inversePredicate) {
		additionalProperty.push({
			'@type': 'PropertyValue',
			name: 'inversePredicate',
			value: options.inversePredicate,
		});
	}

	const document: PredicateIpfsDocument = {
		'@context': 'https://schema.org/',
		'@type': 'DefinedTerm',
		name,
		description: options.description,
		inDefinedTermSet: options.inDefinedTermSet ?? 'https://intuition.systems/predicates',
		additionalProperty,
	};

	if (options.sameAs && options.sameAs.length > 0) {
		document.sameAs = options.sameAs;
	}

	if (alternateName.length > 0) {
		document.alternateName = alternateName;
	}

	return document;
}

export function getStrategyAtomData(
	key: PredicateKey,
	strategy: PredicateStorageStrategy = 'inline',
	cid?: string
) {
	if (strategy === 'inline') {
		return getPredicateAtomData(key);
	}

	if (!cid) {
		throw new Error(`CID required for the ipfs strategy (${key})`);
	}

	return createIpfsUri(cid);
}

export const buildPredicateIpfsAtomData = createIpfsUri;

export function computePredicateAtomId(
	key: PredicateKey,
	strategy: PredicateStorageStrategy = 'inline',
	cid?: string
) {
	return calculateAtomId(getStrategyAtomData(key, strategy, cid));
}
