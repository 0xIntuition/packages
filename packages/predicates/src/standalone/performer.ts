import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { performer as predicateSpec } from '../generated/specs/performer.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const performerSpec = spec;
export const performer = predicate;
export const performerId = id;
export const performerAtomData = atomData;

export default predicate;
