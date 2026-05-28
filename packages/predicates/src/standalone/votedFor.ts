import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { votedFor as predicateSpec } from '../generated/specs/votedFor.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const votedForSpec = spec;
export const votedFor = predicate;
export const votedForId = id;
export const votedForAtomData = atomData;

export default predicate;
