import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { publisher as predicateSpec } from '../generated/specs/publisher.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const publisherSpec = spec;
export const publisher = predicate;
export const publisherId = id;
export const publisherAtomData = atomData;

export default predicate;
