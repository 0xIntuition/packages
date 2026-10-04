import { calculateAtomId } from './atom-id.js';

/**
 * The shared first-person subject atom. Its identity is the exact byte `I`
 * (Portal-compatible); it is deliberately NOT an IID and must never be
 * wrapped in one. Used as the subject of shared-market action triples such
 * as `I -> follow -> (account)`.
 */
export const I_SUBJECT_DATA = 'I';
export const I_SUBJECT = I_SUBJECT_DATA;
export const I_SUBJECT_ID = calculateAtomId(I_SUBJECT_DATA);
