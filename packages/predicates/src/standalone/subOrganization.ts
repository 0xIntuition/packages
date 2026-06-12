import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { subOrganization as predicateSpec } from '../generated/specs/subOrganization.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const subOrganizationSpec = spec;
export const subOrganization = predicate;
export const subOrganizationId = id;
export const subOrganizationAtomData = atomData;

export default predicate;
