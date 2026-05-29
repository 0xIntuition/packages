import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { pricedIn as predicateSpec } from '../generated/specs/pricedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const pricedInSpec = spec;
export const pricedIn = predicate;
export const pricedInId = id;
export const pricedInAtomData = atomData;

export default predicate;
