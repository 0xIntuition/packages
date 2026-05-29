import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { rankedAbove as predicateSpec } from '../generated/specs/rankedAbove.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const rankedAboveSpec = spec;
export const rankedAbove = predicate;
export const rankedAboveId = id;
export const rankedAboveAtomData = atomData;

export default predicate;
