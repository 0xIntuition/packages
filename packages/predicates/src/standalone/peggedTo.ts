import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { peggedTo as predicateSpec } from '../generated/specs/peggedTo.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const peggedToSpec = spec;
export const peggedTo = predicate;
export const peggedToId = id;
export const peggedToAtomData = atomData;

export default predicate;
