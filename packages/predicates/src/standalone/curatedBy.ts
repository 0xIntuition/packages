import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { curatedBy as predicateSpec } from '../generated/specs/curatedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const curatedBySpec = spec;
export const curatedBy = predicate;
export const curatedById = id;
export const curatedByAtomData = atomData;

export default predicate;
