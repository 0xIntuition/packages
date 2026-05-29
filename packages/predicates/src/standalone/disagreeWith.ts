import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { disagreeWith as predicateSpec } from '../generated/specs/disagreeWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const disagreeWithSpec = spec;
export const disagreeWith = predicate;
export const disagreeWithId = id;
export const disagreeWithAtomData = atomData;

export default predicate;
