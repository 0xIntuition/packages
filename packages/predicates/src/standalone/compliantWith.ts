import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { compliantWith as predicateSpec } from '../generated/specs/compliantWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const compliantWithSpec = spec;
export const compliantWith = predicate;
export const compliantWithId = id;
export const compliantWithAtomData = atomData;

export default predicate;
