import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { musicBy as predicateSpec } from '../generated/specs/musicBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const musicBySpec = spec;
export const musicBy = predicate;
export const musicById = id;
export const musicByAtomData = atomData;

export default predicate;
