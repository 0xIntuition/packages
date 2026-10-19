/**
 * Schema.org property aliases for classification identity fields.
 *
 * Classification specs keep concise form keys, while canonical JSON-LD must
 * use the schema.org property names emitted by classification and seed
 * pipelines. Keep this table beside the identity ladders so app adapters do
 * not invent per-surface translations.
 *
 * Audit (2026-08-13): ISBN (`isbn`), GTIN (`gtin`), Wikidata/MBID/OLID via
 * `sameAs`, and the remaining direct identity fields already use matching
 * keys. MusicRecording is the only mismatch: spec `isrc` vs schema.org
 * `isrcCode`.
 */
export const IDENTITY_FIELD_SCHEMA_ORG_ALIASES: Readonly<Record<string, readonly string[]>> = {
	isrc: ['isrcCode'],
};
