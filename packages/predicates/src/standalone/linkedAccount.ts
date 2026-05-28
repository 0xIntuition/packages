import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { linkedAccount as predicateSpec } from '../generated/specs/linkedAccount.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const linkedAccountSpec = spec;
export const linkedAccount = predicate;
export const linkedAccountId = id;
export const linkedAccountAtomData = atomData;

export default predicate;
