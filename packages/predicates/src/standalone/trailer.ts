import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { trailer as predicateSpec } from '../generated/specs/trailer.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const trailerSpec = spec;
export const trailer = predicate;
export const trailerId = id;
export const trailerAtomData = atomData;

export default predicate;
