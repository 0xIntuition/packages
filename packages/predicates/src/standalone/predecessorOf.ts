import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { predecessorOf as predicateSpec } from '../generated/specs/predecessorOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const predecessorOfSpec = spec;
export const predecessorOf = predicate;
export const predecessorOfId = id;
export const predecessorOfAtomData = atomData;

export default predicate;
