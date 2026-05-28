import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { studentOf as predicateSpec } from '../generated/specs/studentOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const studentOfSpec = spec;
export const studentOf = predicate;
export const studentOfId = id;
export const studentOfAtomData = atomData;

export default predicate;
