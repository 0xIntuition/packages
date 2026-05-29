import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { attestedBy as predicateSpec } from '../generated/specs/attestedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const attestedBySpec = spec;
export const attestedBy = predicate;
export const attestedById = id;
export const attestedByAtomData = atomData;

export default predicate;
