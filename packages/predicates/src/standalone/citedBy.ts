import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { citedBy as predicateSpec } from '../generated/specs/citedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const citedBySpec = spec;
export const citedBy = predicate;
export const citedById = id;
export const citedByAtomData = atomData;

export default predicate;
