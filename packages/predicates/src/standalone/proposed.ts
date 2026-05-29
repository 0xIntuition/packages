import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { proposed as predicateSpec } from '../generated/specs/proposed.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const proposedSpec = spec;
export const proposed = predicate;
export const proposedId = id;
export const proposedAtomData = atomData;

export default predicate;
