import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { softwareAddOn as predicateSpec } from '../generated/specs/softwareAddOn.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const softwareAddOnSpec = spec;
export const softwareAddOn = predicate;
export const softwareAddOnId = id;
export const softwareAddOnAtomData = atomData;

export default predicate;
