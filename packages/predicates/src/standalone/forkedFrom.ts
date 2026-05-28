import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { forkedFrom as predicateSpec } from '../generated/specs/forkedFrom.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const forkedFromSpec = spec;
export const forkedFrom = predicate;
export const forkedFromId = id;
export const forkedFromAtomData = atomData;

export default predicate;
