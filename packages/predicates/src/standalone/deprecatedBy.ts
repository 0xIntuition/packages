import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { deprecatedBy as predicateSpec } from '../generated/specs/deprecatedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const deprecatedBySpec = spec;
export const deprecatedBy = predicate;
export const deprecatedById = id;
export const deprecatedByAtomData = atomData;

export default predicate;
