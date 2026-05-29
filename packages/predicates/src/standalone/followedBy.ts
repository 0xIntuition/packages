import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { followedBy as predicateSpec } from '../generated/specs/followedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const followedBySpec = spec;
export const followedBy = predicate;
export const followedById = id;
export const followedByAtomData = atomData;

export default predicate;
