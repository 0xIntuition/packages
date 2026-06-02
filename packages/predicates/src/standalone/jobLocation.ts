import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { jobLocation as predicateSpec } from '../generated/specs/jobLocation.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const jobLocationSpec = spec;
export const jobLocation = predicate;
export const jobLocationId = id;
export const jobLocationAtomData = atomData;

export default predicate;
