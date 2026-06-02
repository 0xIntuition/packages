import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { actor as predicateSpec } from '../generated/specs/actor.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const actorSpec = spec;
export const actor = predicate;
export const actorId = id;
export const actorAtomData = atomData;

export default predicate;
