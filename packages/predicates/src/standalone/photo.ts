import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { photo as predicateSpec } from '../generated/specs/photo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const photoSpec = spec;
export const photo = predicate;
export const photoId = id;
export const photoAtomData = atomData;

export default predicate;
