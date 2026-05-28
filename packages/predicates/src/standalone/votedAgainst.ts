import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { votedAgainst as predicateSpec } from '../generated/specs/votedAgainst.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const votedAgainstSpec = spec;
export const votedAgainst = predicate;
export const votedAgainstId = id;
export const votedAgainstAtomData = atomData;

export default predicate;
