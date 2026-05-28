import {
	getPredicateAtomData,
	getPredicateId,
	getPredicateRecord,
	type PredicateKey,
} from '../predicates.js';

export const key = 'hasCategory' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
	throw new Error('Missing generated predicate record for "hasCategory".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);
export const hasCategory = predicate;
export const hasCategoryId = id;
export const hasCategoryAtomData = atomData;

export default predicate;
