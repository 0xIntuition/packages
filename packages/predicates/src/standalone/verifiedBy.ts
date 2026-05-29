import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { verifiedBy as predicateSpec } from '../generated/specs/verifiedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const verifiedBySpec = spec;
export const verifiedBy = predicate;
export const verifiedById = id;
export const verifiedByAtomData = atomData;

export default predicate;
