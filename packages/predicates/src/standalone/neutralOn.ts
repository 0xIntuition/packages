import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { neutralOn as predicateSpec } from '../generated/specs/neutralOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const neutralOnSpec = spec;
export const neutralOn = predicate;
export const neutralOnId = id;
export const neutralOnAtomData = atomData;

export default predicate;
