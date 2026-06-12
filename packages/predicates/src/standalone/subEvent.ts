import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { subEvent as predicateSpec } from '../generated/specs/subEvent.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const subEventSpec = spec;
export const subEvent = predicate;
export const subEventId = id;
export const subEventAtomData = atomData;

export default predicate;
