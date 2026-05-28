import {
	getPredicateAtomData,
	getPredicateId,
	getPredicateRecord,
	type PredicateKey,
} from '../predicates.js';

export const key = 'partnerOf' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
	throw new Error('Missing generated predicate record for "partnerOf".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);
export const partnerOf = predicate;
export const partnerOfId = id;
export const partnerOfAtomData = atomData;

export default predicate;
