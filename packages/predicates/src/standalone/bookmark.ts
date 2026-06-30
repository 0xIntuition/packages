import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { bookmark as predicateSpec } from '../generated/specs/bookmark.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const bookmarkSpec = spec;
export const bookmark = predicate;
export const bookmarkId = id;
export const bookmarkAtomData = atomData;

export default predicate;
