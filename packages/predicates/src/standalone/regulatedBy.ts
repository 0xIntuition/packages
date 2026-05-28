import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { regulatedBy as predicateSpec } from '../generated/specs/regulatedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const regulatedBySpec = spec;
export const regulatedBy = predicate;
export const regulatedById = id;
export const regulatedByAtomData = atomData;

export default predicate;
