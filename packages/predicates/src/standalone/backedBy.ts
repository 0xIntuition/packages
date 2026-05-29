import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { backedBy as predicateSpec } from '../generated/specs/backedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const backedBySpec = spec;
export const backedBy = predicate;
export const backedById = id;
export const backedByAtomData = atomData;

export default predicate;
