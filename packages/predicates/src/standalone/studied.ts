import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { studied as predicateSpec } from '../generated/specs/studied.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const studiedSpec = spec;
export const studied = predicate;
export const studiedId = id;
export const studiedAtomData = atomData;

export default predicate;
