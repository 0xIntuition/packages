import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { partOfSeries as predicateSpec } from '../generated/specs/partOfSeries.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const partOfSeriesSpec = spec;
export const partOfSeries = predicate;
export const partOfSeriesId = id;
export const partOfSeriesAtomData = atomData;

export default predicate;
