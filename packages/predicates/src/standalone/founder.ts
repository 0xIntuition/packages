import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { founder as predicateSpec } from '../generated/specs/founder.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const founderSpec = spec;
export const founder = predicate;
export const founderId = id;
export const founderAtomData = atomData;

export default predicate;
