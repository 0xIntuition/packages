import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { organizer as predicateSpec } from '../generated/specs/organizer.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const organizerSpec = spec;
export const organizer = predicate;
export const organizerId = id;
export const organizerAtomData = atomData;

export default predicate;
