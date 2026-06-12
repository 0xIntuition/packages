import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { reviewedBy as predicateSpec } from '../generated/specs/reviewedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const reviewedBySpec = spec;
export const reviewedBy = predicate;
export const reviewedById = id;
export const reviewedByAtomData = atomData;

export default predicate;
