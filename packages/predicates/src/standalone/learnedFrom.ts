import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { learnedFrom as predicateSpec } from '../generated/specs/learnedFrom.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const learnedFromSpec = spec;
export const learnedFrom = predicate;
export const learnedFromId = id;
export const learnedFromAtomData = atomData;

export default predicate;
