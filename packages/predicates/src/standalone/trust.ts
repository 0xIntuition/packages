import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { trust as predicateSpec } from '../generated/specs/trust.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const trustSpec = spec;
export const trust = predicate;
export const trustId = id;
export const trustAtomData = atomData;

export default predicate;
