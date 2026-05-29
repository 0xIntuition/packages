import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { investedIn as predicateSpec } from '../generated/specs/investedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const investedInSpec = spec;
export const investedIn = predicate;
export const investedInId = id;
export const investedInAtomData = atomData;

export default predicate;
