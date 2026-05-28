import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { teach as predicateSpec } from '../generated/specs/teach.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const teachSpec = spec;
export const teach = predicate;
export const teachId = id;
export const teachAtomData = atomData;

export default predicate;
