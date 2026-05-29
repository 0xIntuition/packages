import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { inspiredBy as predicateSpec } from '../generated/specs/inspiredBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const inspiredBySpec = spec;
export const inspiredBy = predicate;
export const inspiredById = id;
export const inspiredByAtomData = atomData;

export default predicate;
