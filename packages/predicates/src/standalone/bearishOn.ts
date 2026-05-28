import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { bearishOn as predicateSpec } from '../generated/specs/bearishOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const bearishOnSpec = spec;
export const bearishOn = predicate;
export const bearishOnId = id;
export const bearishOnAtomData = atomData;

export default predicate;
