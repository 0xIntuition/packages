import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { equivalentTo as predicateSpec } from '../generated/specs/equivalentTo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const equivalentToSpec = spec;
export const equivalentTo = predicate;
export const equivalentToId = id;
export const equivalentToAtomData = atomData;

export default predicate;
