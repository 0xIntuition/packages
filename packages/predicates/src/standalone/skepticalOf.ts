import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { skepticalOf as predicateSpec } from '../generated/specs/skepticalOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const skepticalOfSpec = spec;
export const skepticalOf = predicate;
export const skepticalOfId = id;
export const skepticalOfAtomData = atomData;

export default predicate;
