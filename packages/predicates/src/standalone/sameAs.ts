import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { sameAs as predicateSpec } from '../generated/specs/sameAs.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const sameAsSpec = spec;
export const sameAs = predicate;
export const sameAsId = id;
export const sameAsAtomData = atomData;

export default predicate;
