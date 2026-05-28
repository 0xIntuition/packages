import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { memberOf as predicateSpec } from '../generated/specs/memberOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const memberOfSpec = spec;
export const memberOf = predicate;
export const memberOfId = id;
export const memberOfAtomData = atomData;

export default predicate;
