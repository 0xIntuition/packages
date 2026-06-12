import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { brand as predicateSpec } from '../generated/specs/brand.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const brandSpec = spec;
export const brand = predicate;
export const brandId = id;
export const brandAtomData = atomData;

export default predicate;
