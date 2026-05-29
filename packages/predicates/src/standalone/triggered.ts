import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { triggered as predicateSpec } from '../generated/specs/triggered.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const triggeredSpec = spec;
export const triggered = predicate;
export const triggeredId = id;
export const triggeredAtomData = atomData;

export default predicate;
