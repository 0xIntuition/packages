import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { areaServed as predicateSpec } from '../generated/specs/areaServed.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const areaServedSpec = spec;
export const areaServed = predicate;
export const areaServedId = id;
export const areaServedAtomData = atomData;

export default predicate;
