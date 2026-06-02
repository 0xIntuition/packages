import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { targetProduct as predicateSpec } from '../generated/specs/targetProduct.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const targetProductSpec = spec;
export const targetProduct = predicate;
export const targetProductId = id;
export const targetProductAtomData = atomData;

export default predicate;
