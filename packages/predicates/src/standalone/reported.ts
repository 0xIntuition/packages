import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { reported as predicateSpec } from '../generated/specs/reported.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const reportedSpec = spec;
export const reported = predicate;
export const reportedId = id;
export const reportedAtomData = atomData;

export default predicate;
