import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { hasTag as predicateSpec } from '../generated/specs/hasTag.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const hasTagSpec = spec;
export const hasTag = predicate;
export const hasTagId = id;
export const hasTagAtomData = atomData;

export default predicate;
