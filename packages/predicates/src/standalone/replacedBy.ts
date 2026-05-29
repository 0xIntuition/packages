import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { replacedBy as predicateSpec } from '../generated/specs/replacedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const replacedBySpec = spec;
export const replacedBy = predicate;
export const replacedById = id;
export const replacedByAtomData = atomData;

export default predicate;
