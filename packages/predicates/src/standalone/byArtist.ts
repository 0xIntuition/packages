import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { byArtist as predicateSpec } from '../generated/specs/byArtist.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const byArtistSpec = spec;
export const byArtist = predicate;
export const byArtistId = id;
export const byArtistAtomData = atomData;

export default predicate;
