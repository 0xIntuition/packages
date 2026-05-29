import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { agreeWith as predicateSpec } from '../generated/specs/agreeWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const agreeWithSpec = spec;
export const agreeWith = predicate;
export const agreeWithId = id;
export const agreeWithAtomData = atomData;

export default predicate;
