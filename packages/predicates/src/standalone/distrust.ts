import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { distrust as predicateSpec } from '../generated/specs/distrust.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const distrustSpec = spec;
export const distrust = predicate;
export const distrustId = id;
export const distrustAtomData = atomData;

export default predicate;
