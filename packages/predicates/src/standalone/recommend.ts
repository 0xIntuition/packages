import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { recommend as predicateSpec } from '../generated/specs/recommend.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const recommendSpec = spec;
export const recommend = predicate;
export const recommendId = id;
export const recommendAtomData = atomData;

export default predicate;
