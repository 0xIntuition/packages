import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { governedBy as predicateSpec } from '../generated/specs/governedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const governedBySpec = spec;
export const governedBy = predicate;
export const governedById = id;
export const governedByAtomData = atomData;

export default predicate;
