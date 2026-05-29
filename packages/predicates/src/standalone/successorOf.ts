import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { successorOf as predicateSpec } from '../generated/specs/successorOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const successorOfSpec = spec;
export const successorOf = predicate;
export const successorOfId = id;
export const successorOfAtomData = atomData;

export default predicate;
