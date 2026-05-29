import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { confirmedBy as predicateSpec } from '../generated/specs/confirmedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const confirmedBySpec = spec;
export const confirmedBy = predicate;
export const confirmedById = id;
export const confirmedByAtomData = atomData;

export default predicate;
