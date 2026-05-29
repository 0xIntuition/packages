import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { employedBy as predicateSpec } from '../generated/specs/employedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const employedBySpec = spec;
export const employedBy = predicate;
export const employedById = id;
export const employedByAtomData = atomData;

export default predicate;
