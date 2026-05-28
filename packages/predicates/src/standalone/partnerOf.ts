import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { partnerOf as predicateSpec } from '../generated/specs/partnerOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const partnerOfSpec = spec;
export const partnerOf = predicate;
export const partnerOfId = id;
export const partnerOfAtomData = atomData;

export default predicate;
