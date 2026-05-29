import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { speak as predicateSpec } from '../generated/specs/speak.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const speakSpec = spec;
export const speak = predicate;
export const speakId = id;
export const speakAtomData = atomData;

export default predicate;
