import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { superEvent as predicateSpec } from '../generated/specs/superEvent.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const superEventSpec = spec;
export const superEvent = predicate;
export const superEventId = id;
export const superEventAtomData = atomData;

export default predicate;
