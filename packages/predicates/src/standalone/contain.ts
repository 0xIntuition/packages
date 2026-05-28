import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { contain as predicateSpec } from '../generated/specs/contain.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const containSpec = spec;
export const contain = predicate;
export const containId = id;
export const containAtomData = atomData;

export default predicate;
