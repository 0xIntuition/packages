import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { alternativeTo as predicateSpec } from '../generated/specs/alternativeTo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const alternativeToSpec = spec;
export const alternativeTo = predicate;
export const alternativeToId = id;
export const alternativeToAtomData = atomData;

export default predicate;
