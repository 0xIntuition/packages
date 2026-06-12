import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgNoteDigitalDocument = {
	id: 'schema:NoteDigitalDocument',
	name: 'NoteDigitalDocument',
	label: 'NoteDigitalDocument',
	comment: 'A file containing a note, primarily for the author.',
	subClassOf: ['DigitalDocument', 'CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgNoteDigitalDocument;
export const NoteDigitalDocument = schemaOrgNoteDigitalDocument;

export default schemaOrgNoteDigitalDocument;
