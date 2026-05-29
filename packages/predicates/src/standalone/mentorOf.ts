import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { mentorOf as predicateSpec } from '../generated/specs/mentorOf.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const mentorOfSpec = spec;
export const mentorOf = predicate;
export const mentorOfId = id;
export const mentorOfAtomData = atomData;

export default predicate;
