import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { support as predicateSpec } from '../generated/specs/support.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const supportSpec = spec;
export const support = predicate;
export const supportId = id;
export const supportAtomData = atomData;

export default predicate;
