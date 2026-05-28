import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { hasDescription as predicateSpec } from '../generated/specs/hasDescription.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const hasDescriptionSpec = spec;
export const hasDescription = predicate;
export const hasDescriptionId = id;
export const hasDescriptionAtomData = atomData;

export default predicate;
