import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { delegatedTo as predicateSpec } from '../generated/specs/delegatedTo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const delegatedToSpec = spec;
export const delegatedTo = predicate;
export const delegatedToId = id;
export const delegatedToAtomData = atomData;

export default predicate;
