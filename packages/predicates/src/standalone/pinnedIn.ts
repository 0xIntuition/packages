import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { pinnedIn as predicateSpec } from '../generated/specs/pinnedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const pinnedInSpec = spec;
export const pinnedIn = predicate;
export const pinnedInId = id;
export const pinnedInAtomData = atomData;

export default predicate;
