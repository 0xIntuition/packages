import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { worseThan as predicateSpec } from '../generated/specs/worseThan.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const worseThanSpec = spec;
export const worseThan = predicate;
export const worseThanId = id;
export const worseThanAtomData = atomData;

export default predicate;
