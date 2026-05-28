import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { hasType as predicateSpec } from '../generated/specs/hasType.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const hasTypeSpec = spec;
export const hasType = predicate;
export const hasTypeId = id;
export const hasTypeAtomData = atomData;

export default predicate;
