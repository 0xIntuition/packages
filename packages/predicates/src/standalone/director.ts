import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { director as predicateSpec } from '../generated/specs/director.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const directorSpec = spec;
export const director = predicate;
export const directorId = id;
export const directorAtomData = atomData;

export default predicate;
