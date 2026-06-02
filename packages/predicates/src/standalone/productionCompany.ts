import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { productionCompany as predicateSpec } from '../generated/specs/productionCompany.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const productionCompanySpec = spec;
export const productionCompany = predicate;
export const productionCompanyId = id;
export const productionCompanyAtomData = atomData;

export default predicate;
