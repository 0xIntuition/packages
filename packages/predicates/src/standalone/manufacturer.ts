import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { manufacturer as predicateSpec } from '../generated/specs/manufacturer.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const manufacturerSpec = spec;
export const manufacturer = predicate;
export const manufacturerId = id;
export const manufacturerAtomData = atomData;

export default predicate;
