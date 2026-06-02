import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { alumniOf as predicateSpec } from '../generated/specs/alumniOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const alumniOfSpec = spec;
export const alumniOf = predicate;
export const alumniOfId = id;
export const alumniOfAtomData = atomData;

export default predicate;
