import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { stakedIn as predicateSpec } from '../generated/specs/stakedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const stakedInSpec = spec;
export const stakedIn = predicate;
export const stakedInId = id;
export const stakedInAtomData = atomData;

export default predicate;
