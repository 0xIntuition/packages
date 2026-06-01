import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgManuscript = {
	id: 'schema:Manuscript',
	name: 'Manuscript',
	label: 'Manuscript',
	comment: 'A book, document, or piece of music written by hand rather than typed or printed.',
	subClassOf: ['CreativeWork', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgManuscript;
export const Manuscript = schemaOrgManuscript;

export default schemaOrgManuscript;
