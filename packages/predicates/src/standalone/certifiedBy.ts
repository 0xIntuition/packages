import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { certifiedBy as predicateSpec } from '../generated/specs/certifiedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const certifiedBySpec = spec;
export const certifiedBy = predicate;
export const certifiedById = id;
export const certifiedByAtomData = atomData;

export default predicate;
