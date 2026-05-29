import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { expertIn as predicateSpec } from '../generated/specs/expertIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const expertInSpec = spec;
export const expertIn = predicate;
export const expertInId = id;
export const expertInAtomData = atomData;

export default predicate;
