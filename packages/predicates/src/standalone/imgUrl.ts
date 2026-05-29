import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { imgUrl as predicateSpec } from '../generated/specs/imgUrl.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const imgUrlSpec = spec;
export const imgUrl = predicate;
export const imgUrlId = id;
export const imgUrlAtomData = atomData;

export default predicate;
