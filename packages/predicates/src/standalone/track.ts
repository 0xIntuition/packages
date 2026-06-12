import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { track as predicateSpec } from '../generated/specs/track.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const trackSpec = spec;
export const track = predicate;
export const trackId = id;
export const trackAtomData = atomData;

export default predicate;
