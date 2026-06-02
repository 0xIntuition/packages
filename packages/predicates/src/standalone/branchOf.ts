import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { branchOf as predicateSpec } from '../generated/specs/branchOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const branchOfSpec = spec;
export const branchOf = predicate;
export const branchOfId = id;
export const branchOfAtomData = atomData;

export default predicate;
