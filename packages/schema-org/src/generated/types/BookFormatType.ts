import type { SchemaOrgTypeSpec } from '../../types.js';

export const schemaOrgBookFormatType = {
	id: 'schema:BookFormatType',
	name: 'BookFormatType',
	label: 'BookFormatType',
	comment: 'The publication format of the book.',
	subClassOf: ['Enumeration', 'Intangible', 'Thing'],
	properties: [],
} as const satisfies SchemaOrgTypeSpec;

export const spec = schemaOrgBookFormatType;
export const BookFormatType = schemaOrgBookFormatType;

export default schemaOrgBookFormatType;
