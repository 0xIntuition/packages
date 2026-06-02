import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { provider as predicateSpec } from '../generated/specs/provider.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const providerSpec = spec;
export const provider = predicate;
export const providerId = id;
export const providerAtomData = atomData;

export default predicate;
