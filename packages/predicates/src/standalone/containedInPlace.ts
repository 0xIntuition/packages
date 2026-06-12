import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { containedInPlace as predicateSpec } from '../generated/specs/containedInPlace.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const containedInPlaceSpec = spec;
export const containedInPlace = predicate;
export const containedInPlaceId = id;
export const containedInPlaceAtomData = atomData;

export default predicate;
