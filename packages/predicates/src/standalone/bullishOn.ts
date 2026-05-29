import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { bullishOn as predicateSpec } from '../generated/specs/bullishOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const bullishOnSpec = spec;
export const bullishOn = predicate;
export const bullishOnId = id;
export const bullishOnAtomData = atomData;

export default predicate;
