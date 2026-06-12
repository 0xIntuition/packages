import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { primaryImageOfPage as predicateSpec } from '../generated/specs/primaryImageOfPage.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const primaryImageOfPageSpec = spec;
export const primaryImageOfPage = predicate;
export const primaryImageOfPageId = id;
export const primaryImageOfPageAtomData = atomData;

export default predicate;
