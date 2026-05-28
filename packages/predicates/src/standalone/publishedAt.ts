import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { publishedAt as predicateSpec } from '../generated/specs/publishedAt.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const publishedAtSpec = spec;
export const publishedAt = predicate;
export const publishedAtId = id;
export const publishedAtAtomData = atomData;

export default predicate;
