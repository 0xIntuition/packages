import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { musicGroupMember as predicateSpec } from '../generated/specs/musicGroupMember.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const musicGroupMemberSpec = spec;
export const musicGroupMember = predicate;
export const musicGroupMemberId = id;
export const musicGroupMemberAtomData = atomData;

export default predicate;
