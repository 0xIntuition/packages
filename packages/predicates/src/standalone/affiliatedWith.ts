import {
	getPredicateAtomData,
	getPredicateId,
	getPredicateRecord,
	type PredicateKey,
} from '../predicates.js';

export const key = 'affiliatedWith' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
	throw new Error('Missing generated predicate record for "affiliatedWith".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);
export const affiliatedWith = predicate;
export const affiliatedWithId = id;
export const affiliatedWithAtomData = atomData;

export default predicate;
