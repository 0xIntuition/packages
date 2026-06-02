import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { inAlbum as predicateSpec } from '../generated/specs/inAlbum.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const inAlbumSpec = spec;
export const inAlbum = predicate;
export const inAlbumId = id;
export const inAlbumAtomData = atomData;

export default predicate;
