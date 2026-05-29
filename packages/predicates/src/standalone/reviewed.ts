import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { reviewed as predicateSpec } from '../generated/specs/reviewed.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const reviewedSpec = spec;
export const reviewed = predicate;
export const reviewedId = id;
export const reviewedAtomData = atomData;

export default predicate;
