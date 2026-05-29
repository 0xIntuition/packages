import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { affiliatedWith as predicateSpec } from '../generated/specs/affiliatedWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const affiliatedWithSpec = spec;
export const affiliatedWith = predicate;
export const affiliatedWithId = id;
export const affiliatedWithAtomData = atomData;

export default predicate;
