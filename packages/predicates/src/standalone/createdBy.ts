import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { createdBy as predicateSpec } from '../generated/specs/createdBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const createdBySpec = spec;
export const createdBy = predicate;
export const createdById = id;
export const createdByAtomData = atomData;

export default predicate;
