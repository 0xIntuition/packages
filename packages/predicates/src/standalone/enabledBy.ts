import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { enabledBy as predicateSpec } from '../generated/specs/enabledBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const enabledBySpec = spec;
export const enabledBy = predicate;
export const enabledById = id;
export const enabledByAtomData = atomData;

export default predicate;
