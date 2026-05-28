import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { availableOn as predicateSpec } from '../generated/specs/availableOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const availableOnSpec = spec;
export const availableOn = predicate;
export const availableOnId = id;
export const availableOnAtomData = atomData;

export default predicate;
