import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { parentItem as predicateSpec } from '../generated/specs/parentItem.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const parentItemSpec = spec;
export const parentItem = predicate;
export const parentItemId = id;
export const parentItemAtomData = atomData;

export default predicate;
