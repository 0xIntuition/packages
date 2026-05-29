import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { sponsoredBy as predicateSpec } from '../generated/specs/sponsoredBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const sponsoredBySpec = spec;
export const sponsoredBy = predicate;
export const sponsoredById = id;
export const sponsoredByAtomData = atomData;

export default predicate;
