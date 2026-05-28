import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { dependOn as predicateSpec } from '../generated/specs/dependOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const dependOnSpec = spec;
export const dependOn = predicate;
export const dependOnId = id;
export const dependOnAtomData = atomData;

export default predicate;
