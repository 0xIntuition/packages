import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { betterThan as predicateSpec } from '../generated/specs/betterThan.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const betterThanSpec = spec;
export const betterThan = predicate;
export const betterThanId = id;
export const betterThanAtomData = atomData;

export default predicate;
