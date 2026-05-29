import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { implement as predicateSpec } from '../generated/specs/implement.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const implementSpec = spec;
export const implement = predicate;
export const implementId = id;
export const implementAtomData = atomData;

export default predicate;
