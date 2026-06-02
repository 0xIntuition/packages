import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { parentOrganization as predicateSpec } from '../generated/specs/parentOrganization.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const parentOrganizationSpec = spec;
export const parentOrganization = predicate;
export const parentOrganizationId = id;
export const parentOrganizationAtomData = atomData;

export default predicate;
