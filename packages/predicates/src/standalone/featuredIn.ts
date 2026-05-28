import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { featuredIn as predicateSpec } from '../generated/specs/featuredIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const featuredInSpec = spec;
export const featuredIn = predicate;
export const featuredInId = id;
export const featuredInAtomData = atomData;

export default predicate;
