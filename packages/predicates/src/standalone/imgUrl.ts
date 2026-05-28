import {
	getPredicateAtomData,
	getPredicateId,
	getPredicateRecord,
	type PredicateKey,
} from '../predicates.js';

export const key = 'imgUrl' satisfies PredicateKey;
const predicateRecord = getPredicateRecord(key);

if (!predicateRecord) {
	throw new Error('Missing generated predicate record for "imgUrl".');
}

export const predicate = predicateRecord;
export const id = getPredicateId(key);
export const atomData = getPredicateAtomData(key);
export const imgUrl = predicate;
export const imgUrlId = id;
export const imgUrlAtomData = atomData;

export default predicate;
