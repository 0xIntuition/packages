import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { listedOn as predicateSpec } from '../generated/specs/listedOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const listedOnSpec = spec;
export const listedOn = predicate;
export const listedOnId = id;
export const listedOnAtomData = atomData;

export default predicate;
