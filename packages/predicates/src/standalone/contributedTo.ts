import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { contributedTo as predicateSpec } from '../generated/specs/contributedTo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const contributedToSpec = spec;
export const contributedTo = predicate;
export const contributedToId = id;
export const contributedToAtomData = atomData;

export default predicate;
