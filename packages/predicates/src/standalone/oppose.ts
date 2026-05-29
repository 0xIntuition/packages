import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { oppose as predicateSpec } from '../generated/specs/oppose.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const opposeSpec = spec;
export const oppose = predicate;
export const opposeId = id;
export const opposeAtomData = atomData;

export default predicate;
