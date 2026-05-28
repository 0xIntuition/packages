import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { vouchFor as predicateSpec } from '../generated/specs/vouchFor.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const vouchForSpec = spec;
export const vouchFor = predicate;
export const vouchForId = id;
export const vouchForAtomData = atomData;

export default predicate;
