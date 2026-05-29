import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { competeWith as predicateSpec } from '../generated/specs/competeWith.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const competeWithSpec = spec;
export const competeWith = predicate;
export const competeWithId = id;
export const competeWithAtomData = atomData;

export default predicate;
