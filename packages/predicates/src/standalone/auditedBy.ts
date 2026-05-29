import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { auditedBy as predicateSpec } from '../generated/specs/auditedBy.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const auditedBySpec = spec;
export const auditedBy = predicate;
export const auditedById = id;
export const auditedByAtomData = atomData;

export default predicate;
