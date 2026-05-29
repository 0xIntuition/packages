import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { outperform as predicateSpec } from '../generated/specs/outperform.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const outperformSpec = spec;
export const outperform = predicate;
export const outperformId = id;
export const outperformAtomData = atomData;

export default predicate;
