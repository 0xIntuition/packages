import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { compatibleWith as predicateSpec } from '../generated/specs/compatibleWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const compatibleWithSpec = spec;
export const compatibleWith = predicate;
export const compatibleWithId = id;
export const compatibleWithAtomData = atomData;

export default predicate;
