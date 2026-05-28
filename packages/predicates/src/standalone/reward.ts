import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { reward as predicateSpec } from '../generated/specs/reward.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const rewardSpec = spec;
export const reward = predicate;
export const rewardId = id;
export const rewardAtomData = atomData;

export default predicate;
