import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { blocked as predicateSpec } from '../generated/specs/blocked.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const blockedSpec = spec;
export const blocked = predicate;
export const blockedId = id;
export const blockedAtomData = atomData;

export default predicate;
