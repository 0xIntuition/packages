import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { listedIn as predicateSpec } from '../generated/specs/listedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const listedInSpec = spec;
export const listedIn = predicate;
export const listedInId = id;
export const listedInAtomData = atomData;

export default predicate;
