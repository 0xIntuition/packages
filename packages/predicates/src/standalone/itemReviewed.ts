import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { itemReviewed as predicateSpec } from '../generated/specs/itemReviewed.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const itemReviewedSpec = spec;
export const itemReviewed = predicate;
export const itemReviewedId = id;
export const itemReviewedAtomData = atomData;

export default predicate;
