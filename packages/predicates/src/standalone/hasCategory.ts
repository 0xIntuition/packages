import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { hasCategory as predicateSpec } from '../generated/specs/hasCategory.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const hasCategorySpec = spec;
export const hasCategory = predicate;
export const hasCategoryId = id;
export const hasCategoryAtomData = atomData;

export default predicate;
