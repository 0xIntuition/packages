import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { locatedIn as predicateSpec } from '../generated/specs/locatedIn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const locatedInSpec = spec;
export const locatedIn = predicate;
export const locatedInId = id;
export const locatedInAtomData = atomData;

export default predicate;
