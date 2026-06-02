import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { containsPlace as predicateSpec } from '../generated/specs/containsPlace.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const containsPlaceSpec = spec;
export const containsPlace = predicate;
export const containsPlaceId = id;
export const containsPlaceAtomData = atomData;

export default predicate;
