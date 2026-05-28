import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { reference as predicateSpec } from '../generated/specs/reference.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const referenceSpec = spec;
export const reference = predicate;
export const referenceId = id;
export const referenceAtomData = atomData;

export default predicate;
