import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { like as predicateSpec } from '../generated/specs/like.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const likeSpec = spec;
export const like = predicate;
export const likeId = id;
export const likeAtomData = atomData;

export default predicate;
