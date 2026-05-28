import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { authoredBy as predicateSpec } from '../generated/specs/authoredBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const authoredBySpec = spec;
export const authoredBy = predicate;
export const authoredById = id;
export const authoredByAtomData = atomData;

export default predicate;
