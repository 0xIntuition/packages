import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { endorse as predicateSpec } from '../generated/specs/endorse.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const endorseSpec = spec;
export const endorse = predicate;
export const endorseId = id;
export const endorseAtomData = atomData;

export default predicate;
