import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { supersede as predicateSpec } from '../generated/specs/supersede.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const supersedeSpec = spec;
export const supersede = predicate;
export const supersedeId = id;
export const supersedeAtomData = atomData;

export default predicate;
