import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { use as predicateSpec } from '../generated/specs/use.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const useSpec = spec;
export const use = predicate;
export const useId = id;
export const useAtomData = atomData;

export default predicate;
