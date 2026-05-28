import {
	getPredicateAtomData,
	getPredicateId,
	getPredicateRecord,
	type PredicateKey,
} from '../predicates.js';

export const key = 'availableOn' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
	throw new Error('Missing generated predicate record for "availableOn".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);
export const availableOn = predicate;
export const availableOnId = id;
export const availableOnAtomData = atomData;

export default predicate;
