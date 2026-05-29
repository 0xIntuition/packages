import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { hasSource as predicateSpec } from '../generated/specs/hasSource.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const hasSourceSpec = spec;
export const hasSource = predicate;
export const hasSourceId = id;
export const hasSourceAtomData = atomData;

export default predicate;
