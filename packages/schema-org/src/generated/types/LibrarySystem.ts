import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgLibrarySystem = {
	id: 'schema:LibrarySystem',
	name: 'LibrarySystem',
	label: 'LibrarySystem',
	comment: 'A [[LibrarySystem]] is a collaborative system amongst several libraries.',
	subClassOf: ['Organization', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgLibrarySystem;
export const LibrarySystem = schemaOrgLibrarySystem;

export default schemaOrgLibrarySystem;
