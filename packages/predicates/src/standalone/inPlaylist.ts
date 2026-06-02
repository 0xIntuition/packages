import { calculateAtomId, createPredicateAtomData } from '@0xintuition/ids';
import { inPlaylist as predicateSpec } from '../generated/specs/inPlaylist.js';
import { definePredicateRecord } from '../record.js';

export const spec = predicateSpec;
export const key = spec.key;
export const predicate = definePredicateRecord(spec);
export const atomData = createPredicateAtomData(spec.name, spec.description);
export const id = calculateAtomId(atomData);
export const inPlaylistSpec = spec;
export const inPlaylist = predicate;
export const inPlaylistId = id;
export const inPlaylistAtomData = atomData;

export default predicate;
