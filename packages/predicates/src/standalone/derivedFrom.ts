import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { derivedFrom as predicateSpec } from '../generated/specs/derivedFrom.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const derivedFromSpec = spec;
export const derivedFrom = predicate;
export const derivedFromId = id;
export const derivedFromAtomData = atomData;

export default predicate;
